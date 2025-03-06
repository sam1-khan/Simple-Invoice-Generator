import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(input: string | number): string {
  const date = new Date(input);
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function absoluteUrl(path: string) {
  return `${process.env.NEXT_PUBLIC_API_URL}${path}`;
}

export const getCountryFromIP = async (): Promise<string> => {
  try {
    const res = await fetch("https://ipinfo.io/json?token=a7b20789cf45dd");
    const data = await res.json();
    return data.country || "PK";
  } catch (error) {
    console.error("Error fetching country:", error);
    return "PK";
  }
};

export const getCurrencyFromCountry = (countryCode: string): string => {
  const currencyMap: Record<string, string> = {
    US: "USD",
    GB: "GBP",
    CA: "CAD",
    AU: "AUD",
    FR: "EUR",
    DE: "EUR",
    IN: "INR",
    JP: "JPY",
    CN: "CNY",
    PK: "PKR",
    AE: "AED",
    SA: "SAR",
    RU: "RUB",
    BR: "BRL",
    MX: "MXN",
    ZA: "ZAR",
    NG: "NGN",
    KR: "KRW",
    TR: "TRY",
    ID: "IDR",
    MY: "MYR",
    TH: "THB",
    VN: "VND",
    PH: "PHP",
    BD: "BDT",
    EG: "EGP",
    SG: "SGD",
    HK: "HKD",
    NZ: "NZD",
    CH: "CHF",
    SE: "SEK",
    NO: "NOK",
    DK: "DKK",
    IL: "ILS",
    CL: "CLP",
    CO: "COP",
    AR: "ARS",
    KE: "KES",
    GH: "GHS",
    TW: "TWD",
  };
  return currencyMap[countryCode] || "PKR";
};

// Utility function to format currency
export const formatCurrency = (amount: number, currency: string) => {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
  }).format(amount);
};
