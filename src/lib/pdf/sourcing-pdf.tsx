import React from 'react'
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer'
import { SourcedVendor, Event, Client } from '@/types/database'

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#333',
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    backgroundColor: '#f0f0f0',
    padding: 6,
  },
  table: {
    width: '100%',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#333',
    color: '#fff',
    padding: 6,
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    padding: 6,
    minHeight: 30,
  },
  tableRowAlt: {
    backgroundColor: '#f9f9f9',
  },
  colVendor: {
    width: '25%',
  },
  colCategory: {
    width: '15%',
  },
  colStatus: {
    width: '15%',
  },
  colContact: {
    width: '25%',
  },
  colPrice: {
    width: '20%',
    textAlign: 'right' as const,
  },
  vendorName: {
    fontWeight: 'bold',
    marginBottom: 2,
  },
  vendorAddress: {
    fontSize: 8,
    color: '#666',
  },
  badge: {
    fontSize: 8,
    padding: '2 4',
    borderRadius: 2,
    color: '#fff',
    alignSelf: 'flex-start',
  },
  statusIdentified: { backgroundColor: '#6b7280' },
  statusContacted: { backgroundColor: '#3b82f6' },
  statusRfpSent: { backgroundColor: '#8b5cf6' },
  statusProposalReceived: { backgroundColor: '#eab308' },
  statusNegotiating: { backgroundColor: '#f97316' },
  statusSelected: { backgroundColor: '#22c55e' },
  statusContracted: { backgroundColor: '#15803d' },
  statusDeclined: { backgroundColor: '#ef4444' },
  contactInfo: {
    fontSize: 8,
  },
  priceQuoted: {
    fontSize: 8,
    color: '#666',
  },
  priceFinal: {
    fontWeight: 'bold',
  },
  notes: {
    marginTop: 4,
    fontSize: 8,
    color: '#666',
    fontStyle: 'italic',
  },
  summary: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  summaryLabel: {
    fontWeight: 'bold',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    fontSize: 8,
    color: '#999',
    textAlign: 'center' as const,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    paddingTop: 10,
  },
})

const STATUS_LABELS: Record<string, string> = {
  identified: 'Identified',
  contacted: 'Contacted',
  rfp_sent: 'RFP Sent',
  proposal_received: 'Proposal Received',
  negotiating: 'Negotiating',
  selected: 'Selected',
  contracted: 'Contracted',
  declined: 'Declined',
}

const getStatusStyle = (status: string) => {
  switch (status) {
    case 'identified':
      return styles.statusIdentified
    case 'contacted':
      return styles.statusContacted
    case 'rfp_sent':
      return styles.statusRfpSent
    case 'proposal_received':
      return styles.statusProposalReceived
    case 'negotiating':
      return styles.statusNegotiating
    case 'selected':
      return styles.statusSelected
    case 'contracted':
      return styles.statusContracted
    case 'declined':
      return styles.statusDeclined
    default:
      return styles.statusIdentified
  }
}

interface SourcingPDFProps {
  event: Event & { client?: Client | null }
  vendors: SourcedVendor[]
}

const formatCurrency = (amount: number | null): string => {
  if (!amount) return '-'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(amount)
}

const formatDate = (date: string | null): string => {
  if (!date) return ''
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function SourcingPDF({ event, vendors }: SourcingPDFProps) {
  // Group vendors by category
  const vendorsByCategory = vendors.reduce(
    (acc, vendor) => {
      const cat = vendor.category || 'Other'
      if (!acc[cat]) acc[cat] = []
      acc[cat].push(vendor)
      return acc
    },
    {} as Record<string, SourcedVendor[]>
  )

  // Calculate totals
  const totalQuoted = vendors.reduce(
    (sum, v) => sum + (v.quoted_price || 0),
    0
  )
  const totalFinal = vendors.reduce(
    (sum, v) => sum + (v.final_price || 0),
    0
  )
  const selectedCount = vendors.filter(
    (v) => v.status === 'selected' || v.status === 'contracted'
  ).length

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Vendor Sourcing Report</Text>
          <Text style={styles.subtitle}>{event.name}</Text>
          {event.client && (
            <Text style={styles.subtitle}>Client: {event.client.name}</Text>
          )}
          <Text style={styles.subtitle}>
            Generated: {formatDate(new Date().toISOString())}
          </Text>
        </View>

        {/* Summary */}
        <View style={styles.summary}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Vendors:</Text>
            <Text>{vendors.length}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Selected/Contracted:</Text>
            <Text>{selectedCount}</Text>
          </View>
          {totalQuoted > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Quoted:</Text>
              <Text>{formatCurrency(totalQuoted)}</Text>
            </View>
          )}
          {totalFinal > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Final:</Text>
              <Text>{formatCurrency(totalFinal)}</Text>
            </View>
          )}
        </View>

        {/* Vendors by Category */}
        {Object.entries(vendorsByCategory).map(([category, catVendors]) => (
          <View key={category} style={styles.section} wrap={false}>
            <Text style={styles.sectionTitle}>
              {category} ({catVendors.length})
            </Text>
            <View style={styles.table}>
              {/* Table Header */}
              <View style={styles.tableHeader}>
                <Text style={styles.colVendor}>Vendor</Text>
                <Text style={styles.colStatus}>Status</Text>
                <Text style={styles.colContact}>Contact</Text>
                <Text style={styles.colPrice}>Pricing</Text>
              </View>

              {/* Table Rows */}
              {catVendors.map((vendor, index) => (
                <View
                  key={vendor.id}
                  style={
                    index % 2 === 1
                      ? [styles.tableRow, styles.tableRowAlt]
                      : styles.tableRow
                  }
                >
                  <View style={styles.colVendor}>
                    <Text style={styles.vendorName}>{vendor.name}</Text>
                    {vendor.address && (
                      <Text style={styles.vendorAddress}>{vendor.address}</Text>
                    )}
                  </View>
                  <View style={styles.colStatus}>
                    <Text style={[styles.badge, getStatusStyle(vendor.status)]}>
                      {STATUS_LABELS[vendor.status] || vendor.status}
                    </Text>
                  </View>
                  <View style={styles.colContact}>
                    {vendor.phone && (
                      <Text style={styles.contactInfo}>{vendor.phone}</Text>
                    )}
                    {vendor.website && (
                      <Text style={styles.contactInfo}>{vendor.website}</Text>
                    )}
                  </View>
                  <View style={styles.colPrice}>
                    {vendor.quoted_price && (
                      <Text style={styles.priceQuoted}>
                        Quoted: {formatCurrency(vendor.quoted_price)}
                      </Text>
                    )}
                    {vendor.final_price && (
                      <Text style={styles.priceFinal}>
                        Final: {formatCurrency(vendor.final_price)}
                      </Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </View>
        ))}

        {/* Footer */}
        <Text style={styles.footer}>
          EYE Events - Confidential Vendor Sourcing Report
        </Text>
      </Page>
    </Document>
  )
}
