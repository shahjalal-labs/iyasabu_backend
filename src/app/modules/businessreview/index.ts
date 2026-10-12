import { Request, Response } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key";

// Function to generate JWT-based link for coupon
const generateCouponLink = (
  couponCode: string,
  ttlMinutes: number,
  ownerName: string,
  userName: string,
  discountType: string,
  discountValue: number
) => {
  const payload = {
    couponCode,
    ownerName,
    userName,
    discountType,
    discountValue,
    validUntil: ttlMinutes,
    action: "view-coupon",
  };

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: `${ttlMinutes}m` });

  return `https://api.reviewlift.net/api/v1/businessReview/offer/view-coupon?token=${token}`;
};

// Function to generate coupon email HTML
export const sendCouponMailHtml = (
  ownerName: string,
  userName: string,
  couponCode: string,
  discountType: string,
  discountValue: number,
  validUntil: number
) => {
  return `
  <div style="font-family: Arial, sans-serif; background-color: #f4f4f5; padding: 20px;">
    <div style="max-width: 480px; margin: 0 auto; background: #fff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); padding: 30px; text-align: center;">
      
      <!-- Header -->
          <table width="100%" style="font-size:14px; color:#555; margin-bottom:20px;">
            <tr>
              <td align="left" style="font-weight:bold;">${ownerName}</td>
              <td align="right">
                ${new Date().toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </td>
            </tr>
          </table>


      <!-- Title -->
      <h2 style="margin: 0; font-size: 22px; color: #1a73e8;">Congratulation 🎉</h2>

      <!-- Greeting -->
      <p style="font-size: 16px; color: #333; margin-top: 10px;">Dear ${userName},</p>

      <!-- Description -->
      <p style="font-size: 14px; color: #555; line-height: 1.6;">
        Thank you for sharing your valuable feedback with ${ownerName}. 
        As a token of our appreciation, we're giving you a exclusive <strong style="text-decoration: underline;">${discountValue} ${discountType}</strong> coupon for your next visit.
      </p>

      <!-- Coupon Code -->
      <div style="margin: 10px 0; padding: 10px; background: #f0f4ff; border-radius: 6px; ">
        <h2>Click the link & check your coupon code.</h2>
        <a style="color: #1a73e8; text-decoration: underline;  font-size: 24px; font-weight: bold; letter-spacing: 2px;" href="${generateCouponLink(
          couponCode,
          validUntil,
          ownerName,
          userName,
          discountType,
          discountValue
        )}">Coupon Link</a>
      </div>

      <!-- Validity -->
      <p style="font-size: 14px; color: #777; margin-top: 0;">
        This coupon is valid until ${validUntil} minutes.
      </p>

      <!-- Footer -->
      <p style="font-size: 12px; color: #999; margin-top: 30px; line-height: 1.4;">
        You’re receiving this email because you gave feedback to ${ownerName}. 
        If you have any questions, reply to this email — we’re happy to help.
      </p>

      <p style="font-size: 12px; color: #bbb; margin-top: 10px;">
        @${ownerName} All rights reserved.
      </p>

    </div>
  </div>
  `;
};

