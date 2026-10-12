import prisma from "../../../shared/prisma";
import bcrypt from "bcryptjs";
import ApiError from "../../../errors/ApiErrors";
import { jwtHelpers } from "../../../helpers/jwtHelpers";
import config from "../../../config";
import { BusinessProfile, User, UserRole } from "@prisma/client";
import generateOTP from "../../../helpers/generateOtp";
import { uploadInSpace } from "../../../shared/UploadHelper";
import { emailQueue } from "../../../queue/email.queue";
import { uploadToDigitalOceanAWS } from "../../../helpers/uploadToDigitalOceanAWS";

const loginUserIntoDB = async (payload: {
  email: string;
  password: string;
}) => {
  const user = await prisma.user.findUnique({
    where: {
      email: payload.email,
    },
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.status === "Deleted") {
    throw new ApiError(
      400,
      "Your account already deleted, please contact Admin"
    );
  }

  const isPasswordValid = await bcrypt.compare(
    payload.password,
    user?.password
  );

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid credentials");
  }

  const accessToken = jwtHelpers.generateToken(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      userName: (user?.firstName ?? "") + (user?.lastName ?? ""),
    },
    config.jwt.jwt_secret as string,
    config.jwt.expires_in as string
  );

  return {
    accessToken,
    id: user.id,
    role: user.role,
  };
};

const adminLogin = async (payload: {
  email: string;
  password: string;
  fcmToken: string;
}) => {
  const user = await prisma.user.findUnique({
    where: {
      email: payload.email,
      role: "Admin",
    },
  });

  if (!user) {
    throw new ApiError(404, "Admin not found");
  }

  if (user.status === "Deleted") {
    throw new ApiError(
      400,
      "Your account already deleted, please contact Admin"
    );
  }

  const isPasswordValid = await bcrypt.compare(
    payload.password,
    user?.password
  );

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid credentials");
  }

  const accessToken = jwtHelpers.generateToken(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      userName: (user.firstName ?? "") + (user.lastName ?? ""),
    },
    config.jwt.jwt_secret as string,
    config.jwt.expires_in as string
  );

  return {
    accessToken,
    id: user.id,
    role: user.role,
  };
};

const authLoginIntoDB = async (payload: User) => {
  const user = await prisma.user.findFirst({
    where: {
      email: payload.email,
    },
  });
  if (user) {
    if (user.status === "Deleted") {
      throw new ApiError(
        400,
        "Your account already deleted, please contact Admin"
      );
    }
    const accessToken = jwtHelpers.generateToken(
      { id: user.id, email: user.email, role: user.role },
      config.jwt.jwt_secret as string,
      config.jwt.expires_in as string
    );

    return {
      accessToken,
      id: user.id,
      role: user.role,
    };
  } else {
    const plainPassword = "123456";
    const hashedPassword = await bcrypt.hash(plainPassword, 10);
    const user = await prisma.user.create({
      data: {
        ...payload,
        password: hashedPassword,
        role: UserRole.User,
      },
    });

    const accessToken = jwtHelpers.generateToken(
      { id: user.id, email: user.email, role: user.role },
      config.jwt.jwt_secret as string,
      config.jwt.expires_in as string
    );

    return {
      accessToken,
      id: user.id,
      role: user.role,
    };
  }
};

const sendForgotPasswordOtpDB = async (email: string) => {
  const existringUser = await prisma.user.findUnique({
    where: {
      email: email,
    },
  });
  if (!existringUser) {
    throw new ApiError(404, "User not found");
  }

  if (existringUser.status === "Deleted") {
    throw new ApiError(
      400,
      "Your account already deleted, please contact Admin"
    );
  }
  // Generate OTP and expiry time
  const otp = generateOTP(); // 4-digit OTP
  const OTP_EXPIRATION_TIME = 5 * 60 * 1000; // 5 minute
  const expiresAt = Date.now() + OTP_EXPIRATION_TIME;
  await emailQueue.add("forgotPasswordOtp", {
    email: existringUser.email,
    fullName: existringUser?.firstName + " " + existringUser?.lastName,
    otp,
  });
  // await sendEmail(email, subject, html);
  await prisma.otp.upsert({
    where: {
      email: email,
    },
    update: { otpCode: otp, expiresAt: new Date(expiresAt) },
    create: { email: email, otpCode: otp, expiresAt: new Date(expiresAt) },
  });

  return otp;
};

const verifyForgotPasswordOtpCodeDB = async (payload: any) => {
  const { email, otp } = payload;

  if (!email && !otp) {
    throw new ApiError(400, "Email and OTP are required.");
  }

  const user = await prisma.user.findUnique({ where: { email: email } });
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const userId = user.id;

  const verifyData = await prisma.otp.findUnique({
    where: {
      email: email,
    },
  });

  if (!verifyData) {
    throw new ApiError(400, "Invalid or expired OTP.");
  }

  const { otpCode: savedOtp, expiresAt } = verifyData;

  if (otp !== savedOtp) {
    throw new ApiError(401, "Invalid OTP.");
  }

  if (Date.now() > expiresAt.getTime()) {
    await prisma.otp.delete({
      where: {
        email: email,
      },
    }); // OTP has expired
    throw new ApiError(410, "OTP has expired. Please request a new OTP.");
  }

  // OTP is valid
  await prisma.otp.delete({
    where: {
      email: email,
    },
  });

  const forgetToken = jwtHelpers.generateToken(
    { id: userId, email },
    config.jwt.jwt_secret as string,
    config.jwt.expires_in as string
  );

  return { forgetToken: forgetToken };
};

