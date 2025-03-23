import React from "react";
import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";

// Define custom styles
const styles = StyleSheet.create({
  page: {
    padding: 20, // Adjusted padding for better margins
    fontFamily: "Helvetica",
    fontSize: 12,
    display: "flex", 
  },
  header: {
    textAlign: "center",
    marginBottom: 20, // Adjusted margin
  },
  logo: {
    width: 150, // Adjusted logo size
    alignSelf: "center",
  },
  title: {
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
  },
  clientDetails: {
    fontSize: 10,
    marginBottom: 5,
  },
  invoiceDetails: {
    fontSize: 10,
    marginBottom: 5,
  },
  tableHeader: {
    backgroundColor: "#f8f9fa",
    fontWeight: "bold",
    textAlign: "center",
    fontSize: 10,
  },
  tableRow: {
    textAlign: "center",
    fontSize: 10,
    borderWidth: 1,
    borderColor: "#000",
    padding: 5,
  },
  tableCell: {
    padding: 5,
  },
  borderedTable: {
    borderWidth: 1,
    borderColor: "#000",
    marginBottom: 10,
  },
  borderedRow: {
    borderBottomWidth: 1,
    borderBottomColor: "#000",
  },
  borderedCell: {
    borderRightWidth: 1,
    borderRightColor: "#000",
    padding: 5,
  },
  footer: {
    marginTop: 20,
    fontSize: 10,
    color: "#6c757d",
  },
  signature: {
    width: 150, // Adjusted signature size
    height: 70, // Adjusted signature size
    marginBottom: -30, // Adjusted margin
    objectFit: "contain",
  },
  signaturePlaceholder: {
    width: 150, // Adjusted placeholder size
    height: 70, // Adjusted placeholder size
    backgroundColor: "transparent",
  },
  signatureText: {
    borderTopWidth: 1,
    borderTopColor: "#000",
    paddingTop: 5,
    display: "inline-block",
    width: "auto",
    fontSize: 10,
    marginTop: -5,
  },
  placeholder: {
    height: 20,
  },
});