export const couponViewPageHtml = async (req: Request, res: Response) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).send("Invalid token");
  }

  try {
    const decoded: any = jwt.verify(token as string, JWT_SECRET);
    if (!decoded) {
      throw new Error("Invalid token");
    }

    const formattedDate = new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your Coupon</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: Arial, sans-serif;
      background-color: #fff;
      color: #333;
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .container {
      width: 90%;
      max-width: 480px;
      background: #fff;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.05);
      box-sizing: border-box;
    }
    .header-table {
      width: 100%;
      font-size: 14px;
      color: #555;
      margin-bottom: 20px;
      border-collapse: collapse;
    }
    .header-table td {
      padding: 0;
    }
    h2 {
      margin: 0;
      font-size: 22px;
      color: #1a73e8;
      font-weight: 600;
    }
    p {
      margin: 10px 0;
      line-height: 1.5;
    }
    .greeting {
      font-size: 16px;
      margin-top: 10px;
    }
    .description {
      font-size: 14px;
      color: #555;
      margin-top: 15px;
    }
    .coupon-box {
      margin: 20px 0;
      padding: 15px;
      background: #f0f4ff;
      border-radius: 8px;
      border: 1px solid #d0d9ff;
    }
    .coupon-code {
      color: #1a73e8;
      font-size: 24px;
      font-weight: bold;
      letter-spacing: 1px;
      margin-top: 5px;
      word-break: break-all;
      overflow-wrap: break-word;
    }
    .validity {
      font-size: 14px;
      color: #777;
      margin-top: 10px;
    }
    .footer {
      font-size: 12px;
      color: #999;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #eee;
      line-height: 1.4;
    }
    .copyright {
      font-size: 12px;
      color: #bbb;
      margin-top: 10px;
    }

    @media (max-width: 480px) {
      .container {
        padding: 18px;
      }
      h2 {
        font-size: 20px;
      }
      .coupon-code {
        font-size: 20px;
        letter-spacing: 0.5px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <table class="header-table">
      <tr>
        <td align="left" style="font-weight:bold;">${decoded.ownerName}</td>
        <td align="right">${formattedDate}</td>
      </tr>
    </table>

    <!-- Title -->
    <h2>Congratulation 🎉</h2>

    <!-- Greeting -->
    <p class="greeting">Dear ${decoded.userName},</p>

    <!-- Description -->
    <p class="description">
      Thank you for sharing your valuable feedback with ${decoded.ownerName}. 
      As a token of our appreciation, we're giving you an exclusive 
      <strong style="text-decoration: underline; color: #1a73e8;">${decoded.discountValue} ${decoded.discountType}</strong> 
      coupon for your next visit.
    </p>

    <!-- Coupon Code Box -->
    <div class="coupon-box">
      <p style="margin: 0; font-size: 14px; color: #333;">Your coupon code is:</p>
      <div class="coupon-code">${decoded.couponCode}</div>
    </div>

    <!-- Validity -->
    <p class="validity">
      This coupon is valid until ${decoded.validUntil} minutes.
    </p>

    <!-- Footer -->
    <p class="footer">
      You’re receiving this email because you gave feedback to ${decoded.ownerName}. 
      If you have any questions, reply to this email — we’re happy to help.
    </p>

    <p class="copyright">@${decoded.ownerName} All rights reserved.</p>
  </div>
</body>
</html>
    `;
    res.send(html);

  } catch (error) {
    const expiredHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Link Expired</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: Arial, sans-serif;
      background-color: #fff;
      color: #333;
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .container {
      width: 90%;
      max-width: 480px;
      background: #fff;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.05);
      box-sizing: border-box;
    }
    .header-table {
      width: 100%;
      font-size: 14px;
      color: #555;
      margin-bottom: 20px;
      border-collapse: collapse;
    }
    h2 {
      margin: 0;
      font-size: 22px;
      color: #d32f2f;
      font-weight: 600;
    }
    p {
      margin: 10px 0;
      line-height: 1.5;
    }
    .footer {
      font-size: 12px;
      color: #999;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #eee;
      line-height: 1.4;
    }
    .copyright {
      font-size: 12px;
      color: #bbb;
      margin-top: 10px;
    }

    @media (max-width: 480px) {
      .container {
        padding: 18px;
      }
      h2 {
        font-size: 20px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <table class="header-table">
      <tr>
        <td align="left" style="font-weight:bold;">Expired Link</td>
        <td align="right">${new Date().toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        })}</td>
      </tr>
    </table>

    <h2>Oops! Link Expired 🕒</h2>

    <p style="font-size: 16px;">
      Sorry, this coupon link has expired or is invalid.
    </p>

    <p style="font-size: 14px; color: #555; margin-top: 15px;">
      Please contact the business for assistance or check if you received another link.
    </p>

    <p class="footer">thanks for understanding.</p>
    <p class="copyright">@X Business All rights reserved.</p>
  </div>
</body>
</html>
    `;
    res.status(401).send(expiredHtml);
  }
};

// export const couponViewPageHtml = async (req: Request, res: Response) => {
//   const { token } = req.query;

//   if (!token) {
//     return res.status(400).send("Invalid token");
//   }

//   try {
//     const decoded: any = jwt.verify(token as string, JWT_SECRET);
//     if (!decoded) {
//       throw new Error("Invalid token");
//     }

//     // Format date properly
//     const formattedDate = new Date().toLocaleDateString("en-GB", {
//       day: "2-digit",
//       month: "long",
//       year: "numeric",
//     });

//     // Render the coupon view page with the coupon code
//     const html = `
//       <div style="font-family: Arial, sans-serif; background-color: #fff; padding: 120px; text-align: center;">
//         <div style="max-width: 480px; margin: 0 auto; background: #fff; border-radius: 12px; padding: 30px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">

//           <!-- Header -->
//           <table width="100%" style="font-size:14px; color:#555; margin-bottom:20px;">
//             <tr>
//               <td align="left" style="font-weight:bold;">${decoded.ownerName}</td>
//               <td align="right">${formattedDate}</td>
//             </tr>
//           </table>

//           <!-- Title -->
//           <h2 style="margin: 0; font-size: 22px; color: #1a73e8; font-weight: 600;">Congratulation 🎉</h2>

//           <!-- Greeting -->
//           <p style="font-size: 16px; color: #333; margin-top: 10px; line-height: 1.4;">Dear ${decoded.userName},</p>

//           <!-- Description -->
//           <p style="font-size: 14px; color: #555; line-height: 1.6; margin-top: 15px;">
//             Thank you for sharing your valuable feedback with ${decoded.ownerName}. 
//             As a token of our appreciation, we're giving you an exclusive <strong style="text-decoration: underline; color: #1a73e8;">${decoded.discountValue} ${decoded.discountType}</strong> coupon for your next visit.
//           </p>

//           <!-- Coupon Code Box -->
//           <div style="margin: 20px 0; padding: 15px; background: #f0f4ff; border-radius: 8px; border: 1px solid #d0d9ff;">
//             <p style="margin: 0; font-size: 14px; color: #333;">Your coupon code is:</p>
//             <div style="color: #1a73e8; font-size: 24px; font-weight: bold; letter-spacing: 2px; margin-top: 5px; word-break: break-all;">
//               ${decoded.couponCode}
//             </div>
//           </div>

//           <!-- Validity -->
//           <p style="font-size: 14px; color: #777; margin-top: 10px;">
//             This coupon is valid until ${decoded.validUntil} minutes.
//           </p>

//           <!-- Footer -->
//           <p style="font-size: 12px; color: #999; margin-top: 30px; line-height: 1.4; border-top: 1px solid #eee; padding-top: 20px;">
//             You’re receiving this email because you gave feedback to ${decoded.ownerName}. 
//             If you have any questions, reply to this email — we’re happy to help.
//           </p>

//           <p style="font-size: 12px; color: #bbb; margin-top: 10px;">
//             @${decoded.ownerName} All rights reserved.
//           </p>

//         </div>
//       </div>
//     `;
//     res.send(html);

//   } catch (error) {
//     // Show Expired UI instead of plain text
//     const expiredHtml = `
//       <div style="font-family: Arial, sans-serif; background-color: #fff; padding: 120px; text-align: center;">
//         <div style="max-width: 480px; margin: 0 auto; background: #fff; border-radius: 12px; padding: 30px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">

//           <!-- Header -->
//           <table width="100%" style="font-size:14px; color:#555; margin-bottom:20px;">
//             <tr>
//               <td align="left" style="font-weight:bold;">${"Expired Link"}</td>
//               <td align="right">${new Date().toLocaleDateString("en-GB", {
//                 day: "2-digit",
//                 month: "long",
//                 year: "numeric",
//               })}</td>
//             </tr>
//           </table>

//           <!-- Title -->
//           <h2 style="margin: 0; font-size: 22px; color: #d32f2f; font-weight: 600;">Oops! Link Expired 🕒</h2>

//           <!-- Message -->
//           <p style="font-size: 16px; color: #333; margin-top: 10px; line-height: 1.4;">
//             Sorry, this coupon link has expired or is invalid.
//           </p>

//           <p style="font-size: 14px; color: #555; line-height: 1.6; margin-top: 15px;">
//             Please contact the business for assistance or check if you received another link.
//           </p>

//           <!-- Footer -->
//           <p style="font-size: 12px; color: #999; margin-top: 30px; line-height: 1.4; border-top: 1px solid #eee; padding-top: 20px;">
//             thanks for understanding.
//           </p>

//           <p style="font-size: 12px; color: #bbb; margin-top: 10px;">
//             @X Business All rights reserved.
//           </p>

//         </div>
//       </div>
//     `;
//     res.status(401).send(expiredHtml);
//   }
// };