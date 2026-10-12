import { businessReview, PrismaClient } from "@prisma/client";
import getModelKeys from "../../../helpers/getModelKeys";
import QueryBuilder from "../../builder/QueryBuilder";
import { JwtPayload } from "jsonwebtoken";
import sendEmail from "../../../helpers/sendEmail";
import { sendCouponMailHtml } from ".";
const prisma = new PrismaClient();
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval,
  isSameDay,
  isSameWeek,
  isSameMonth,
  format,
  subYears,
  eachYearOfInterval,
  isSameYear,
  startOfDay,
  endOfDay,
  subDays,
  subWeeks,
  subMonths,
} from "date-fns";

const createBusinessReview = async (
  data: businessReview,
  businessProfileId: string
) => {
  const isBusinessProfileExist = await prisma.businessProfile.findUnique({
    where: { id: businessProfileId },
    include: {
      subscription: {
        select: {
          Plan: {
            select: {
              planType: true,
            },
          },
        },
      },
    },
  });
  console.log(isBusinessProfileExist);
  if (!isBusinessProfileExist) {
    throw new Error("Business profile not found");
  }
  if (isBusinessProfileExist.isSubscribe === false) {
    throw new Error("The business profile is not subscribed");
  }
  if (isBusinessProfileExist.subscription?.Plan.planType !== "Starter") {
    if (data.reviewStatus === "Neutral" || data.reviewStatus === "Bad") {
      if (!data.email) {
        throw new Error("please submit email for Neutral or Bad review");
      } else if (!data.comment) {
        throw new Error("please submit comment for Neutral or Bad review");
      }
    }
  }
  // send a auto coupon mail to the email for every review .

  const coupon = await prisma.coupon.findFirst({
    where: {
      businessProfileId: businessProfileId,
      isDefault: true,
    },
  });
  if(isBusinessProfileExist.subscription?.Plan.planType !== "Starter" && coupon && data.email){
    // send email
    await sendEmail(
      data.email,
      "Your Coupon Code",
      sendCouponMailHtml(
        isBusinessProfileExist.businessName as string,
        data.email,
        coupon.code,
        coupon.discountType,
        coupon.discountValue,
        Number(coupon.expiresTime)
      ),
      `Your coupon code is: ${coupon.code}`,
      isBusinessProfileExist.businessEmail as string
    );
  }

  return await prisma.businessReview.create({
    data: { ...data, businessProfileId },
  });
};

const getAllBusinessReviews = async (
  query: any,
  businessProfileId: string,
  user: JwtPayload
) => {
  const isMatchUser = await prisma.businessProfile.findFirst({
    where: {
      id: businessProfileId,
      userId: user.id,
    },
  });
  if (!isMatchUser && user.role !== "Admin") {
    throw new Error(
      "You are not allowed to access reviews for this business profile"
    );
  }
  const keys = await getModelKeys("businessReview");
  const businessReviewQuery = new QueryBuilder(
    prisma.businessReview,
    query,
    keys
  );
  const result = await businessReviewQuery
    .setCustomWhere({
      businessProfileId: businessProfileId,
    })
    .search(["email"])
    .filter()
    .sort()
    .exclude()
    .include()
    .paginate()
    .execute();
  const pagination = await businessReviewQuery.countTotal();
  return {
    meta: pagination,
    result,
  };
};
// const getAllBusinessReviewsForAdmin = async (query: any) => {
//   console.log(query)
//   const keys = await getModelKeys("businessReview");
//   const businessReviewQuery = new QueryBuilder(
//     prisma.businessReview,
//     query,
//     keys
//   );
//   const result = await businessReviewQuery
//     .search([
//       "email",
//       "comment",
//       "businessProfile.businessName",
//       "businessProfile.user.name",
//       "businessProfile.businessEmail",
//     ])
//     .filter()
//     .sort()
//     .exclude()
//     .include({
//       businessProfile: {
//         include: {
//           user: true,
//         },
//       },
//     })
//     .paginate()
//     .execute();
//   const pagination = await businessReviewQuery.countTotal();
//   return {
//     meta: pagination,
//     result,
//   };
// };


const getAllBusinessReviewsForAdmin = async (query: any) => {
  const { page = 1, limit = 20, searchTerm = "" } = query;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  const whereCondition: any = searchTerm
    ? {
        OR: [
          {
            email: {
              contains: searchTerm,
              mode: "insensitive",
            },
          },
          {
            comment: {
              contains: searchTerm,
              mode: "insensitive",
            },
          },
          {
            businessProfile: {
              businessName: {
                contains: searchTerm,
                mode: "insensitive",
              },
            },
          },
          {
            businessProfile: {
              businessEmail: {
                contains: searchTerm,
                mode: "insensitive",
              },
            },
          },
        ],
      }
    : {};

  // ✅ Get results
  const result = await prisma.businessReview.findMany({
    where: whereCondition,
    orderBy: {
      createdAt: "desc",
    },
    include: {
      businessProfile: {
        include: {
          user: true,
        },
      },
    },
    skip,
    take,
  });

  // ✅ Get pagination meta
  const total = await prisma.businessReview.count({ where: whereCondition });
  const totalPages = Math.ceil(total / take);

  return {
    meta: {
      total,
      totalPages,
      currentPage: parseInt(page),
      limit: take,
    },
    result,
  };
};



const getBusinessReviewById = async (id: string) => {
  return await prisma.businessReview.findUnique({ where: { id } });
};

const updateBusinessReview = async (id: string, data: any) => {
  return await prisma.businessReview.update({ where: { id }, data });
};

