# 🏢 Iyasabu — B2B Merchant Directory & Wholesale Commerce API

<p align="center">
  <img src="./assets/banner.svg" alt="Architecture Banner" width="100%" />
</p>

<p align="center">
  <a href="https://www.postman.com/shahjalal-backend-9458759/shahjalal-api-portfolio/collection/48491387-0ef3af88-e36d-42e5-82a1-a6e5a98a6fb1">
    <img src="https://run.pstmn.io/button.svg" alt="Run In Postman" style="height: 34px;" />
  </a>
  &nbsp;&nbsp;
  <a href="https://www.postman.com/shahjalal-backend-9458759/shahjalal-api-portfolio/collection/48491387-0ef3af88-e36d-42e5-82a1-a6e5a98a6fb1">
    <img src="https://img.shields.io/badge/Postman-Interactive%20API%20Documentation-FF6C37?style=for-the-badge&logo=postman&logoColor=white" alt="Postman Documentation" />
  </a>
  &nbsp;&nbsp;
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  &nbsp;&nbsp;
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
  &nbsp;&nbsp;
  <img src="https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express" />
</p>

---

## 📌 Executive Overview

B2B enterprise merchant directory and multi-vendor commerce platform API with dynamic shipping cost matrices, promotional coupon engine, merchant verified profiles, and vendor subscription tiers built with Node.js, Express, TypeScript, and Prisma.

This microservice has been designed following enterprise software engineering standards, featuring clean modular service architecture, centralized error handling, robust JWT authorization, strict input validation, and comprehensive automated database models.

---

## ⚡ Interactive API Documentation (Postman)

The entire API specification, complete with route headers, payload samples, and JWT authentication schemas, is published and directly accessible in the public Postman workspace:

👉 **[Launch Interactive Postman Workspace](https://www.postman.com/shahjalal-backend-9458759/shahjalal-api-portfolio/collection/48491387-0ef3af88-e36d-42e5-82a1-a6e5a98a6fb1)** *(No forking or sign-in required — instant browser reference)*

- **Collection UID**: `48491387-0ef3af88-e36d-42e5-82a1-a6e5a98a6fb1`
- **Workspace**: Shahjalal API Portfolio
- **Environment**: Cloud Production / Local Docker Compose

---

## 🏗️ Architecture & Data Modeling

The backend persistence layer is engineered with production database schemas:

| Entity Model | Domain Responsibility |
| :--- | :--- |
| `BusinessProfile` | Verified corporate merchant profiles, trade categories, and storefronts |
| `Product / Order / OrderProduct` | B2B wholesale inventory, tiered pricing, and bulk purchase orders |
| `ShippingAddress / ShippingCost` | Dynamic logistics zone routing and destination-based tariffs |
| `Coupon / Plan` | Promotional discount voucher codes and merchant subscription tiers |

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** v18.x or v20.x
- **PostgreSQL** or **MongoDB** (refer to `.env.example`)
- **Redis** (for BullMQ queues where applicable)

### 2. Installation & Setup
```bash
# Clone the repository
git clone https://github.com/shahjalal-labs/iyasabu_backend.git
cd iyasabu_backend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
```

### 3. Database Migration & Development
```bash
# Generate database client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Start development server
npm run dev
```

---

## 👨‍💻 Engineering & Maintainer

**Md. Shahjalal**  
*Full Stack Software Engineer & Solutions Architect*  
- **Email**: [muhommodshahjalal@gmail.com](mailto:muhommodshahjalal@gmail.com)  
- **GitHub**: [@shahjalal-labs](https://github.com/shahjalal-labs)  
- **Postman Portfolio**: [Shahjalal API Portfolio](https://www.postman.com/shahjalal-backend-9458759/shahjalal-api-portfolio)

---
<p align="center"><sub>Engineered with precision for production reliability and seamless scalability.</sub></p>
