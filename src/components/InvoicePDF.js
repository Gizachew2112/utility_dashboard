// src/components/InvoicePDF.js - PDF invoice generator

import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

// Register font
Font.register({
  family: 'Roboto',
  src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-light-webfont.ttf',
});

const styles = StyleSheet.create({
  page: {
    padding: 30,
    backgroundColor: '#ffffff',
    fontFamily: 'Roboto',
  },
  header: {
    marginBottom: 20,
    borderBottom: 1,
    borderBottomColor: '#1a237e',
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a237e',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  invoiceInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  infoBox: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 10,
    color: '#666',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  customerBox: {
    marginBottom: 20,
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 5,
  },
  customerTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1a237e',
    marginBottom: 8,
  },
  customerText: {
    fontSize: 10,
    color: '#333',
    marginBottom: 4,
  },
  table: {
    marginTop: 10,
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#1a237e',
    padding: 8,
  },
  tableHeaderText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    padding: 8,
  },
  tableCol1: { width: '40%' },
  tableCol2: { width: '15%', textAlign: 'right' },
  tableCol3: { width: '15%', textAlign: 'right' },
  tableCol4: { width: '15%', textAlign: 'right' },
  tableCol5: { width: '15%', textAlign: 'right' },
  tableText: {
    fontSize: 10,
    color: '#333',
  },
  totalBox: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#f5f5f5',
    alignItems: 'flex-end',
    borderRadius: 5,
  },
  totalText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1a237e',
  },
  footer: {
    marginTop: 30,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 8,
    color: '#999',
  },
});

const InvoicePDF = ({ invoice, meter, customer }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>UTILITY POWER MONITORING</Text>
        <Text style={styles.headerSubtitle}>Electricity Invoice</Text>
      </View>

      {/* Invoice Info */}
      <View style={styles.invoiceInfo}>
        <View style={styles.infoBox}>
          <Text style={styles.infoLabel}>Invoice Number</Text>
          <Text style={styles.infoValue}>{invoice.invoiceNumber}</Text>
        </View>
        <View style={styles.infoBox}>
          <Text style={styles.infoLabel}>Invoice Date</Text>
          <Text style={styles.infoValue}>{invoice.invoiceDate}</Text>
        </View>
        <View style={styles.infoBox}>
          <Text style={styles.infoLabel}>Due Date</Text>
          <Text style={styles.infoValue}>{invoice.dueDate}</Text>
        </View>
      </View>

      {/* Customer Information */}
      <View style={styles.customerBox}>
        <Text style={styles.customerTitle}>Bill To:</Text>
        <Text style={styles.customerText}>{customer.name}</Text>
        <Text style={styles.customerText}>{customer.address}</Text>
        <Text style={styles.customerText}>Meter ID: {meter.meterId}</Text>
        <Text style={styles.customerText}>Zone: {meter.zone || 'N/A'}</Text>
      </View>

      {/* Consumption Table */}
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <View style={styles.tableCol1}><Text style={styles.tableHeaderText}>Billing Period</Text></View>
          <View style={styles.tableCol2}><Text style={styles.tableHeaderText}>Consumption (kWh)</Text></View>
          <View style={styles.tableCol3}><Text style={styles.tableHeaderText}>Rate ($/kWh)</Text></View>
          <View style={styles.tableCol4}><Text style={styles.tableHeaderText}>Amount ($)</Text></View>
          <View style={styles.tableCol5}><Text style={styles.tableHeaderText}>Status</Text></View>
        </View>
        
        <View style={styles.tableRow}>
          <View style={styles.tableCol1}><Text style={styles.tableText}>{invoice.period}</Text></View>
          <View style={styles.tableCol2}><Text style={styles.tableText}>{invoice.consumption}</Text></View>
          <View style={styles.tableCol3}><Text style={styles.tableText}>{invoice.rate}</Text></View>
          <View style={styles.tableCol4}><Text style={styles.tableText}>{invoice.amount}</Text></View>
          <View style={styles.tableCol5}><Text style={styles.tableText}>{invoice.status}</Text></View>
        </View>
      </View>

      {/* Total */}
      <View style={styles.totalBox}>
        <Text style={styles.totalText}>Total Amount: ${invoice.amount}</Text>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Thank you for your business!</Text>
        <Text style={styles.footerText}>For questions, contact support@utility.com | +251-XXX-XXXX</Text>
      </View>
    </Page>
  </Document>
);

export default InvoicePDF;