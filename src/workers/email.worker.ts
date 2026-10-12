import { Worker } from "bullmq";
import sendEmail from "../helpers/sendEmail";
import { connection } from "../helpers/radis";
import { forgotPasswordHtml, otpHtml } from "../app/constant";
import { sendCouponMailHtml } from "../app/modules/businessreview";

new Worker(
  "email",
  async (job) => {
    const { email, fullName, otp, couponCode, businessMail } = job.data;
    let subject = "";
    let html = "";

    if (job.name === "sendOtp") {
      subject = "Account verification";
      html = otpHtml(fullName, otp);
    } else if (job.name === "forgotPasswordOtp") {
      subject = "Your Password Reset OTP";
      html = forgotPasswordHtml(fullName, otp);
    } else if (job.name === "sendCoupon") {
      const {
        title,
        description,
        couponCode,
        discountValue,
        discountType,
        expiryDate,
        email,
        businessMail,
      } = job.data;
      console.log(job.data);
      subject = `You've received a coupon`;
      html = sendCouponMailHtml(
        title,
        description,
        couponCode,
        discountType,
        discountValue,
        expiryDate
      );
    } else {
      console.warn(`Unknown job name: ${job.name}`);
      return;
    }
    try {
      // mail send hoi na
      await sendEmail(
        email,
        subject,
        html,
        `Your coupon code is: ${couponCode}`,
        businessMail
      );
      console.log(`✅ Email sent to ${email} for job: ${job.name}`);
    } catch (err) {
      console.error("Failed to send email:", err);
    }
  },
  { connection: connection }
);