const TransactionPDF = ({ invoice, items }) => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header Section */}
        <View style={styles.header}>
          <Image
            src={`${baseUrl}/${invoice.client.invoice_owner?.logo}`}
            style={styles.logo}
          />
          <Text style={styles.title}>
            {invoice.client.invoice_owner?.name || "N/A"}
          </Text>
          <Text style={styles.clientDetails}>
            {invoice.client.invoice_owner?.address || "N/A"}
          </Text>
          <Text style={styles.clientDetails}>
            {invoice.client.invoice_owner?.phone || "N/A"}
            {invoice.client.invoice_owner?.phone_2 && `, ${invoice.client.invoice_owner.phone_2}`}
          </Text>
          <Text style={styles.clientDetails}>
            {invoice.client.invoice_owner?.email || "N/A"}
          </Text>
          <Text style={styles.clientDetails}>
            <Text style={{ fontWeight: "bold" }}>NTN No:</Text> {invoice.client.invoice_owner?.ntn_number || "N/A"}
          </Text>
        </View>

        {/* Invoice Title */}
        <Text style={styles.title}>
          {invoice.is_quotation ? "Quotation" : "Invoice"}
        </Text>

        {/* Client and Invoice Details */}
        <View style={{ flexDirection: "row", marginBottom: 20 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: "bold", marginBottom: 5 }}>Client:</Text>
            <Text>{invoice.client?.name || "N/A"}</Text>
            {invoice.client?.address && (
              <Text style={styles.clientDetails}>{invoice.client.address}</Text>
            )}
            {invoice.client?.phone && (
              <Text style={styles.clientDetails}>
                <Text style={{ fontWeight: "bold" }}>Phone: </Text>
                {invoice.client.phone}
              </Text>
            )}
            {invoice.client?.ntn_number && (
              <Text style={styles.clientDetails}>
                <Text style={{ fontWeight: "bold" }}>NTN No: </Text>
                {invoice.client.ntn_number}
              </Text>
            )}
          </View>
          <View style={{ flex: 1, alignItems: "flex-end" }}>
            <Text style={{ fontWeight: "bold", marginBottom: 5 }}>
              {invoice.is_quotation ? "Quotation" : "Invoice"} Details:
            </Text>
            <Text style={styles.invoiceDetails}>
              <Text style={{ fontWeight: "bold" }}>Ref #:</Text> {invoice.reference_number || "N/A"}
            </Text>
            <Text style={styles.invoiceDetails}>
              <Text style={{ fontWeight: "bold" }}>Date:</Text>{" "}
              {invoice.date || new Date(invoice.created_at).toISOString().split("T")[0]}
            </Text>
          </View>
        </View>

        {/* Invoice Items Table */}
        <View style={[styles.borderedTable]}>
          <View style={[styles.tableHeader, { flexDirection: "row" }]}>
            <Text style={[styles.borderedCell, { width: "8%" }]}>#</Text>
            <Text style={[styles.borderedCell, { width: "42%" }]}>Name</Text>
            <Text style={[styles.borderedCell, { width: "15%" }]}>Quantity</Text>
            <Text style={[styles.borderedCell, { width: "15%" }]}>Unit</Text>
            <Text style={[styles.borderedCell, { width: "15%" }]}>Unit Price</Text>
            <Text style={[styles.borderedCell, { width: "15%" }]}>Total Price</Text>
          </View>
          {items.map((item, index) => (
            <View key={index} style={[styles.borderedRow, { flexDirection: "row" }]}>
              <Text style={[styles.borderedCell, { width: "8%" }]}>{index + 1}</Text>
              <Text style={[styles.borderedCell, { width: "42%" }]}>
                {item.name || "N/A"}
                {item.description && (
                  <Text style={{ fontSize: 8, color: "#6c757d" }}><br/>{item.description}</Text>
                )}
              </Text>
              <Text style={[styles.borderedCell, { width: "15%" }]}>{item.quantity || "N/A"}</Text>
              <Text style={[styles.borderedCell, { width: "15%" }]}>{item.unit || "N/A"}</Text>
              <Text style={[styles.borderedCell, { width: "15%" }]}>{item.unit_price || "N/A"}</Text>
              <Text style={[styles.borderedCell, { width: "15%" }]}>{item.total_price || "N/A"}</Text>
            </View>
          ))}
        </View>

        {/* Invoice Summary */}
        <View style={[styles.borderedTable, { marginTop: 10 }]}>
          {invoice.transit_charges && (
            <View style={[{ flexDirection: "row", justifyContent: "space-between" }]}>
              <Text style={[styles.borderedCell, { width: "50%" }]}>Transit Charges</Text>
              <Text style={[styles.borderedCell, { width: "50%" }]}>{invoice.transit_charges}</Text>
            </View>
          )}
          <View style={[{ flexDirection: "row", justifyContent: "space-between" }]}>
            <Text style={[styles.borderedCell, { width: "50%" }]}>
              Total
              {(invoice.tax_percentage || invoice.is_taxed) && (
                <Text style={{ fontSize: 8, color: "#6c757d" }}> incl. tax</Text>
              )}
            </Text>
            <Text style={[styles.borderedCell, { width: "50%" }]}>{invoice.grand_total || invoice.total_price}</Text>
          </View>
        </View>

        {/* Footer Section */}
        <View style={styles.footer}>
          <View style={{ flexDirection: "row" }}>
            <View style={{ flex: 1 }}>
              {!invoice.is_quotation && invoice.client.invoice_owner?.bank && (
                <View style={{ marginBottom: 10 }}>
                  <Text style={{ fontWeight: "bold" }}>Payment Details:</Text>
                  <Text>Bank: {invoice.client.invoice_owner.bank}</Text>
                  <Text>Title: {invoice.client.invoice_owner.account_title}</Text>
                  <Text>IBAN: {invoice.client.invoice_owner.iban}</Text>
                </View>
              )}
              {invoice.notes && (
                <View style={{ marginTop: 10 }}>
                  <Text style={{ fontWeight: "bold" }}>Additional Notes:</Text>
                  <Text>{invoice.notes}</Text>
                </View>
              )}
            </View>
            <View style={{ flex: 1, alignItems: "flex-end" }}>
              <View style={{ textAlign: "center" }}>
                {invoice.client.invoice_owner?.signature ? (
                  <Image
                    src={`${baseUrl}/${invoice.client.invoice_owner.signature }`}
                    style={styles.signature}
                  />
                ) : (
                  <View style={styles.signaturePlaceholder} />
                )}
                <Text style={styles.signatureText}>
                  <small>Chief Executive Officer</small>
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Placeholder for spacing */}
        <View style={styles.placeholder} />
      </Page>
    </Document>
  );
};

export default TransactionPDF;