const resetForgotPasswordDB = async (newPassword: string, userId: string) => {
  const existingUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!existingUser) {
    throw new ApiError(404, "user not found");
  }
  const email = existingUser.email as string;
  const hashedPassword = await bcrypt.hash(
    newPassword,
    Number(config.jwt.gen_salt)
  );

  await prisma.user.update({
    where: {
      email: email,
    },
    data: {
      password: hashedPassword,
    },
  });
  return;
};

const getProfileFromDB = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      businessProfile: {
        select: {
          id: true,
          businessName: true,
          businessLogo: true,
          businessEmail: true,
          location: true,
          googleReviewUrI: true,
          primaryColur: true,
          isSubscribe: true,
          subscription: {
            select: {
              id: true,
              status: true,
              priceId: true,
              paymentMethodId: true,
              stripeSubscriptionId: true,
              Plan: {
                select: {
                  id: true,
                  planType: true,
                  amount: true,
                  interval: true,
                },
              },
            },
          },
        },
      },
    },
  });
  if (!user) {
    throw new ApiError(404, "user not found!");
  }

  const { password, createdAt, updatedAt, ...sanitizedUser } = user;

  return sanitizedUser;
};

const updateProfileIntoDB = async (
  payload: User,
  userId: string,
  file: Express.Multer.File
) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new ApiError(404, "user not found for edit user");
  }

  if (user.status === "Deleted") {
    throw new ApiError(
      400,
      "Your account already deleted, please contact Admin"
    );
  }

  let profileImage;

  if (file) {
    profileImage = await uploadInSpace(file, "users/profileImage");
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      ...payload,
      profileImage: file ? profileImage : user.profileImage,
    },
  });
  return;
};

const changePassword = async (
  userId: string,
  payload: {
    oldPassword: string;
    newPassword: string;
  }
) => {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  if (user.status === "Deleted") {
    throw new ApiError(
      400,
      "Your account already deleted, please contact Admin"
    );
  }
  const isPasswordValid = await bcrypt.compare(
    payload.oldPassword,
    user?.password
  );

  if (!isPasswordValid) {
    throw new ApiError(400, "Invalid Password");
  }
  const hashedPassword = bcrypt.hashSync(payload.newPassword, 10);
  await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      password: hashedPassword,
    },
  });
  return;
};

// ----------------- business profile service logic -----------------------
const createNewBusinessProfile = async (
  userId: string,
  file: Express.Multer.File,
  payload: BusinessProfile
) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      businessProfile: {
        select: { id: true, createdAt: true },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  let businessLogo;
  try {
    businessLogo = (await uploadToDigitalOceanAWS(file)).Location;
  } catch (error: any) {
    throw new ApiError(400, `File Upload Error- ${error.message}`);
  }
  return await prisma.businessProfile.update({
    where: { id: user.businessProfile[0].id },
    data: {
      businessName: payload.businessName,
      businessLogo: businessLogo,
      businessEmail: payload.businessEmail,
      googleReviewUrI: payload.googleReviewUrI,
      location: payload.location,
      primaryColur: payload.primaryColur,
      user: {
        connect: { id: userId }, // connect existing user
      },
    },
  });
};
const updateBusinessProfile = async (
  userId: string,
  payload: BusinessProfile,
  businessProfileId: string,
  file?: Express.Multer.File
) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  const isBusinessProfile = await prisma.businessProfile.findUnique({
    where: { id: businessProfileId },
  });
  if (!isBusinessProfile) {
    throw new ApiError(404, "Business profile not found");
  }
  // check ownership
  if (isBusinessProfile.userId !== userId) {
    throw new ApiError(403, "You are not authorized to update this profile");
  }

  let businessLogo;
  if (file) {
    try {
      businessLogo = (await uploadToDigitalOceanAWS(file)).Location;
    } catch (error: any) {
      throw new ApiError(400, `File Upload Error- ${error.message}`);
    }
  }
  return await prisma.businessProfile.update({
    where: { id: businessProfileId },
    data: {
      businessName: payload.businessName,
      businessLogo: businessLogo
        ? businessLogo
        : isBusinessProfile.businessLogo,
      googleReviewUrI: payload.googleReviewUrI,
      location: payload.location,
      primaryColur: payload.primaryColur,
      businessEmail: payload.businessEmail,
      user: {
        connect: { id: userId }, // connect existing user
      },
    },
  });
};

const hasSubscription = async (businessProfileId: string) => {
  const businessProfile = await prisma.businessProfile.findUnique({
    where: { id: businessProfileId },
  });
  if (!businessProfile) {
    throw new ApiError(404, "Business profile not found");
  }
  return {
    isSubscribe: businessProfile.isSubscribe,
  };
};

export const authService = {
  loginUserIntoDB,
  adminLogin,
  authLoginIntoDB,
  getProfileFromDB,
  updateProfileIntoDB,
  sendForgotPasswordOtpDB,
  verifyForgotPasswordOtpCodeDB,
  resetForgotPasswordDB,
  changePassword,
  createNewBusinessProfile,
  updateBusinessProfile,
  hasSubscription,
};