const calculateScanningCount = async (businessProfileId: string) => {
  const businessProfile = await prisma.businessProfile.findUnique({
    where: { id: businessProfileId },
  });
  if (!businessProfile) {
    throw new Error("Business profile not found");
  }
  const data = await prisma.businessProfile.update({
    where: { id: businessProfileId },
    data: {
      scanningCount: {
        increment: 1,
      },
    },
  });
  console.log(data);
  return data;
};

const deleteBusinessReview = async (id: string) => {
  return await prisma.businessReview.delete({ where: { id } });
};
const getBusinessDashboardOverview = async (id: string, user: JwtPayload) => {
  const isMatchUser = await prisma.businessProfile.findFirst({
    where: {
      id: id,
      userId: user.id,
    },
  });
  if (!isMatchUser && user.role !== "Admin") {
    throw new Error(
      "You are not allowed to access reviews for this business profile"
    );
  }
  const totalScann = isMatchUser?.scanningCount || 0;
  const goodReviews = await prisma.businessReview.count({
    where: {
      businessProfileId: id,
      reviewStatus: "Excellent",
    },
  });

  const totalPrivateReviews = await prisma.businessReview.count({
    where: {
      businessProfileId: id,
      reviewStatus: { in: ["Bad", "Neutral"] },
    },
  });

  const conversionRate = totalScann > 0 ? (goodReviews / totalScann) * 100 : 0;

  return {
    totalScann,
    goodReviews,
    totalPrivateReviews,
    conversionRate,
  };
};
const getBusinessDashboardOverviewChart = async (
  filter: "daily" | "weekly" | "monthly" | "yearly",
  id: string,
  user: JwtPayload
) => {
  const now = new Date();
  let interval;

  if (filter === "daily") {
    // Last 7 days ending today
    interval = {
      start: subDays(startOfDay(now), 6), // 6 days before today
      end: endOfDay(now),
    };
  } else if (filter === "weekly") {
    // Last 5 weeks ending current week
    const currentWeekStart = startOfWeek(now, { weekStartsOn: 0 });
    interval = {
      start: subWeeks(currentWeekStart, 4), // 4 weeks before current week
      end: endOfWeek(now, { weekStartsOn: 0 }),
    };
  } else if (filter === "monthly") {
    // Last 12 months ending current month
    const currentMonthStart = startOfMonth(now);
    interval = {
      start: subMonths(currentMonthStart, 11), // 11 months before current month
      end: endOfMonth(now),
    };
  } else if (filter === "yearly") {
    // Last 5 years ending current year (already correct)
    interval = {
      start: subYears(startOfYear(now), 4),
      end: endOfYear(now),
    };
  } else {
    throw new Error("Invalid filter");
  }

  // Fetch all good review within interval
  const goodReviews = await prisma.businessReview.findMany({
    where: {
      businessProfileId: id,
      reviewStatus: "Excellent",
      createdAt: {
        gte: interval.start,
        lte: interval.end,
      },
    },
    select: {
      createdAt: true,
    },
  });
  const privateReviews = await prisma.businessReview.findMany({
    where: {
      businessProfileId: id,
      reviewStatus: { in: ["Bad", "Neutral"] },
      createdAt: {
        gte: interval.start,
        lte: interval.end,
      },
    },
    select: {
      createdAt: true,
    },
  });

  let chartData: {
    label: string;
    value: {
      goodReview: number;
      privateReview: number;
    };
  }[] = [];

  if (filter === "daily") {
    const days = eachDayOfInterval(interval);
    chartData = days.map((day) => ({
      label: format(day, "EEE dd"),
      value: {
        goodReview: goodReviews.filter((s) => isSameDay(s.createdAt, day))
          .length,
        privateReview: privateReviews.filter((s) => isSameDay(s.createdAt, day))
          .length,
      },
    }));
  } else if (filter === "weekly") {
    const weeks = eachWeekOfInterval(interval, { weekStartsOn: 0 });
    chartData = weeks.map((weekStart, i) => ({
      label: `Week ${i + 1}`,
      value: {
        goodReview: goodReviews.filter((s) =>
          isSameWeek(s.createdAt, weekStart, { weekStartsOn: 0 })
        ).length,
        privateReview: privateReviews.filter((s) =>
          isSameWeek(s.createdAt, weekStart, { weekStartsOn: 0 })
        ).length,
      },
    }));
  } else if (filter === "monthly") {
    const months = eachMonthOfInterval(interval);
    chartData = months.map((month) => ({
      label: format(month, "MMMM"),
      value: {
        goodReview: goodReviews.filter((s) => isSameMonth(s.createdAt, month))
          .length,
        privateReview: privateReviews.filter((s) =>
          isSameMonth(s.createdAt, month)
        ).length,
      },
    }));
  } else if (filter === "yearly") {
    const years = eachYearOfInterval(interval);
    chartData = years.map((year) => ({
      label: format(year, "yyyy"),
      value: {
        goodReview: goodReviews.filter((s) => isSameYear(s.createdAt, year))
          .length,
        privateReview: privateReviews.filter((s) =>
          isSameYear(s.createdAt, year)
        ).length,
      },
    }));
  }

  return {
    filter,
    chartData,
  };
};

export const businessReviewServices = {
  createBusinessReview,
  getAllBusinessReviews,
  getBusinessReviewById,
  updateBusinessReview,
  deleteBusinessReview,
  calculateScanningCount,
  getBusinessDashboardOverview,
  getBusinessDashboardOverviewChart,
  getAllBusinessReviewsForAdmin,
};
