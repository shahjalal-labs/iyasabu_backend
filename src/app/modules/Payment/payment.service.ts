import { Request, Response } from "express";
import Stripe from "stripe";
import config from "../../../config";
import httpStatus from "http-status";
import { Plan, Subscription } from "@prisma/client";
import stripe from "../../../helpers/stripe";
import prisma from "../../../shared/prisma";
import ApiError from "../../../errors/ApiErrors";
import { paginationHelper } from "../../../shared/pagination";
import prismaEveryWhere from "../../../helpers/prismaEvreyWhere";
//plan create
const createPlanInStripe = async (payload: Plan) => {
  const { planType, description, amount, currency, interval } = payload;

  // Step 1: Create a product
  const product = await stripe.products.create({
    name: planType,
    description,
  });

  const stripeAmount = Math.round(amount * 100); // 1922 cents

  // Step 2: Create a price for the product
  const price = await stripe.prices.create({
    unit_amount: stripeAmount,
    currency,
    product: product.id,
    recurring: {
      interval: interval,
    },
  });
  0;
  const planInfo = await prisma.plan.create({
    data: { ...payload, productId: product.id, priceId: price.id },
  });

  return planInfo;
};

//get all products
const allPlansFromDB = async () => {
  const plans = await prisma.plan.findMany({
    orderBy: { createdAt: "desc" },
  });
  return plans;
};

//get active plan
const activePlansFromDB = async () => {
  const plans = await prisma.plan.findMany({
    where: { active: true },
    orderBy: { createdAt: "desc" },
  });
  return plans;
};

//get single product
const getPlanFromDB = async (planId: string) => {
  const plan = await prisma.plan.findUnique({
    where: { id: planId },
  });
  if (!plan) {
    throw new ApiError(httpStatus.BAD_REQUEST, "plan does'nt exist ");
  }
  return plan;
};

//edit plan
const editPlanInStripe = async (payload: Plan, planId: string) => {
  const { planType, active, description } = payload;
  const plan = await prisma.plan.findUnique({
    where: { id: planId },
  });
  if (!plan) {
    throw new ApiError(404, "Plan not found");
  }
  await stripe.products.update(plan.productId, {
    name: planType,
    active: active,
  });

  const updatedPlan = await prisma.plan.update({
    where: { id: planId },
    data: payload,
  });
  return updatedPlan;
};

//total earnings from subscriptions
const totalEarningsFromStripe = async () => {
  let totalAmount = 0;
  let hasMore = true;
  let startingAfter = null;

  while (hasMore) {
    const invoices: any = await stripe.invoices.list({
      limit: 10000, // Adjust the number of invoices per request if needed
      starting_after: startingAfter || undefined,
    });

    // Sum the total amount from each invoice
    invoices.data.forEach((invoice: any) => {
      totalAmount += invoice.amount_paid;
    });

    hasMore = invoices.has_more;
    if (hasMore) {
      startingAfter = invoices.data[invoices.data.length - 1].id;
    }
  }

  return {
    totalAmount: totalAmount / 100,
  };
};

// const createSubscriptionInStripe = async (
//   userId: string,
//   payload: { planId: string }
// ) => {
//   const isPlanExist = await prisma.plan.findFirst({
//     where: { id: payload.planId },
//   });
//   if (!isPlanExist) {
//     throw new ApiError(400, "The plan does not exist in Database");
//   }

//   const userInfo = await prisma.user.findUnique({
//     where: { id: userId },
//   });
//   if (!userInfo) {
//     throw new ApiError(404, "User not found");
//   }

//   // Ensure Stripe customer exists
//   let customerId = userInfo.customerId;
//   if (!customerId) {
//     const customer = await stripe.customers.create({
//       email: userInfo.email,
//     });
//     customerId = customer.id;
//     await prisma.user.update({
//       where: { id: userId },
//       data: { customerId },
//     });
//   }

