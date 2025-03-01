import { z } from "zod";

export const invoiceOwnerSchema = z.object({
  id: z.number(),
  email: z.string(),
  name: z.string(),
  address: z.string().nullable().optional(),
  phone: z.string(),
  phone_2: z.string().nullable().optional(),
  ntn_number: z.string().nullable().optional(),
  bank: z.string().nullable().optional(),
  account_title: z.string().nullable().optional(),
  iban: z.string().nullable().optional(),
  logo: z.string().nullable().optional(),
  signature: z.string().nullable().optional(),
  is_onboarded: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const clientSchema = z.object({
  id: z.number(),
  name: z.string(),
  invoice_owner: invoiceOwnerSchema,
  address: z.string().nullable().optional(),
  ntn_number: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const transactionSchema = z.object({
  id: z.number(),
  client: clientSchema,
  reference_number: z.string(),
  tax_percentage: z.number().optional().nullable(),
  total_price: z.number(),
  tax: z.number(),
  grand_total: z.number(),
  date: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  is_taxed: z.boolean(),
  is_paid: z.boolean(),
  is_quotation: z.boolean(),
  transit_charges: z.number().optional().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type Transaction = z.infer<typeof transactionSchema>;
export type Client = z.infer<typeof clientSchema>;
