import { z } from 'zod';

export const paymentValidation = z.object({
    planId: z.string({ required_error: 'plan id is Requires' }),
});
