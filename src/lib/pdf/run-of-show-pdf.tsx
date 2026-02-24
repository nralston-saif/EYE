import React from 'react'
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer'
import { Event, Client, SubEvent, RunOfShowItem } from '@/types/database'

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
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    backgroundColor: '#f0f0f0',
    padding: 6,
  },
  sectionSubtitle: {
    fontSize: 9,
    color: '#666',
    marginBottom: 6,
    paddingLeft: 6,
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
    minHeight: 24,
  },
  tableRowAlt: {
    backgroundColor: '#f9f9f9',
  },
  colTime: {
    width: '15%',
    fontWeight: 'bold',
  },
  colActivity: {
    width: '25%',
  },
  colLocation: {
    width: '20%',
  },
  colOwner: {
    width: '20%',
  },
  colNotes: {
    width: '20%',
    fontSize: 8,
    color: '#666',
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

interface RunOfShowPDFProps {
  event: Event & { client?: Client | null }
  items: RunOfShowItem[]
  subEvents: SubEvent[]
}

const formatDate = (date: string | null): string => {
  if (!date) return ''
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function RunOfShowPDF({ event, items, subEvents }: RunOfShowPDFProps) {
  const subEventMap = new Map(subEvents.map((se) => [se.id, se]))
  const hasSubEvents = subEvents.length > 0

  const groupedItems = hasSubEvents
    ? items.reduce(
        (acc, item) => {
          const key = item.sub_event_id || '__ungrouped'
          if (!acc[key]) acc[key] = []
          acc[key].push(item)
          return acc
        },
        {} as Record<string, RunOfShowItem[]>
      )
    : { __all: items }

  const renderRows = (rowItems: RunOfShowItem[]) =>
    rowItems.map((item, index) => (
      <View
        key={item.id}
        style={
          index % 2 === 1
            ? [styles.tableRow, styles.tableRowAlt]
            : styles.tableRow
        }
      >
        <Text style={styles.colTime}>{item.time}</Text>
        <Text style={styles.colActivity}>{item.activity}</Text>
        <Text style={styles.colLocation}>{item.location || ''}</Text>
        <Text style={styles.colOwner}>{item.person_responsible || ''}</Text>
        <Text style={styles.colNotes}>{item.notes || ''}</Text>
      </View>
    ))

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Run of Show</Text>
          <Text style={styles.subtitle}>{event.name}</Text>
          {event.client && (
            <Text style={styles.subtitle}>Client: {event.client.name}</Text>
          )}
          {event.event_start_date && (
            <Text style={styles.subtitle}>
              Event Date: {formatDate(event.event_start_date)}
              {event.event_end_date && event.event_start_date !== event.event_end_date && (
                ` - ${formatDate(event.event_end_date)}`
              )}
            </Text>
          )}
          <Text style={styles.subtitle}>
            Generated: {formatDate(new Date().toISOString())}
          </Text>
        </View>

        {/* Content */}
        {Object.entries(groupedItems).map(([key, groupItems]) => {
          const subEvent = key !== '__ungrouped' && key !== '__all' ? subEventMap.get(key) : null
          return (
            <View key={key} style={styles.section} wrap={false}>
              {subEvent && (
                <>
                  <Text style={styles.sectionTitle}>{subEvent.name}</Text>
                  {subEvent.date && (
                    <Text style={styles.sectionSubtitle}>
                      {formatDate(subEvent.date)}
                      {subEvent.location && ` | ${subEvent.location}`}
                    </Text>
                  )}
                </>
              )}
              <View style={styles.table}>
                <View style={styles.tableHeader}>
                  <Text style={styles.colTime}>Time</Text>
                  <Text style={styles.colActivity}>Activity</Text>
                  <Text style={styles.colLocation}>Location</Text>
                  <Text style={styles.colOwner}>Owner</Text>
                  <Text style={styles.colNotes}>Notes</Text>
                </View>
                {renderRows(groupItems)}
              </View>
            </View>
          )
        })}

        {/* Footer */}
        <Text style={styles.footer}>
          EYE Events - Run of Show - Confidential
        </Text>
      </Page>
    </Document>
  )
}
