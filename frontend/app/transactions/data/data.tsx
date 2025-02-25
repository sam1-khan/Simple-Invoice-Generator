// app/transactions/data/data.tsx
// Define filter options for invoices

export const taxStatusOptions = [
  { value: "true", label: "Taxed" },
  { value: "false", label: "Not Taxed" },
];

export const invoiceTypeOptions = [
  { value: "quotation", label: "Quotation" },
  { value: "invoice", label: "Invoice" },
];

export const transitChargeOptions = [
  { value: "has", label: "Has Charges" },
  { value: "none", label: "No Charges" },
];
