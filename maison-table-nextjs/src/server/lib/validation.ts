/**
 * Shared Zod validation schemas used by API routes and server actions.
 * Import these on the server only — never in "use client" components.
 */
import { z } from "zod";

// ─── Checkout ─────────────────────────────────────────────────────────────────

export const CheckoutLineSchema = z.object({
  menuItemId: z.string().min(1),
  qty:        z.number().int().min(1).max(20),
  note:       z.string().max(300).optional().default(""),
});

export const CheckoutBodySchema = z.object({
  customer: z.object({
    name:    z.string().trim().min(2).max(120),
    email:   z.string().trim().email().max(255).optional(),
    phone:   z.string().trim().regex(/^[+\d][\d\s()-]{6,19}$/, "Invalid phone number"),
    address: z.string().trim().min(6).max(300),
  }),
  deliveryNotes:  z.string().max(500).optional().default(""),
  lines:          z.array(CheckoutLineSchema).min(1).max(30),
  paymentMethod:  z.enum(["cod", "online"]),
  promoCode:      z.string().trim().toUpperCase().max(30).optional(),
  idempotencyKey: z.string().max(100).optional(),
});

export type CheckoutBody = z.infer<typeof CheckoutBodySchema>;

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const RegisterBodySchema = z.object({
  name:     z.string().trim().min(2).max(120),
  email:    z.string().trim().email().max(255),
  password: z.string().min(8).max(100),
  phone:    z.string().trim().optional(),
});

export const LoginBodySchema = z.object({
  email:    z.string().trim().email().max(255),
  password: z.string().min(1).max(100),
});

// ─── Admin: order status transition ──────────────────────────────────────────

export const OrderStatusSchema = z.enum([
  "pending","confirmed","preparing","ready","out_for_delivery","delivered","cancelled",
]);

export const UpdateOrderStatusBodySchema = z.object({
  status: OrderStatusSchema,
});

// ─── Admin: menu item ─────────────────────────────────────────────────────────

export const MenuItemBodySchema = z.object({
  name:        z.string().trim().min(1).max(120),
  slug:        z.string().trim().min(1).max(120).regex(/^[a-z0-9-]+$/, "slug must be lowercase letters, numbers, and hyphens"),
  description: z.string().trim().max(1000).optional().default(""),
  image:       z.string().url("Must be a valid URL").optional().nullable(),
  categoryId:  z.string().min(1),
  // Price in dollars from the form; server converts to cents.
  price:       z.number().positive("Price must be positive"),
  dietary:     z.array(z.enum(["vegetarian","vegan","gluten-free","spicy","dairy-free"])).default([]),
  available:   z.boolean().default(true),
  featured:    z.boolean().default(false),
  bestSeller:  z.boolean().default(false),
  chefPick:    z.boolean().default(false),
  sortOrder:   z.number().int().default(0),
});

// ─── Admin: promotion ─────────────────────────────────────────────────────────

export const PromotionBodySchema = z.object({
  code:             z.string().trim().toUpperCase().min(3).max(30),
  description:      z.string().trim().max(200).optional().default(""),
  type:             z.enum(["percent", "fixed", "free_delivery"]),
  discountValue:    z.number().min(0),
  minSubtotalCents: z.number().int().min(0).default(0),
  maxUses:          z.number().int().positive().optional().nullable(),
  active:           z.boolean().default(true),
  startsAt:         z.coerce.date().optional().nullable(),
  expiresAt:        z.coerce.date().optional().nullable(),
});
