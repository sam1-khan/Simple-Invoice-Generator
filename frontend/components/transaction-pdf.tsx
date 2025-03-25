"use client";

import React, { useEffect, useState } from "react";
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";
import { createTw } from "react-pdf-tailwind";
import {
  formatCurrency,
  getCountryFromIP,
  getCurrencyFromCountry,
} from "@/lib/utils";

const formatNumber = (value: string | number) => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  return num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

const tw = createTw({
  theme: {
    extend: {
      colors: {
        muted: "#6c757d",
        danger: "#dc3545",
      },
    },
  },
});

const styles = StyleSheet.create({
  page: {
    padding: 50,
    fontSize: 10,
    color: "#212529",
  },
  body: {
    border: "0.8",
    borderColor: "#c6c7c8",
    fontFamily: "system-ui",
  },
  header: {
    textAlign: "center",
    marginBottom: 10,
    marginTop: -10,
    padding: 10,
  },
  headerDetails: {
    // New style for header details
    fontSize: 12, // Increased from default 10
    marginBottom: 5,
  },
  logo: {
    marginTop: -50,
    marginHorizontal: "auto",
    marginBottom: -25,
    width: 150,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 8,
  },
  clientDetails: {
    marginBottom: 5,
  },
  invoiceDetails: {
    marginBottom: 5,
  },
  tableHeader: {
    backgroundColor: "#f8f9fa",
    fontWeight: "600",
    textAlign: "center",
    padding: 10,
  },
  tableRow: {
    textAlign: "center",
    padding: 5,
  },
  tableCell: {
    padding: 5,
  },
  borderedTable: {
    marginBottom: 10,
  },
  borderedCell: {
    padding: 5,
  },
  footer: {
    marginTop: 20,
    fontSize: 9, // Reduced from 8 to maintain hierarchy
    color: "#6c757d",
  },
  signature: {
    width: 150,
    height: 150,
    marginTop: -50,
  },
  signaturePlaceholder: {
    width: 150,
    height: 70,
    overflow: "hidden",
    display: "flex",
    justifyContent: "center",
  },
  signatureText: {
    borderTopWidth: 0.8,
    borderTopColor: "#000",
    paddingTop: 5,
    marginRight: 10,
    width: "auto",
  },
  descriptionText: {
    marginTop: 1,
    marginBottom: 1,
  },
});

