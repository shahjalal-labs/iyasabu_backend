import { z } from "zod";

const userRegisterValidationSchema = z.object({
  firstName: z.string().min(1, "first name is required"),
  lastName: z.string().min(1, "last name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const userValidation = {
  userRegisterValidationSchema,
};