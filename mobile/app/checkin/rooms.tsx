import { useEffect, useState } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, ActivityIndicator, Alert,
} from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { apiGet } from '../../src/lib/api'
import { useCheckIn } from './_context'
import { Colors, Spacing, FontSize, FontWeight, Radius } from '../../src/constants/theme'

interface Room {
  id: number
  room_number: string
  room_type: string
  floor: number
  status: string
  price_per_night: number
}

function formatDate(d: Date) {
  return d.toISOString().slice(0, 10)
}

function addDays(d: Date, n: number) {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

export default function RoomsScreen() {
  const router = useRouter()
  const { state, setRoomIds, setCheckOutDate, setNotes } = useCheckIn()

  const [rooms, setRooms]         = useState<Room[]>([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')

  // Default check-out = tomorrow
  const tomorrow = formatDate(addDays(new Date(), 1))
  const [nights, setNights]       = useState(1)

  useEffect(() => {
    if (!state.checkOutDate) setCheckOutDate(tomorrow)
  }, [])

  useEffect(() => {
    apiGet<{ rooms: Room[] }>('/api/rooms')
      .then(d => setRooms(d.rooms.filter(r => r.status === 'available')))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const toggleRoom = (id: number) => {
    setRoomIds(
      state.roomIds.includes(id)
        ? state.roomIds.filter(x => x !== id)
        : [...state.roomIds, id]
    )
  }

  const adjustNights = (delta: number) => {
    const n = Math.max(1, nights + delta)
    setNights(n)
    setCheckOutDate(formatDate(addDays(new Date(), n)))
  }

  const canProceed = state.roomIds.length > 0 && !!state.checkOutDate

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.content}>
        {/* Progress */}
        <View style={s.progress}>
          {[1, 2, 3, 4].map(i => (
            <View key={i} style={[s.progressStep, i <= 4 && s.progressActive]} />
          ))}
        </View>

        <Text style={s.stepLabel}>STEP 4 OF 4</Text>
        <Text style={s.title}>Room & Stay</Text>
        <Text style={s.subtitle}>Select room(s) and set check-out date.</Text>

        {/* Stay duration picker */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Stay Duration</Text>
          <View style={s.nightsRow}>
            <TouchableOpacity style={s.nightBtn} onPress={() => adjustNights(-1)}>
              <Text style={s.nightBtnText}>−</Text>
            </TouchableOpacity>
            <View style={s.nightsDisplay}>
              <Text style={s.nightsNum}>{nights}</Text>
              <Text style={s.nightsLabel}>night{nights !== 1 ? 's' : ''}</Text>
            </View>
            <TouchableOpacity style={s.nightBtn} onPress={() => adjustNights(1)}>
              <Text style={s.nightBtnText}>+</Text>
            </TouchableOpacity>
          </View>
          <Text style={s.checkoutDate}>
            Check-out: <Text style={{ color: Colors.accent }}>{state.checkOutDate || tomorrow}</Text>
          </Text>
        </View>

        {/* Notes */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Notes (optional)</Text>
          <TextInput
            style={s.notesInput}
            value={state.notes}
            onChangeText={setNotes}
            placeholder="Special requests, early check-in, etc."
            placeholderTextColor={Colors.textMuted}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Available rooms */}
        <Text style={s.sectionTitle}>Available Rooms</Text>
        {loading && <ActivityIndicator color={Colors.accent} style={{ marginVertical: 20 }} />}
        {error ? (
          <View style={s.errorCard}>
            <Text style={s.errorText}>{error}</Text>
          </View>
        ) : null}

        {rooms.map(room => {
          const selected = state.roomIds.includes(room.id)
          return (
            <TouchableOpacity
              key={room.id}
              style={[s.roomCard, selected && s.roomCardSelected]}
              onPress={() => toggleRoom(room.id)}
            >
              <View style={s.roomLeft}>
                <Text style={[s.roomNum, selected && s.roomNumSelected]}>{room.room_number}</Text>
                <Text style={s.roomMeta}>{room.room_type} · Floor {room.floor}</Text>
              </View>
              <View style={s.roomRight}>
                <Text style={s.roomPrice}>₹{Number(room.price_per_night).toLocaleString('en-IN')}<Text style={s.roomPriceLabel}>/night</Text></Text>
                <View style={[s.checkBox, selected && s.checkBoxSelected]}>
                  {selected && <Text style={s.checkMark}>✓</Text>}
                </View>
              </View>
            </TouchableOpacity>
          )
        })}

        {!loading && rooms.length === 0 && !error && (
          <Text style={s.emptyText}>No available rooms. Mark rooms as available on the desktop app.</Text>
        )}

        <TouchableOpacity
          style={[s.nextBtn, !canProceed && s.nextBtnDisabled]}
          onPress={() => canProceed && router.push('/checkin/confirm')}
          activeOpacity={canProceed ? 0.75 : 1}
        >
          <Text style={s.nextBtnText}>
            {canProceed
              ? `Review & Confirm — ${state.roomIds.length} room${state.roomIds.length !== 1 ? 's' : ''} selected`
              : 'Select at least one room'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.bgBase },
  content: { padding: Spacing.lg, gap: Spacing.md },

  progress: { flexDirection: 'row', gap: 6, marginBottom: Spacing.sm },
  progressStep:  { flex: 1, height: 4, borderRadius: 2, backgroundColor: Colors.bgGlass, borderWidth: 1, borderColor: Colors.border },
  progressActive:{ backgroundColor: Colors.accent, borderColor: Colors.accent },

  stepLabel: { fontSize: FontSize.xs, color: Colors.accent, fontWeight: FontWeight.bold, letterSpacing: 1.5 },
  title:     { fontSize: FontSize.xl, fontWeight: FontWeight.heavy, color: Colors.textPrimary },
  subtitle:  { fontSize: FontSize.base, color: Colors.textMuted, lineHeight: 22 },

  card: {
    backgroundColor: Colors.bgGlass, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border, padding: Spacing.md, gap: Spacing.sm,
  },
  cardTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textSecondary },

  nightsRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xl },
  nightBtn:     { width: 44, height: 44, borderRadius: Radius.full, backgroundColor: Colors.accentDim, borderWidth: 1, borderColor: 'rgba(108,99,255,0.3)', alignItems: 'center', justifyContent: 'center' },
  nightBtnText: { fontSize: 24, color: Colors.accent, fontWeight: FontWeight.bold },
  nightsDisplay:{ alignItems: 'center' },
  nightsNum:    { fontSize: FontSize.xxl, fontWeight: FontWeight.heavy, color: Colors.textPrimary },
  nightsLabel:  { fontSize: FontSize.xs, color: Colors.textMuted },
  checkoutDate: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center' },

  notesInput: {
    backgroundColor: Colors.bgBase, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.sm, padding: Spacing.sm,
    color: Colors.textPrimary, fontSize: FontSize.base,
    textAlignVertical: 'top', minHeight: 70,
  },

  sectionTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textSecondary, letterSpacing: 0.5 },

  errorCard: {
    backgroundColor: Colors.redDim, borderRadius: Radius.md,
    borderWidth: 1, borderColor: 'rgba(255,94,125,0.25)', padding: Spacing.md,
  },
  errorText: { color: Colors.red, fontSize: FontSize.sm },

  roomCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.bgGlass, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border, padding: Spacing.md,
  },
  roomCardSelected: { borderColor: Colors.accent, backgroundColor: Colors.accentDim },
  roomLeft:    { gap: 4 },
  roomNum:     { fontSize: FontSize.lg, fontWeight: FontWeight.heavy, color: Colors.textPrimary },
  roomNumSelected: { color: Colors.accent },
  roomMeta:    { fontSize: FontSize.xs, color: Colors.textMuted },
  roomRight:   { alignItems: 'flex-end', gap: 8 },
  roomPrice:   { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  roomPriceLabel: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: FontWeight.regular },
  checkBox:    { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  checkBoxSelected: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  checkMark:   { color: '#fff', fontSize: 13, fontWeight: FontWeight.bold },

  emptyText: { textAlign: 'center', color: Colors.textMuted, fontSize: FontSize.sm, paddingVertical: Spacing.xl, lineHeight: 22 },

  nextBtn:         { backgroundColor: Colors.accent, borderRadius: Radius.md, padding: Spacing.md, alignItems: 'center', marginTop: Spacing.sm },
  nextBtnDisabled: { opacity: 0.4 },
  nextBtnText:     { color: '#fff', fontWeight: FontWeight.bold, fontSize: FontSize.base },
})