//   let session;
//   // Create checkout session for subscription
//   try {
//     session = await stripe.checkout.sessions.create({
//       mode: "subscription",
//       customer: customerId,
//       metadata: {
//         planId: payload.planId,
//         userId,
//       },
//       payment_method_types: ["card"],
//       line_items: [
//         {
//           price: isPlanExist.priceId,
//           quantity: 1,
//         },
//       ],
//       // success_url: `${process.env.CLIENT_URL}/payment-success`,
//       // cancel_url: `${process.env.CLIENT_URL}/payment-cancel`,
//       success_url: `https://sana-ullah-roton.web.app`,
//       cancel_url: `https://sana-ullah-roton.web.app`,
//     });
//   } catch (error: any) {
//     throw new ApiError(
//       httpStatus.BAD_REQUEST,
//       `subscription error: ${error.message}`
//     );
//   }

//   return { url: session.url };
// };

const createSubscriptionInStripe = async (
  userId: string,
  payload: { paymentMethodId: string; priceId: string; planId: string }
) => {
  const { paymentMethodId, priceId, planId } = payload;

  const userInfo = await prisma.user.findUnique({
    where: { id: userId },
  });
  if (!userInfo) throw new ApiError(404, "User not found");

  const plan = await prisma.plan.findFirst({ where: { id: planId } });
  if (!plan) throw new ApiError(400, "Plan not found in database");

  let customerId = userInfo.customerId;
  if (!customerId) {
    const customer = await stripe.customers.create({ email: userInfo.email });
    customerId = customer.id;
    await prisma.user.update({
      where: { id: userId },
      data: { customerId },
    });
  }

  await stripe.paymentMethods.attach(paymentMethodId, { customer: customerId });
  await stripe.customers.update(customerId, {
    invoice_settings: { default_payment_method: paymentMethodId },
  });

  const stripeSubscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    expand: ["latest_invoice.payment_intent"],
  });

  // Atomic DB transaction
  const result = await prisma.$transaction(async (tx) => {
    const businessProfile = await tx.businessProfile.create({
      data: {
        userId,
        isSubscribe: true,
      },
    });

    const subscription = await tx.subscription.create({
      data: {
        paymentMethodId,
        priceId,
        stripeSubscriptionId: stripeSubscription.id,
        status: "ACTIVE",
        businessProfileId: businessProfile.id,
        userId,
        planId,
      },
    });

    const updatedBusinessProfile = await tx.businessProfile.update({
      where: { id: businessProfile.id },
      data: { subscription: { connect: { id: subscription.id } } },
    });

    return { subscription, updatedBusinessProfile };
  });

  return result;
};

const cancelSubscriptionInDB = async (
  payload: { subscriptionId: string; businessProfileId: string },
  userId: string
) => {
  const userInfo = await prisma.businessProfile.findFirst({
    where: { id: payload.businessProfileId, userId: userId },
  });
  if (!userInfo) {
    throw new ApiError(404, "business profile are not found");
  }
  const subscriptionData = await prisma.subscription.findFirst({
    where: {
      stripeSubscriptionId: payload.subscriptionId,
      businessProfile: { id: payload.businessProfileId },
    },
  });
  if (!subscriptionData) {
    throw new ApiError(404, "Subscription not found");
  }
  try {
    await prisma.$transaction(async (tx) => {
      await stripe.subscriptions.cancel(payload.subscriptionId);
      // delete subscription record
      await tx.subscription.deleteMany({
        where: {
          stripeSubscriptionId: subscriptionData.stripeSubscriptionId,
          businessProfile: {
            id: payload.businessProfileId,
          },
        },
      });

      // update user
      await tx.businessProfile.update({
        where: { id: payload.businessProfileId, userId: userId },
        data: { isSubscribe: false },
      });
    });
  } catch (error) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `subscription cancel error: ${error instanceof Error ? error.message : error}`
    );
  }
  return;
};

