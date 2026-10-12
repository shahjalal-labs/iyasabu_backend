import prisma from "../../../shared/prisma";
import getModelKeys from "../../../helpers/getModelKeys";
import QueryBuilder from "../../builder/QueryBuilder";
import ApiError from "../../../errors/ApiErrors";
import httpStatus from "http-status";
import { sendCuopon } from "./const";
import { emailQueue } from "../../../queue/email.queue";
import { Coupon } from "@prisma/client";
import { JwtPayload } from "jsonwebtoken";

const createCuopon = async (
  data: Coupon,
  user: JwtPayload,
  businessProfileId: string
) => {
  const coupon = await prisma.coupon.findFirst({
    where: {
      code: data.code,
      businessProfileId: businessProfileId,
    },
  });
  if (coupon) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Coupon already exists");
  }
  const isBusinessProfileExist = await prisma.businessProfile.findUnique({
    where: { id: businessProfileId },
    include: { user: true },
  });
  if (!isBusinessProfileExist) {
    throw new ApiError(httpStatus.NOT_FOUND, "Business profile not found");
  }
  if (isBusinessProfileExist.userId !== user.id) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "You are not allowed to create coupon for this business profile"
    );
  }
  return await prisma.coupon.create({ data: { ...data, businessProfileId } });
};
// send coupon
const sendCuoponToUser = async (data: sendCuopon) => {
  const isBuisnessProfileExist = await prisma.businessProfile.findUnique({
    where: { id: data.businessProfileId },
    include: { user: true , subscription : { include: { Plan: true } } },
  });
  if (!isBuisnessProfileExist) {
    throw new ApiError(httpStatus.NOT_FOUND, "Business profile not found");
  }
  const { businessEmail, businessName, googleReviewUrI } =
    isBuisnessProfileExist;

  // check for missing or empty fields
  if (!businessEmail || !businessName || !googleReviewUrI) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Missing required business information. Please ensure business name, email, and Google Review URL are set before sending a coupon."
    );
  }
  if(isBuisnessProfileExist.isSubscribe === false){
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "You need to be subscribed to send coupons to users."
    );
  }
  const coupon = await prisma.coupon.findUnique({
    where: { id: data.cuoponId },
  });

  if (!coupon) {
    throw new ApiError(httpStatus.NOT_FOUND, "Coupon doesn't exist");
  }

  if (coupon.status === "Expired" || coupon.endDate < new Date()) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Coupon is expired");
  }

  // ✅ parallel processing
  await Promise.allSettled(
    data.emails.map(async (email) => {
      try {
        const expiryDate = coupon.expiresTime;
        await emailQueue.add("sendCoupon", {
          title: data.title,
          description: data.description,
          couponCode: coupon.code,
          discountValue: coupon.discountValue,
          discountType: coupon.discountType,
          expiryDate: expiryDate,
          email,
          businessMail: isBuisnessProfileExist.businessEmail,
        });
      } catch (err) {
        console.error(`Error processing user ${email}:`, err);
      }
    })
  );
};

const getAllCuopons = async (query: any, user: JwtPayload) => {
  if (!query.businessProfileId) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "please share the businessProfileId for fetching specific business coupons"
    );
  }
  const isBusinessProfileExist = await prisma.businessProfile.findUnique({
    where: { id: query.businessProfileId },
    include: { user: true },
  });
  if (!isBusinessProfileExist) {
    throw new ApiError(httpStatus.NOT_FOUND, "Business profile not found");
  }
  if (isBusinessProfileExist.userId !== user.id) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "You are not allowed to fetch coupons for this business profile"
    );
  }
  const keys = await getModelKeys("coupon");
  const couponQuery = new QueryBuilder(prisma.coupon, query, keys);
  const result = await couponQuery
    .setCustomWhere({
      businessProfileId: query.businessProfileId,
      businessProfile: {
        userId: user.id,
      },
    })
    .filter()
    .sort()
    .exclude()
    .include()
    .paginate()
    .execute();
  const pagination = await couponQuery.countTotal();
  return {
    meta: pagination,
    result,
  };
};

const getCuoponById = async (id: string) => {
  const res = await prisma.coupon.findUnique({ where: { id } });
  if (!res) {
    throw new ApiError(httpStatus.NOT_FOUND, "cuopon not Found");
  }
};

const updateCuopon = async (id: string, data: any, user: JwtPayload) => {
  const isExist = await prisma.coupon.findUnique({ where: { id } });
  if (!isExist) {
    throw new ApiError(httpStatus.NOT_FOUND, "cuopon not Found");
  }
  if (isExist.businessProfileId) {
    const isBusinessProfileExist = await prisma.businessProfile.findUnique({
      where: { id: isExist.businessProfileId },
      include: { user: true },
    });
    if (!isBusinessProfileExist) {
      throw new ApiError(httpStatus.NOT_FOUND, "Business profile not found");
    }
    if (isBusinessProfileExist.userId !== user.id) {
      throw new ApiError(
        httpStatus.FORBIDDEN,
        "You are not allowed to update coupon for this business profile"
      );
    }

    if (data.isDefault) {
      const existingDefault = await prisma.coupon.findFirst({
        where: {
          businessProfileId: isExist.businessProfileId,
          isDefault: true,
          id: { not: id },
        },
      });
      if (existingDefault) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          "Another default coupon already exists for this business profile. only one default coupon allowed."
        );
      }
    }

    return await prisma.coupon.update({ where: { id }, data });
  }
};

const deleteCuopon = async (id: string, user: JwtPayload) => {
  const isExist = await prisma.coupon.findUnique({ where: { id } });
  if (!isExist) {
    throw new ApiError(httpStatus.NOT_FOUND, "cuopon not Found");
  }
  if (isExist.businessProfileId) {
    const isBusinessProfileExist = await prisma.businessProfile.findUnique({
      where: { id: isExist.businessProfileId },
      include: { user: true },
    });
    if (!isBusinessProfileExist) {
      throw new ApiError(httpStatus.NOT_FOUND, "Business profile not found");
    }
    if (isBusinessProfileExist.userId !== user.id) {
      throw new ApiError(
        httpStatus.FORBIDDEN,
        "You are not allowed to delete coupon for this business profile"
      );
    }
  }
  return await prisma.coupon.delete({ where: { id } });
};

export const cuoponServices = {
  createCuopon,
  getAllCuopons,
  getCuoponById,
  updateCuopon,
  deleteCuopon,
  sendCuoponToUser,
};
