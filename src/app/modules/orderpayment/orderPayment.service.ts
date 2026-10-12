import { JwtPayload } from "jsonwebtoken";
import prisma from "../../../shared/prisma";
import ApiError from "../../../errors/ApiErrors";
import httpStatus from "http-status";
import { order, Prisma } from "@prisma/client";
import stripe from "../../../helpers/stripe";
import getModelKeys from "../../../helpers/getModelKeys";
import QueryBuilder from "../../builder/QueryBuilder";
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
} from "date-fns";

const createOrderWithPayment = async (data: any, user: JwtPayload) => {
  // 1️⃣ Validate shipping address
  const isShippingAddressExist = await prisma.shippingAddress.findUnique({
    where: { id: data.shippingAddressId },
  });

  if (!isShippingAddressExist) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Please add a valid shipping address."
    );
  }

  // 2️⃣ Validate products & calculate total
  let totalAmount = 0;
  const orderProductsData: Prisma.orderProductCreateManyOrderInput[] = [];

  for (const product of data.products) {
    const isProductExist = await prisma.product.findUnique({
      where: { id: product.productId },
    });

    if (!isProductExist) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `Product not found! Invalid ID: ${product.productId}`
      );
    }

    totalAmount += Number(isProductExist.price) * Number(product.quantity);

    orderProductsData.push({
      productId: product.productId,
      quantity: product.quantity,
      price: Number(isProductExist.price),
    });
  }

  let finalTotal = totalAmount;
  let newOrder: any;

  // 3️⃣ Create Stripe PaymentIntent with finalTotal
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(finalTotal * 100), // ⚠️ use finalTotal instead of totalAmount
      currency: "usd",
      payment_method: data.paymentMethodId,
      confirm: true,
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: "never",
      },
    });
    if (paymentIntent.status === "succeeded") {
      newOrder = await prisma.order.create({
        data: {
          orderId: `ORD-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
          userId: user.id,
          shippingAddressId: data.shippingAddressId,
          paymentMethodId: data.paymentMethodId,
          paymentIntentId: paymentIntent.id,
          totalAmount: finalTotal, // ⚠️ use finalTotal here too
          status: "Processed",
          isPaid: true,
          products: { createMany: { data: orderProductsData } },
          businessProfileId: data.businessProfileId,
        },
        include: {
          products: {
            select: {
              id: true,
              quantity: true,
              product: { select: { title: true, images: true } },
            },
          },
        },
      });
    } else {
      throw new ApiError(httpStatus.BAD_REQUEST, "Payment not successful");
    }
  } catch (error: any) {
    throw new ApiError(httpStatus.BAD_REQUEST, error.message);
  }

  // 5️⃣ Return order + discount info
  return {
    total: finalTotal,
    order: newOrder,
  };
};

// shipping cost
// Calculate discount with coupon
// const calculateDiscount = async (
//   data: {
//     products: { productId: string; quantity: number }[];
//     couponCode: string;
//   },
//   userId: string
// ) => {
//   // 1️⃣ Fetch all products in one query
//   const productIds = data.products.map((p) => p.productId);
//   const products = await prisma.product.findMany({
//     where: { id: { in: productIds } },
//   });

//   if (products.length !== productIds.length) {
//     throw new ApiError(
//       httpStatus.BAD_REQUEST,
//       "One or more products not found!"
//     );
//   }

//   // 2️⃣ Validate products & calculate total
//   let totalAmount = 0;
//   for (const item of data.products) {
//     const product = products.find((p) => p.id === item.productId)!;
//     if (item.quantity > product.quantity) {
//       throw new ApiError(
//         httpStatus.BAD_REQUEST,
//         `Not enough stock for: ${product.title}`
//       );
//     }
//     totalAmount += Number(product.price) * Number(item.quantity);
//   }

//   // 3️⃣ Validate coupon
//   const couponUser = await prisma.couponUser.findFirst({
//     where: {
//       coupon: { code: data.couponCode },
//       userId,
//     },
//     include: { coupon: true },
//   });

//   const shippingCost = Number(process.env.SHIPPING_COST) || 55;
//   if (!couponUser?.coupon) {
//     return {
//       success: false,
//       message: "Invalid coupon!",
//       statusCode: httpStatus.BAD_REQUEST,
//       subtotal: totalAmount,
//       discount: 0,
//       afterDiscountAmount: totalAmount,
//       shippingCost: shippingCost,
//       total: totalAmount + shippingCost,
//     };
//   }

//   const coupon = couponUser.coupon;
//   const isExpiredByDate = coupon.expireDate < new Date();
//   // Check status
//   const isInvalidStatus = ["Expired", "Inactive"].includes(coupon.status);

//   if (isExpiredByDate || isInvalidStatus) {
//     throw new ApiError(
//       httpStatus.BAD_REQUEST,
//       isExpiredByDate
//         ? "Coupon expired by date"
//         : `Coupon is ${coupon.status.toLowerCase()}`
//     );
//   }

//   // 4️⃣ Apply discount (support % or flat)
//   let discountApplied = 0;
//   if (coupon.discountType === "Percentage") {
//     discountApplied = (totalAmount * coupon.discountValue) / 100;
//   } else if (coupon.discountType === "Flat") {
//     discountApplied = coupon.discountValue;
//   }
//   return {
//     success: true,
//     message: "Coupon applied successfully",
//     statusCode: httpStatus.OK,
//     subtotal: totalAmount,
//     discount: discountApplied,
//     afterDiscountAmount: totalAmount - discountApplied,
//     shippingCost: shippingCost,
//     total: totalAmount - discountApplied + shippingCost,
//   };
// };

const cancelOrder = async (
  data: { orderId: string; cancelReason: string },
  user: JwtPayload
) => {
  // 1️⃣ Find order
  const order = await prisma.order.findUnique({ where: { id: data.orderId } });
  if (!order) throw new ApiError(httpStatus.NOT_FOUND, "Order not found");
  if (order.status === "Cancelled")
    throw new ApiError(httpStatus.BAD_REQUEST, "Order already cancelled");

  // 2️⃣ Check user permission
  if (order.userId !== user.id)
    throw new ApiError(httpStatus.FORBIDDEN, "Not allowed");

  // 3️⃣ Check 48 hours limit
  const now = new Date();
  const orderTime = new Date(order.createdAt);
  const diffHours = (now.getTime() - orderTime.getTime()) / (1000 * 60 * 60);
  if (diffHours > 48) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Order cannot be cancelled after 48 hours"
    );
  }

  // 4️⃣ Refund if payment done
  if (order.isPaid && order.paymentIntentId) {
    try {
      await stripe.refunds.create({ payment_intent: order.paymentIntentId });
    } catch (err: any) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Refund failed: " + err.message
      );
    }
  }

  // 5️⃣ Update order status
  await prisma.order.update({
    where: { id: data.orderId },
    data: {
      status: "Cancelled",
      cancelReason: data.cancelReason,
    },
  });

  return;
};

const getAllOrderPayments = async (query: any) => {
  const keys = await getModelKeys("order");
  const usersQuery = new QueryBuilder(prisma.order, query, keys);
  const result = await usersQuery
    .search(["user.firstName", "user.lastName", "user.email"])
    .sort()
    .fields()
    .filter()
    .exclude()
    .include({
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      products: {
        select: {
          id: true,
          quantity: true,
          product: {
            select: {
              id: true,
              title: true,
              price: true,
              images: true,
            },
          },
        },
      },
    })
    .paginate()
    .execute();
  const pagination = await usersQuery.countTotal();
  return {
    meta: pagination,
    result,
  };
};

const getMyOrderFromDB = async (query: any, userId: string) => {
  const keys = await getModelKeys("order");
  const usersQuery = new QueryBuilder(prisma.order, query, keys);

  const result = await usersQuery
    .setCustomWhere({
      userId,
    })
    .sort()
    .fields()
    .filter()
    .exclude()
    .include({
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      products: {
        select: {
          id: true,
          quantity: true,
          product: {
            select: {
              id: true,
              title: true,
              price: true,
              images: true,
            },
          },
        },
      },
    })
    .paginate()
    .execute();

  const pagination = await usersQuery.countTotal();

  return {
    meta: pagination,
    result,
  };
};

const getPaymentHistory = async (query: any) => {
  const keys = await getModelKeys("order");
  const usersQuery = new QueryBuilder(prisma.order, query, keys);
  const result = await usersQuery
    .setCustomWhere({
      isPaid: true,
      status: {
        not: "Cancelled",
      },
    })
    .search([
      "user.firstName",
      "user.lastName",
      "user.email",
      "businessProfile.businessName",
    ])
    .sort()
    .fields()
    .filter()
    .exclude()
    .include({
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      businessProfile: true,
      products: {
        select: {
          id: true,
          quantity: true,
          product: {
            select: {
              id: true,
              title: true,
              price: true,
              images: true,
            },
          },
        },
      },
    })
    .paginate()
    .execute();
  const pagination = await usersQuery.countTotal();
  return {
    meta: pagination,
    result,
  };
};

const getOrderPaymentById = async (id: string) => {
  return await prisma.order.findUnique({
    where: { id },
    include: {
      products: {
        include: {
          product: {
            select: {
              id: true,
              title: true,
              price: true,
              images: true,
              quantity: true,
            },
          },
        },
      },
      shippingAddress: true,
      businessProfile: {
        include: {
          subscription: {
            include: {
              Plan: true,
            },
          },
        },
      },
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });
};

const updateOrderPayment = async (id: string, data: order) => {
  const isExist = await prisma.order.findUnique({ where: { id } });
  if (!isExist) {
    throw new ApiError(httpStatus.NOT_FOUND, "orderPayment not Found");
  }
  return await prisma.order.update({ where: { id }, data });
};

const deleteOrderPayment = async (id: string) => {
  // return await prisma.orderPayment.delete({ where: { id } });
};

const adminOverViewData = async () => {
  // ✅ Parallel queries
  // Processed
  // Shipped
  // InRoute
  // Delivered
  // Cancelled
  //return totalOrders as object where includes totalCanelledOrders , totalDeliveredOrders , totatProcessedOrders , totalInRouteOrders , toatlShippedOrders

  const [
    totalCancelledOrders,
    totalDeliveredOrders,
    totalProcessedOrders,
    totalInRouteOrders,
    totalShippedOrders,
  ] = await Promise.all([
    prisma.order.count({
      where: {
        status: "Cancelled",
      },
    }),
    prisma.order.count({
      where: {
        status: "Delivered",
      },
    }),
    prisma.order.count({
      where: {
        status: "Processed",
      },
    }),
    prisma.order.count({
      where: {
        status: "InRoute",
      },
    }),
    prisma.order.count({
      where: {
        status: "Shipped",
      },
    }),
  ]);

  const [totalUsers, totalBusiness, totalReviews] = await Promise.all([
    prisma.user.count({ where: { role: "User" } }),
    prisma.businessProfile.count(),
    prisma.businessReview.count(),
  ]);
  return {
    totalOrders: {
      totalCancelledOrders,
      totalDeliveredOrders,
      totalProcessedOrders,
      totalInRouteOrders,
      totalShippedOrders,
    },
    totalUsers,
    totalBusiness,
    totalReviews,
  };
};

const getUserDataForAdminOverView = async (
  filter: "daily" | "weekly" | "monthly" | "yearly"
) => {
  const now = new Date();
  let interval;

  if (filter === "daily") {
    interval = {
      start: startOfWeek(now, { weekStartsOn: 0 }),
      end: endOfWeek(now, { weekStartsOn: 0 }),
    };
  } else if (filter === "weekly") {
    interval = {
      start: startOfMonth(now),
      end: endOfMonth(now),
    };
  } else if (filter === "monthly") {
    interval = {
      start: startOfYear(now),
      end: endOfYear(now),
    };
  } else if (filter === "yearly") {
    interval = {
      start: subYears(startOfYear(now), 4), // 🔥 last 5 years (current year + 4 back)
      end: endOfYear(now),
    };
  } else {
    throw new Error("Invalid filter");
  }

  const orders = await prisma.order.findMany({
    where: {
      NOT: {
        status: "Cancelled",
      },
      createdAt: {
        gte: interval.start,
        lte: interval.end,
      },
    },
  });

  let chartData: {
    label: string;
    value: number;
  }[] = [];

  if (filter === "daily") {
    const days = eachDayOfInterval(interval);

    chartData = days.map((day) => {
      const dailyOrders = orders.filter((u) => isSameDay(u.createdAt, day));

      return {
        label: format(day, "EEE"), // Mon, Tue, Wed
        value: dailyOrders.length,
      };
    });
  }

  if (filter === "weekly") {
    const weeks = eachWeekOfInterval(interval, { weekStartsOn: 0 });

    chartData = weeks.map((weekStart, i) => {
      const weeklyorders = orders.filter((u) =>
        isSameWeek(u.createdAt, weekStart, { weekStartsOn: 0 })
      );

      return {
        label: `Week ${i + 1}`,
        value: weeklyorders.length,
      };
    });
  }

  if (filter === "monthly") {
    const months = eachMonthOfInterval(interval);

    chartData = months.map((month) => {
      const monthlyorders = orders.filter((u) =>
        isSameMonth(u.createdAt, month)
      );

      return {
        label: format(month, "MMMM"), // January, February
        value: monthlyorders.length,
      };
    });
  }

  if (filter === "yearly") {
    const years = eachYearOfInterval(interval);

    chartData = years.map((year) => {
      const yearlyorders = orders.filter((u) => isSameYear(u.createdAt, year));

      return {
        label: format(year, "yyyy"),
        value: yearlyorders.length,
      };
    });
  }
  return {
    filter,
    chartData,
  };
};

export const orderPaymentServices = {
  getAllOrderPayments,
  getOrderPaymentById,
  updateOrderPayment,
  deleteOrderPayment,
  createOrderWithPayment,
  cancelOrder,
  getPaymentHistory,
  // calculateDiscount,
  getMyOrderFromDB,
  adminOverViewData,
  getUserDataForAdminOverView,
};