const updateSubscriptionInStripe = async (
  payload: {
    priceId: string;
    subscriptionId: string;
    businessProfileId: string;
  },
  userId: string
) => {
  const { priceId, subscriptionId, businessProfileId } = payload;

  // find plan
  const planDetails = await prisma.plan.findFirst({
    where: { priceId },
  });
  if (!planDetails) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Can't find plan by this priceId"
    );
  }

  // check user
  const userInfo = await prisma.user.findUnique({
    where: { id: userId },
  });
  if (!userInfo) {
    throw new ApiError(404, "User not found");
  }
  const profileData = await prisma.businessProfile.findFirst({
    where: {
      id: businessProfileId,
      userId: userId,
    },
  });

  if (!profileData) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Profile data is not found!");
  }

  // check subscription in DB
  const isExistingSubscription = await prisma.subscription.findFirst({
    where: {
      id: subscriptionId,
      businessProfile: {
        id: payload.businessProfileId,
      },
    },
  });
  if (!isExistingSubscription) {
    throw new ApiError(404, "Subscription not found");
  }
  console.log({ "existing subsciptions": isExistingSubscription });
  let subscription;
  try {
    console.log(isExistingSubscription.stripeSubscriptionId);
    subscription = await stripe.subscriptions.retrieve(
      isExistingSubscription.stripeSubscriptionId
    );
  } catch (error: any) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      `subscription error : ${error.message}`
    );
  }
  console.log({ subscription: subscription });

  if (!subscription.items?.data?.length) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "No items found in subscription"
    );
  }

  // Update subscription in Stripe (no cancel needed)
  const subscriptionItemId = subscription.items.data[0].id;

  await stripe.subscriptions.update(
    isExistingSubscription.stripeSubscriptionId,
    {
      items: [
        {
          id: subscriptionItemId,
          price: priceId,
        },
      ],
      proration_behavior: "create_prorations",
    }
  );

  // Update in DB
  const updatedSubscription = await prisma.subscription.update({
    where: { id: isExistingSubscription.id },
    data: {
      priceId: planDetails.priceId,
      planId: planDetails.id,
    },
  });

  return updatedSubscription;
};

//using for webhook
const deleteSubscriptionInStripe = async (event: Stripe.Event) => {
  const subscriptionData = event.data.object as any;
  const subscriptionId = subscriptionData.id;

  await prisma.subscription.deleteMany({
    where: {
      stripeSubscriptionId: subscriptionId,
    },
  });

  await prisma.businessProfile.updateMany({
    where: {
      user: {
        customerId: subscriptionData.customer,
      },
    },
    data: { isSubscribe: false },
  });

  return;
};

// Helper to create subscription record
// export const handelPaymentWebhook = async (req: Request, res: Response) => {
//   console.log("hit");
//   const sig = req.headers["stripe-signature"] as string;
//   if (!sig) {
//     return {
//       success: false,
//       statusCode: 401,
//       message: "Missing Stripe signature",
//     };
//   }

//   let event: Stripe.Event;
//   try {
//     event = stripe.webhooks.constructEvent(
//       req.body,
//       sig,
//       config.stripe.webhook_secret as string
//     );
//   } catch (err: any) {
//     console.error("Webhook signature failed:", err.message);
//     return {
//       success: false,
//       statusCode: 401,
//       message: `Webhook signature failed:', ${err.message}`,
//     };
//   }

//   try {
//     switch (event.type) {
//       case "checkout.session.completed":
//       case "customer.subscription.created": {
//         console.log("accept the money");
//         const session = event.data.object as Stripe.Checkout.Session;
//         const metadata = session.metadata as {
//           userId: string;
//           planId: string;
//         };
//         if (!metadata.userId || !metadata.planId)
//           throw new ApiError(400, "Metadata missing");
//         console.log({ metadataFromAccpetMoney: metadata });
//         const planData = await prisma.plan.findUnique({
//           where: { id: metadata.planId },
//         });
//         if (!planData) throw new ApiError(404, "Plan not found");

// await prisma.$transaction(async (tx) => {
//   // 1️⃣ Create Business Profile
//   const businessProfile = await tx.businessProfile.create({
//     data: {
//       userId: metadata.userId,
//       isSubscribe: true,
//     },
//   });