const TransactionPDF = ({ invoice, items }) => {
  const [currency, setCurrency] = useState<string>("PKR");

  useEffect(() => {
    (async () => {
      const countryCode = await getCountryFromIP();
      setCurrency(getCurrencyFromCountry(countryCode));
    })();
  }, []);

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header Section */}
        <View style={styles.header} fixed>
          <Image
            src={`${baseUrl}/${invoice.client.invoice_owner?.logo}`}
            style={styles.logo}
          />
          <Text style={styles.title}>
            {invoice.client.invoice_owner?.name || ""}
          </Text>
          <Text style={styles.headerDetails}>
            {" "}
            {/* Using new headerDetails style */}
            {invoice.client.invoice_owner?.address || ""}
          </Text>
          <Text style={styles.headerDetails}>
            {" "}
            {/* Using new headerDetails style */}
            {invoice.client.invoice_owner?.phone || ""}
            {invoice.client.invoice_owner?.phone_2 &&
              `, ${invoice.client.invoice_owner.phone_2}`}
          </Text>
          <Text style={styles.headerDetails}>
            {" "}
            {/* Using new headerDetails style */}
            {invoice.client.invoice_owner?.email || ""}
          </Text>
          <Text style={styles.headerDetails}>
            {" "}
            {/* Using new headerDetails style */}
            <Text style={{ fontWeight: "600" }}>
              NTN No: {invoice.client.invoice_owner?.ntn_number || ""}
            </Text>
          </Text>
        </View>

        {/* Invoice Title */}
        <Text
          fixed
          style={{
            fontWeight: 600,
            fontSize: 12,
            textAlign: "center",
            marginBottom: 10,
            marginTop: -10,
          }}
        >
          {invoice.is_quotation ? "Quotation" : "Invoice"}
        </Text>

        {/* Client and Invoice Details */}
        <View fixed style={{ flexDirection: "row", marginBottom: 10 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: "600", marginBottom: 5 }}>Client:</Text>
            <Text style={styles.clientDetails}>
              {invoice.client?.name || ""}
            </Text>
            {invoice.client?.address && (
              <Text style={styles.clientDetails}>{invoice.client.address}</Text>
            )}
            {invoice.client?.phone && (
              <Text style={styles.clientDetails}>
                <Text style={{ fontWeight: "600" }}>
                  Phone: {invoice.client.phone}
                </Text>
              </Text>
            )}
            {invoice.client?.ntn_number && (
              <Text style={styles.clientDetails}>
                <Text style={{ fontWeight: "600" }}>NTN No: </Text>
                {invoice.client.ntn_number}
              </Text>
            )}
          </View>
          <View style={{ flex: 1, alignItems: "flex-end" }}>
            <Text style={{ fontWeight: "600", marginBottom: 5 }}>
              {invoice.is_quotation ? "Quotation" : "Invoice"} Details:
            </Text>
            <Text style={styles.invoiceDetails}>
              <Text style={{ fontWeight: "600" }}>Ref #:</Text>{" "}
              {invoice.reference_number || ""}
            </Text>
            <Text style={styles.invoiceDetails}>
              <Text style={{ fontWeight: "600" }}>Date:</Text>{" "}
              {invoice.date ||
                new Date(invoice.created_at).toISOString().split("T")[0]}
            </Text>
          </View>
        </View>

        {/* Invoice Items Table */}
        <View style={[tw("mb-2 text-[0.95rem]"),  {fontSize: 10}]}>
          {/* Table Header - Now properly centered */}
          <View
            style={tw("flex-row bg-gray-100 border border-gray-300 h-10 py-5")}
          >
            <View style={tw("w-[8%] border-r border-gray-300")}>
              <Text style={tw("text-center font-[600]")}>#</Text>
            </View>
            <View style={tw("w-[42%] border-r border-gray-300")}>
              <Text style={tw("text-center font-[600]")}>Name</Text>
            </View>
            <View style={tw("w-[15%] border-r border-gray-300")}>
              <Text style={tw("text-center font-[600]")}>Quantity</Text>
            </View>
            <View style={tw("w-[15%] border-r border-gray-300")}>
              <Text style={tw("text-center font-[600]")}>Unit</Text>
            </View>
            <View style={tw("w-[15%] border-r border-gray-300")}>
              <Text style={tw("text-center font-[600]")}>Unit Price</Text>
            </View>
            <View style={tw("w-[15%]")}>
              <Text style={tw("text-center font-[600]")}>Total Price</Text>
            </View>
          </View>

          {/* Table Rows */}
          {items.length > 0 ? (
            items.map((item: any, index: number) => (
              <View
                key={index}
                style={tw(
                  "flex-row border border-gray-300 border-t-0 min-h-[30px]"
                )}
              >
                <View
                  style={tw(
                    "w-[8%] border-r border-gray-300 flex justify-center"
                  )}
                >
                  <Text style={tw("text-center")}>{index + 1}</Text>
                </View>
                <View style={tw("w-[42%] border-r border-gray-300 p-1")}>
                  <Text>{item.name || ""}</Text>
                  {item.description && (
                    <Text
                      style={[
                        tw("text-muted py-1 text-[8px]"),
                        styles.descriptionText,
                      ]}
                    >
                      {item.description}
                    </Text>
                  )}
                </View>
                <View
                  style={tw(
                    "w-[15%] border-r border-gray-300 flex justify-center"
                  )}
                >
                  <Text style={tw("text-center")}>{item.quantity || ""}</Text>
                </View>
                <View
                  style={tw(
                    "w-[15%] border-r border-gray-300 flex justify-center"
                  )}
                >
                  <Text style={tw("text-center")}>{item.unit || ""}</Text>
                </View>
                <View
                  style={tw(
                    "w-[15%] border-r border-gray-300 flex justify-center"
                  )}
                >
                  <Text style={tw("text-center")}>{formatNumber(item.unit_price)|| ""}</Text>
                </View>
                <View style={tw("w-[15%] flex justify-center")}>
                  <Text style={tw("text-center")}>
                    {formatNumber(item.total_price) || ""}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <View style={tw("border border-gray-300 border-t-0 p-2")}>
              <Text style={tw("text-center text-danger")}>
                No items for this{" "}
                {invoice.is_quotation ? "quotation" : "invoice"}.
              </Text>
            </View>
          )}
        </View>

        {/* Invoice Summary */}
        <View style={tw("border border-gray-300 p-3")}>
          {" "}
          {/* Added padding here */}
          {/* Transit Charges Row */}
          {invoice.transit_charges && (
            <View
              style={[tw(
                "flex-row justify-between border-b border-gray-300 py-2"
              ), {fontSize: 12}]}
            >
              <Text style={tw("w-[50%] font-[600] pl-2")}>Transit Charges</Text>
              <Text style={[tw("w-[50%] text-right font-[600] pr-2"), {fontSize: 12}]}>
                {formatCurrency(invoice.transit_charges , currency)}
              </Text>
            </View>
          )}
          {/* Total Row */}
          <View style={[tw("flex-row justify-between"),  {fontSize: 12}]}>
            <Text style={tw("w-[50%] font-[600] pl-2")}>
              Total
              {(invoice.tax_percentage || invoice.is_taxed) && (
                <Text style={[tw("text-muted pl-1"),  {fontSize: 8}]}> incl. tax</Text>
              )}
            </Text>
            <Text style={tw("w-[50%] text-right font-[600] pr-2")}>
              {formatCurrency(invoice.grand_total, currency) || formatCurrency(invoice.total_price, currency)}
            </Text>
          </View>
        </View>

        {/* Footer Section */}
        <View fixed style={styles.footer}>
          <View style={{ flexDirection: "row" }}>
            <View style={{ flex: 1 }}>
              {!invoice.is_quotation && invoice.client.invoice_owner?.bank && (
                <View>
                  <Text style={[styles.clientDetails, { fontWeight: 600 }]}>
                    Payment Details:
                  </Text>
                  <Text style={styles.clientDetails}>
                    Bank: {invoice.client.invoice_owner.bank}
                  </Text>
                  <Text style={styles.clientDetails}>
                    Title: {invoice.client.invoice_owner.account_title}
                  </Text>
                  <Text style={styles.clientDetails}>
                    IBAN: {invoice.client.invoice_owner.iban}
                  </Text>
                </View>
              )}
              {invoice.notes && (
                <View style={{ marginTop: 10 }}>
                  <Text style={{ fontWeight: "600", marginBottom: 5 }}>
                    Additional Notes:
                  </Text>
                  <Text>{invoice.notes}</Text>
                </View>
              )}
            </View>
            <View style={{ flex: 1, alignItems: "flex-end" }}>
              <View
                style={{ textAlign: "center", marginTop: -46, marginRight: 10 }}
              >
                {invoice.client.invoice_owner?.signature ? (
                  <Image
                    src={`${baseUrl}/${invoice.client.invoice_owner.signature}`}
                    style={{
                      width: 200,
                      objectFit: "contain",
                      marginRight: "-60",
                      marginBottom: -70,
                    }}
                  />
                ) : (
                  <View
                    style={{
                      width: 200,
                      height: 94,
                      backgroundColor: "transparent",
                    }}
                  />
                )}
                <Text
                  style={{
                    borderTop: 0.8,
                    marginTop: 5,
                    paddingTop: 5,
                    marginLeft: "auto",
                  }}
                >
                  <Text style={styles.clientDetails}>
                    Chief Executive Officer
                  </Text>
                </Text>
              </View>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default TransactionPDF;