import { z } from 'zod';

export const createOrderSchema = z.object({
  items: z
    .array(
      z.object({
        menuItemId: z.string().min(1),
        quantity: z.number().int().min(1).max(20),
      }),
    )
    .min(1),
  deliveryDetails: z.object({
    name: z.string().trim().min(2).max(80),
    address: z.string().trim().min(5).max(200),
    phoneNumber: z
      .string()
      .trim()
      .regex(/^[0-9+()\-\s]{7,20}$/),
  }),
});

export const updateStatusSchema = z.object({
  status: z.enum(['Order Received', 'Preparing', 'Out for Delivery', 'Delivered']),
});