//   // 2️⃣ Create Subscription and connect Business Profile
//   const subscription = await tx.subscription.create({
//     data: {
//       paymentMethodId:
//         session.payment_method_configuration_details?.id!,
//       priceId: session.subscription,
//       stripeSubscriptionId: "",
//       status: "ACTIVE",
//       businessProfileId: businessProfile.id, // connect
//       userId: metadata.userId,
//       planId: planData.id,
//     },
//   });

//   // 3️⃣ Update Business Profile with subscriptionId
//   const updatedBusinessProfile = await tx.businessProfile.update({
//     where: { id: businessProfile.id },
//     data: { subscriptionId: subscription.id },
//   });

//   return { updatedBusinessProfile, subscription };
// });

//         // await setUserSubscription(metadata.userId, true);
//         break;
//       }

//       case "customer.subscription.updated": {
//         const session = event.data.object as Stripe.Checkout.Session;
//         const metadata = session.metadata as { userId: string; planId: string };

//         if (!metadata?.userId || !metadata?.planId) {
//           throw new ApiError(400, "Metadata missing");
//         }

//         console.log("✅ Metadata:", metadata);

//         const planData = await prisma.plan.findUnique({
//           where: { id: metadata.planId },
//         });
//         if (!planData) throw new ApiError(404, "Plan not found");

//         // Start atomic transaction
//         await prisma.$transaction(async (tx) => {
//           // 1️⃣ Ensure businessProfile exists or create one
//           const existingBusiness = await tx.businessProfile.findFirst({
//             where: { userId: metadata.userId },
//           });

//           const businessProfile =
//             existingBusiness ||
//             (await tx.businessProfile.create({
//               data: {
//                 userId: metadata.userId,
//                 isSubscribe: true,
//               },
//             }));

//           // 2️⃣ Create a new subscription record
//           const subscription = await tx.subscription.create({
//             data: {
//               paymentMethodId: session.payment_intent || "", // You can later get actual payment method from PaymentIntent
//               priceId: planData.id, // since only plan info exists in metadata
//               stripeSubscriptionId:
//                 typeof session.subscription === "string"
//                   ? session.subscription
//                   : "",
//               status: "ACTIVE",
//               businessProfileId: businessProfile.id,
//               userId: metadata.userId,
//               planId: planData.id,
//             },
//           });

//           // 3️⃣ Link subscription with business profile
//           await tx.businessProfile.update({
//             where: { id: businessProfile.id },
//             data: { subscriptionId: subscription.id, isSubscribe: true },
//           });

//           console.log(
//             "✅ Subscription + Business Profile created successfully"
//           );
//         });

//         // await setUserSubscription(metadata.userId, isActive);
//         break;
//       }

//       case "customer.subscription.deleted": {
//         const subscription = event.data.object as Stripe.Subscription;
//         const metadata = subscription.metadata as { userId: string };
//         if (!metadata.userId) throw new ApiError(400, "Metadata missing");

//         await prisma.subscription.updateMany({
//           where: {
//             stripeSubscriptionId: subscription.id,
//             businessProfile: {
//               id: metadata.userId,
//             },
//           },
//           data: { status: "CANCELLED" },
//         });
//         await setUserSubscription(metadata.userId, false);
//         break;
//       }

//       case "invoice.payment_succeeded":
//       case "invoice.payment_failed": {
//         const invoice = event.data.object as Stripe.Invoice;
//         const subscriptionId = (invoice as any).subscription as
//           | string
//           | undefined;
//         if (!subscriptionId) break; // ✅ Safe to ignore

//         const subscriptionRecord = await prisma.subscription.findFirst({
//           where: { stripeSubscriptionId: subscriptionId },
//         });
//         if (!subscriptionRecord) break;

//         const isSuccess = event.type === "invoice.payment_succeeded";

//         await prisma.$transaction(async (tx) => {
//           await tx.subscription.updateMany({
//             where: { stripeSubscriptionId: subscriptionId },
//             data: { status: isSuccess ? "ACTIVE" : "INACTIVE" },
//           });
//           // if (subscriptionRecord.userId) {
//           //   await setUserSubscription(subscriptionRecord.userId, isSuccess);
//           // }
//         });
//         break;
//       }

