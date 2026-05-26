import { useEffect, useState, useCallback } from 'react'
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, RefreshControl, ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { getAllQueueItems, PendingCheckin } from '../src/lib/offlineQueue'
import { addSyncListener, removeSyncListener } from '../src/lib/syncEngine'
import { Colors, Spacing, FontSize, FontWeight, Radius } from '../src/constants/theme'

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  pending:  { label: 'Pending',   color: Colors.amber,  bg: Colors.amberDim  },
  syncing:  { label: 'Syncing…',  color: Colors.blue,   bg: Colors.blueDim   },
  synced:   { label: 'Synced',    color: Colors.green,  bg: Colors.greenDim  },
  failed:   { label: 'Failed',    color: Colors.red,    bg: Colors.redDim    },
}

export default function QueueScreen() {
  const [items, setItems]       = useState<PendingCheckin[]>([])
  const [loading, setLoading]   = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    const data = await getAllQueueItems()
    setItems(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
    addSyncListener(() => load())
    return () => removeSyncListener(() => load())
  }, [load])

  const onRefresh = async () => {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }

  const pending = items.filter(i => i.status === 'pending' || i.status === 'failed').length
  const synced  = items.filter(i => i.status === 'synced').length

  return (
    <SafeAreaView style={s.safe}>
      {/* Summary bar */}
      <View style={s.summary}>
        <View style={s.pill}>
          <Text style={[s.pillNum, { color: Colors.amber }]}>{pending}</Text>
          <Text style={s.pillLabel}>Pending</Text>
        </View>
        <View style={s.pill}>
          <Text style={[s.pillNum, { color: Colors.green }]}>{synced}</Text>
          <Text style={s.pillLabel}>Synced</Text>
        </View>
        <View style={s.pill}>
          <Text style={[s.pillNum, { color: Colors.textSecondary }]}>{items.length}</Text>
          <Text style={s.pillLabel}>Total</Text>
        </View>
      </View>

      {loading
        ? <ActivityIndicator color={Colors.accent} style={{ flex: 1 }} />
        : (
          <ScrollView
            style={s.scroll}
            contentContainerStyle={s.content}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} />}
          >
            {items.length === 0 && (
              <View style={s.empty}>
                <Text style={s.emptyIcon}>✓</Text>
                <Text style={s.emptyTitle}>Queue Empty</Text>
                <Text style={s.emptyText}>All check-ins have been synced.</Text>
              </View>
            )}

            {items.map(item => {
              const meta = STATUS_META[item.status] ?? STATUS_META.pending
              const guestNames = item.guests.map(g => g.name).join(', ')
              return (
                <View key={item.uuid} style={s.card}>
                  <View style={s.cardHeader}>
                    <Text style={s.refCode} numberOfLines={1}>{item.uuid.slice(0, 8).toUpperCase()}</Text>
                    <View style={[s.badge, { backgroundColor: meta.bg, borderColor: meta.color + '40' }]}>
                      <Text style={[s.badgeText, { color: meta.color }]}>{meta.label}</Text>
                    </View>
                  </View>

                  <Text style={s.guests} numberOfLines={1}>👥 {guestNames}</Text>

                  <View style={s.metaRow}>
                    <Text style={s.metaChip}>🏨 {item.room_ids.length} room{item.room_ids.length !== 1 ? 's' : ''}</Text>
                    <Text style={s.metaChip}>📅 Out: {item.check_out_date}</Text>
                    {item.retry_count > 0 && (
                      <Text style={[s.metaChip, { color: Colors.red }]}>↻ {item.retry_count} retr{item.retry_count !== 1 ? 'ies' : 'y'}</Text>
                    )}
                  </View>

                  <Text style={s.timestamp}>Queued {new Date(item.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</Text>
                </View>
              )
            })}

            <Text style={s.hint}>
              {'Pull down to refresh · Syncs automatically every 30 seconds when server is reachable'}
            </Text>
          </ScrollView>
        )
      }
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.bgBase },
  summary: {
    flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: Colors.border,
    backgroundColor: Colors.bgSurface,
  },
  pill:      { flex: 1, alignItems: 'center', paddingVertical: Spacing.md },
  pillNum:   { fontSize: FontSize.xl, fontWeight: FontWeight.heavy },
  pillLabel: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },

  scroll:  { flex: 1 },
  content: { padding: Spacing.md, gap: Spacing.sm },

  empty:      { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xxl, gap: Spacing.md },
  emptyIcon:  { fontSize: 48, color: Colors.green },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  emptyText:  { fontSize: FontSize.sm, color: Colors.textMuted, textAlign: 'center' },

  card: {
    backgroundColor: Colors.bgGlass, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border, padding: Spacing.md, gap: 8,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  refCode:    { fontSize: FontSize.sm, fontWeight: FontWeight.heavy, color: Colors.textPrimary, fontVariant: ['tabular-nums'] },
  badge:      { paddingHorizontal: 10, paddingVertical: 3, borderRadius: Radius.full, borderWidth: 1 },
  badgeText:  { fontSize: FontSize.xs, fontWeight: FontWeight.bold },

  guests:   { fontSize: FontSize.sm, color: Colors.textSecondary },
  metaRow:  { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  metaChip: { fontSize: FontSize.xs, color: Colors.textMuted },
  timestamp:{ fontSize: FontSize.xs, color: Colors.textMuted },

  hint: {
    textAlign: 'center', fontSize: FontSize.xs, color: Colors.textMuted,
    lineHeight: 18, paddingVertical: Spacing.md,
  },
})
