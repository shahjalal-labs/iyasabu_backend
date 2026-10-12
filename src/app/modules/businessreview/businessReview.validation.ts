import * as z from 'zod';
 
export const createBusinessReviewSchema = z.object({
  // Define fields
  email : z.string().email().optional(),
  comment : z.string().min(2).max(1000).optional(),
  reviewStatus : z.enum(['Excellent', 'Neutral', 'Bad']),
});