//       default:
//         console.log(`Unhandled event type: ${event.type}`);
//         // ✅ Still respond 200 — Stripe expects it even for unknown events
//         return {
//           success: true,
//           statusCode: 200,
//           message: `success`,
//         };
//     }
//     // ✅ ONLY send success response AFTER ALL WORK IS DONE
//     return {
//       success: true,
//       statusCode: 200,
//       message: `success`,
//     };
//   } catch (error) {
//     console.error("Webhook handler error:", error);

//     // ✅ Log error details safely — DO NOT include req/res
//     if (error instanceof ApiError) {
//       console.error(`ApiError: ${error.message} (status: ${error.statusCode})`);
//       return {
//         success: false,
//         statusCode: error.statusCode,
//         message: error.message,
//       };
//     } else {
//       console.error("Unexpected error:", error); // Log full error for debugging
//       return {
//         success: false,
//         statusCode: 500,
//         message: "Internal Server Error",
//       };
//     }
//   }
// };

const handelPaymentWebhook = async (req: Request) => {
  const sig = req.headers["stripe-signature"] as string;

  if (!sig) {
    console.error("Missing Stripe signature header");
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      config.stripe.stripe_secret as string
    );
    let result;
    switch (event.type) {
      //   case "customer.subscription.created":
      //     result = await createSubscriptionInDB(event);
      //     break;
      case "invoice.payment_failed":
        result = await deleteSubscriptionInStripe(event);
        break;

      default:
        break;
    }

    return result;
  } catch (err: any) {
    console.log(err);
    return;
  }
};

const getPaymentsFromDB = async (req: Request) => {
  //@ts-ignore
  const { page, limit, skip, take, searchTerm } = paginationHelper(
    req.query as any
  );
  console.log(searchTerm);

  let whereCondition = {};
  // search username  and businessName also user Email
  if (searchTerm) {
    whereCondition = {
      OR: [
        { user: { firstName: { contains: searchTerm, mode: "insensitive" } } },
        { user: { lastName: { contains: searchTerm, mode: "insensitive" } } },
        { user: { email: { contains: searchTerm, mode: "insensitive" } } },
      ],
    };
  }

  const payments = await prisma.subscription.findMany({
    where: whereCondition,
    select: {
      id: true,
      status: true,
      paymentMethodId: true,
      priceId: true,
      stripeSubscriptionId: true,
      businessProfile: {
        select: {
          id: true,
          businessName: true,
        },
      },
      Plan: {
        select: {
          id: true,
          title: true,
          planType: true,
          amount: true,
          interval: true,
        },
      },
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          status: true,
        },
      },
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: "desc" },
    skip,
    take,
  });

  const totalCount = await prisma.subscription.count();
  const totalPages = Math.ceil(totalCount / limit);
  return {
    totalCount,
    totalPages,
    currentPage: page,
    payments,
  };
};

const getPaymentDetailsFromDB = async (id: string) => {
  return await prisma.subscription.findFirstOrThrow({
    where: {
      id,
    },
    select: {
      id: true,
      status: true,
      paymentMethodId: true,
      priceId: true,
      stripeSubscriptionId: true,
      businessProfile: {
        select: {
          id: true,
          businessName: true,
        },
      },
      Plan: {
        select: {
          id: true,
          title: true,
          planType: true,
          amount: true,
          interval: true,
        },
      },
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          status: true,
        },
      },
      createdAt: true,
      updatedAt: true,
    },
  });
};

export const paymentServices = {
  createPlanInStripe,
  allPlansFromDB,
  activePlansFromDB,
  getPlanFromDB,
  editPlanInStripe,
  totalEarningsFromStripe,
  handelPaymentWebhook,
  createSubscriptionInStripe,
  updateSubscriptionInStripe,
  cancelSubscriptionInDB,
  getPaymentsFromDB,
  getPaymentDetailsFromDB,
  deleteSubscriptionInStripe,
};
