import bcrypt from "bcryptjs";
import {  User, UserRole } from "@prisma/client";
import config from "../../config";
import prisma from "../../shared/prisma";

const superAdminData  = {
  firstName: "Super",
  lastName : "Admin",
  email: "admin@gmail.com",
  password: config.super_admin_password!,
  role: UserRole.Admin,
};

const seedSuperAdmin = async () => {
  try {
    // Check if a super admin already exists
    const isSuperAdminExists = await prisma.user.findFirst({
      where: {
        role: UserRole.Admin,
      },
    });

    // If not, create one
    if (!isSuperAdminExists) {
      superAdminData.password = await bcrypt.hash(
        config.super_admin_password as string,
        Number(config.bcrypt_salt_rounds) || 12
      );

      await prisma.user.create({
        data: superAdminData,
      });
      console.log("🦸 Super Admin created successfully.");
    } else {
      return;
      //   console.log("Super Admin already exists.");
    }
  } catch (error) {
    console.error("Error seeding Super Admin:", error);
  }
};

export default seedSuperAdmin;
