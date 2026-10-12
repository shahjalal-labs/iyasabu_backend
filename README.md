# Iyasabu Backend - Business Reviews & Commerce API

<p align="center">
  <img src="assets/banner.svg" alt="iyasabu_backend Banner" width="100%">
</p>

<p align="center">
  <a href="https://nodejs.org"><img src="https://img.shields.io/badge/Node.js-20.x-green?style=for-the-badge&logo=node.js" alt="Node.js"></a>
  <a href="https://expressjs.com"><img src="https://img.shields.io/badge/Express-4.21-black?style=for-the-badge&logo=express" alt="Express"></a>
  <a href="https://www.typescriptlang.org"><img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript" alt="TypeScript"></a>
  <a href="https://www.prisma.io"><img src="https://img.shields.io/badge/Prisma-6.x-2D3748?style=for-the-badge&logo=prisma" alt="Prisma"></a>
  <a href="https://www.mongodb.com"><img src="https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb" alt="MongoDB"></a>
  <a href="https://bullmq.io"><img src="https://img.shields.io/badge/BullMQ-5.x-FF4500?style=for-the-badge&logo=redis" alt="BullMQ"></a>
  <a href="https://stripe.com"><img src="https://img.shields.io/badge/Stripe-635BFF?style=for-the-badge&logo=stripe" alt="Stripe"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-ISC-blue?style=for-the-badge" alt="License"></a>
</p>

---

## 📖 Overview

**iyasabu_backend** is a verified business review and local enterprise commerce API built with Node.js, Express.js, TypeScript, and Prisma ORM with MongoDB. The system empowers businesses to establish verified organizational profiles, collect customer reviews, run coupon campaigns, process e-commerce orders via Stripe, and run asynchronous email queues with BullMQ.

---

## ⚡ Key Features

- 🏢 **Verified Business Profiles:** Enterprise registration with location data, business categories, and operating hours.
- ⭐ **Verified Review Engine:** Two-sided customer review submissions, photo attachments, and merchant reply workflows.
- 🎟️ **Coupon & Promotion Management:** Dynamic discount coupons with usage thresholds and expiry timestamps.
- 📦 **E-Commerce Order Fulfillment:** Integrated checkout supporting item variants, destination shipping calculations, and Stripe payments.
- ⚡ **BullMQ Background Workers:** High-throughput email worker processing transactional messages and review notifications via Redis.
- ☁️ **DigitalOcean Spaces Integration:** S3-compatible cloud media hosting for business brand assets and review photos.

---

## 🏗️ System Architecture

```mermaid
flowchart TD
    Client[Web & Mobile Clients] -->|HTTPS REST| Router[Express Application Gateway]

    subgraph Security ["Security & Auth"]
        Router --> Auth[JWT Role Guard]
        Router --> Val[Request Body Validation]
    end

    subgraph BusinessPlatform ["Commerce & Review Modules"]
        Auth --> ProfileMod[Business Profiles & Directory]
        Auth --> ReviewMod[Verified Reviews & Ratings]
        Auth --> CouponMod[Promotional Coupons Engine]
        Auth --> OrderMod[Orders & Shipping Calculations]
    end

    subgraph PaymentsQueue ["Payments & Queues"]
        OrderMod --> Stripe[Stripe Payment Engine]
        OrderMod --> BullMQ[BullMQ Redis Worker Queue]
        BullMQ --> Mailer[Transactional Email Dispatch]
    end

    subgraph Storage ["Database & CDN"]
        BusinessPlatform --> Prisma[Prisma ORM Client]
        Prisma --> MongoDB[(MongoDB Cluster)]
        BusinessPlatform --> DOSpaces[DigitalOcean Spaces S3]
    end
```

---

## 📂 Directory Structure

```text
.
├── src/
│   ├── app/
│   ├── components/
│   └── ...
├── assets/
│   └── banner.svg
├── .env.example
├── .gitignore
├── package.json
├── README.md
└── LICENSE
```

---

## 🛠️ Tech Stack & Dependencies

| Layer / Library | Version | Description |
|---|---|---|
| **Express.js** | `v4.21` | HTTP routing and middleware framework |
| **TypeScript** | `v5.x` | Type safety across business logic |
| **Prisma ORM** | `v6.x` | MongoDB modeling and query construction |
| **BullMQ** | `v5.x` | Asynchronous job queues and email processing |
| **Stripe SDK** | `v17.x` | Payment gateway integration |
| **AWS SDK (S3 Client)** | `v3.x` | DigitalOcean Spaces file storage integration |

---

## ⚙️ Environment Variables

Create a `.env` file in the project root based on the provided sample:

```bash
cp .env.example .env
```

Configurable variables:

```env
PORT=8000
NODE_ENV=development
DATABASE_URL=mongodb+srv://<username>:<password>@cluster.mongodb.net/iyasabu?retryWrites=true&w=majority

JWT_SECRET=your_jwt_secret
EXPIRES_IN=15d

# Redis / BullMQ
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

# Stripe
STRIPE_PK=pk_test_your_stripe_public_key
STRIPE_SK=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_stripe_webhook_secret

# DigitalOcean Spaces
DO_SPACE_ENDPOINT=https://nyc3.digitaloceanspaces.com
DO_SPACE_ACCESS_KEY=your_access_key
DO_SPACE_SECRET_KEY=your_secret_key
DO_SPACE_BUCKET=iyasabu-storage
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v20.x or higher recommended)
- Package Manager (`npm`, `yarn`, or `pnpm`)

### Installation

```bash
# Clone repository
git clone https://github.com/shahjalal-labs/iyasabu_backend.git
cd iyasabu_backend

# Install dependencies
npm install
```

### Running Locally

```bash
# Start development server
npm run dev
# or for backend services
npm run start:dev
```

### Building for Production

```bash
# Create production build
npm run build

# Start production server
npm start
```

---

## 📄 License

This project is licensed under the [ISC License](LICENSE).
