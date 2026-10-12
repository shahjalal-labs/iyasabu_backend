import { z } from "zod";

const authLoginSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const authValidation = {
  authLoginSchema,
};

export const businessOwnerProfile = z.object({
  businessName : z.string(),
  businessEmail:z.string().email("Invalid email address"),
  location : z.string(),
  googleReviewUrI : z.string().url({message : "Invalid URL"}),
  primaryColur : z.string(),
})
export const businessOwnerProfileUpdate = z.object({
  businessName : z.string().optional(),
  businessEmail:z.string().email("Invalid email address"),
  location : z.string().optional(),
  googleReviewUrI : z.string().url({message : "Invalid URL"}).optional(),
  primaryColur : z.string().optional(),
})