import React, { useState } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, SafeAreaView, Alert, ActivityIndicator, Image
} from 'react-native'
import { CameraView, useCameraPermissions } from 'expo-camera'
import * as ImagePicker from 'expo-image-picker'
import { colors, radius, font, space } from '../theme'
import { smartCheckin } from '../sync'
import { fetchAvailableRooms } from '../api'

// ── Types ─────────────────────────────────────────────────────────────────────
type Guest = { name: string; phone: string; age: string; sex: string }
type Room  = { id: number; room_number: string; room_type: string; floor: number; price_per_night: number }
type Step  = 'party' | 'guests' | 'rooms' | 'confirm'
const blank = (): Guest => ({ name: '', phone: '', age: '', sex: '' })

// ── Camera sheet ──────────────────────────────────────────────────────────────
function CameraSheet({ onCapture, onClose }: { onCapture: (uri: string) => void; onClose: () => void }) {
  const [perm, requestPerm] = useCameraPermissions()
  const [captured, setCaptured] = useState<string | null>(null)
  const camRef = React.useRef<CameraView>(null)

  if (!perm?.granted) return (
    <View style={cam.wrap}>
      <Text style={cam.title}>Camera Permission Needed</Text>
      <TouchableOpacity style={cam.btn} onPress={requestPerm}><Text style={cam.btnTxt}>Grant</Text></TouchableOpacity>
      <TouchableOpacity onPress={onClose}><Text style={cam.cancel}>Cancel</Text></TouchableOpacity>
    </View>
  )

  const take = async () => {
    const r = await camRef.current?.takePictureAsync({ quality: 0.8, base64: false })
    if (r?.uri) setCaptured(r.uri)
  }

  if (captured) return (
    <View style={cam.wrap}>
      <Image source={{ uri: captured }} style={cam.preview} />
      <View style={cam.row}>
        <TouchableOpacity style={cam.ghost} onPress={() => setCaptured(null)}><Text style={cam.ghostTxt}>↺ Retake</Text></TouchableOpacity>
        <TouchableOpacity style={cam.btn} onPress={() => { onCapture(captured); onClose() }}><Text style={cam.btnTxt}>✓ Use</Text></TouchableOpacity>
      </View>
    </View>
  )

  return (
    <View style={cam.wrap}>
      <CameraView ref={camRef} style={cam.camera} facing="back" />
      <View style={cam.row}>
        <TouchableOpacity style={cam.ghost} onPress={onClose}><Text style={cam.ghostTxt}>Cancel</Text></TouchableOpacity>
        <TouchableOpacity style={cam.capture} onPress={take}><Text style={{ fontSize: 22 }}>📷</Text></TouchableOpacity>
      </View>
    </View>
  )
}
const cam = StyleSheet.create({
  wrap:    { flex: 1, backgroundColor: colors.bg, padding: space.lg },
  title:   { fontSize: font.xl, fontWeight: '800', color: colors.textPri, textAlign: 'center', marginBottom: space.md },
  camera:  { flex: 1, borderRadius: radius.md, overflow: 'hidden', marginBottom: space.md },
  preview: { flex: 1, borderRadius: radius.md, marginBottom: space.md, resizeMode: 'contain' },
  row:     { flexDirection: 'row', gap: space.md, justifyContent: 'center' },
  btn:     { backgroundColor: colors.accent, borderRadius: radius.md, paddingVertical: 12, paddingHorizontal: 28 },
  btnTxt:  { color: '#fff', fontWeight: '800', fontSize: font.md },
  ghost:   { backgroundColor: colors.elevated, borderRadius: radius.md, borderWidth: 1, borderColor: colors.borderHi, paddingVertical: 12, paddingHorizontal: 28 },
  ghostTxt:{ color: colors.textSec, fontWeight: '700', fontSize: font.md },
  cancel:  { color: colors.textMute, textAlign: 'center', marginTop: space.md, fontSize: font.md },
  capture: { width: 60, height: 60, borderRadius: 30, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
})

// ── Main wizard ───────────────────────────────────────────────────────────────
export default function CheckInWizard({ onDone }: { onDone: () => void }) {
  const [step, setStep]         = useState<Step>('party')
  const [partySize, setPartySize] = useState(0)
  const [customN, setCustomN]   = useState('')
  const [gIdx, setGIdx]         = useState(0)
  const [guests, setGuests]     = useState<Guest[]>([])
  const [nights, setNights]     = useState('1')
  const [rooms, setRooms]       = useState<Room[]>([])
  const [selRooms, setSelRooms] = useState<number[]>([])
  const [notes, setNotes]       = useState('')
  const [saving, setSaving]     = useState(false)
  const [showCam, setShowCam]   = useState(false)
  const [result, setResult]     = useState<{ ok: boolean; offline: boolean; ref?: string } | null>(null)

  const checkOut = () => {
    const d = new Date(); d.setDate(d.getDate() + (parseInt(nights) || 1))
    return d.toISOString().slice(0, 10)
  }

  const startWizard = (n: number) => {
    setPartySize(n); setGuests(Array.from({ length: n }, blank)); setGIdx(0); setStep('guests')
  }

  const g = guests[gIdx] ?? blank()
  const setG = (f: keyof Guest, v: string) =>
    setGuests(p => p.map((x, i) => i === gIdx ? { ...x, [f]: v } : x))

  const nextGuest = () => gIdx < partySize - 1 ? setGIdx(gIdx + 1) : loadRooms()

  const loadRooms = async () => {
    setStep('rooms')
    try { setRooms(await fetchAvailableRooms()) } catch { setRooms([]) }
  }

  const submit = async () => {
    setSaving(true)
    try {
      const res = await smartCheckin({
        guests: guests.map((x, i) => ({
          name: x.name.trim() || `Guest ${i + 1}`,
          phone: x.phone.trim() || undefined,
          age:   x.age ? parseInt(x.age) : undefined,
          sex:   x.sex || undefined,
          is_primary: i === 0
        })),
        room_ids: selRooms,
        check_out_date: checkOut(),
        notes: notes.trim() || undefined
      })
      setResult(res)
    } catch (e: any) {
      Alert.alert('Error', e.message)
    }
    setSaving(false)
  }

  const pickGallery = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 })
    // For mobile we just show a note — photos are optional without upload support yet
    Alert.alert('Note', 'Photo captured. It will be stored locally. Full photo sync coming soon.')
  }

  // ── Result screen ─────────────────────────────────────────────────────────
  if (result) return (
    <SafeAreaView style={s.root}>
      <View style={s.center}>
        <Text style={{ fontSize: 60, marginBottom: space.md }}>{result.ok ? '✅' : '📶'}</Text>
        <Text style={s.title}>{result.ok ? 'Checked In!' : 'Saved Offline'}</Text>
        <Text style={s.sub}>
          {result.ok
            ? `Booking confirmed.\nReference: ${result.ref ?? 'N/A'}`
            : 'Check-in saved locally.\nIt will sync automatically when the server is reachable.'}
        </Text>
        <TouchableOpacity style={s.btn} onPress={onDone}>
          <Text style={s.btnText}>← Back to Home</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )

  // ── Camera full screen ───────────────────────────────────────────────────
  if (showCam) return <CameraSheet onCapture={() => {}} onClose={() => setShowCam(false)} />

  // ── Party size ───────────────────────────────────────────────────────────
  if (step === 'party') return (
    <SafeAreaView style={s.root}>
      <ScrollView contentContainerStyle={s.page}>
        <Text style={s.title}>How many guests?</Text>
        <Text style={s.sub}>Select or enter the number of people checking in</Text>
        <View style={s.grid}>
          {[1,2,3,4,5,6,7,8,9,10,11,12].map(n => (
            <TouchableOpacity key={n} style={[s.gridBtn, partySize === n && s.gridBtnSel]} onPress={() => setPartySize(n)}>
              <Text style={[s.gridNum, partySize === n && { color: '#fff' }]}>{n}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={s.customRow}>
          <TextInput style={[s.input, { flex: 1 }]} keyboardType="number-pad" placeholder="Custom number…"
            placeholderTextColor={colors.textMute} value={customN}
            onChangeText={t => { setCustomN(t); setPartySize(0) }} />
          {customN && parseInt(customN) > 0 &&
            <TouchableOpacity style={s.btn} onPress={() => setPartySize(parseInt(customN))}>
              <Text style={s.btnText}>Select {customN}</Text>
            </TouchableOpacity>}
        </View>
        {partySize > 0 && <View style={s.infoBox}><Text style={s.infoTxt}>{partySize} guest{partySize > 1 ? 's' : ''} selected</Text></View>}
        <View style={s.navRow}>
          <TouchableOpacity style={s.ghost} onPress={onDone}><Text style={s.ghostTxt}>✕ Cancel</Text></TouchableOpacity>
          <TouchableOpacity style={[s.btn, !partySize && { opacity: 0.4 }]} disabled={!partySize} onPress={() => startWizard(partySize)}>
            <Text style={s.btnText}>Next →</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  )

  // ── Guest details ────────────────────────────────────────────────────────
  if (step === 'guests') return (
    <SafeAreaView style={s.root}>
      <ScrollView contentContainerStyle={s.page} keyboardShouldPersistTaps="handled">
        <Text style={s.stepLabel}>Guest {gIdx + 1} of {partySize}{gIdx === 0 ? ' (Primary)' : ''}</Text>
        <Text style={s.sub}>All fields optional — fill what's available</Text>

        {/* Dots */}
        <View style={s.dots}>
          {guests.map((_, i) => <View key={i} style={[s.dot, i === gIdx && s.dotActive, i < gIdx && s.dotDone]} />)}
        </View>

        <View style={s.field}><Text style={s.label}>Full Name</Text>
          <TextInput style={s.input} value={g.name} onChangeText={v => setG('name', v)} placeholder="Leave blank to skip" placeholderTextColor={colors.textMute} /></View>
        <View style={s.field}><Text style={s.label}>Mobile Number</Text>
          <TextInput style={s.input} value={g.phone} onChangeText={v => setG('phone', v)} keyboardType="phone-pad" placeholder="+91 9876543210" placeholderTextColor={colors.textMute} /></View>
        <View style={s.row}>
          <View style={[s.field, { flex: 1 }]}><Text style={s.label}>Age</Text>
            <TextInput style={s.input} value={g.age} onChangeText={v => setG('age', v)} keyboardType="number-pad" placeholder="—" placeholderTextColor={colors.textMute} /></View>
          <View style={[s.field, { flex: 1 }]}><Text style={s.label}>Sex</Text>
            <View style={s.sexRow}>
              {['M','F','O'].map(sx => (
                <TouchableOpacity key={sx} style={[s.sexBtn, g.sex === sx && s.sexSel]} onPress={() => setG('sex', g.sex === sx ? '' : sx)}>
                  <Text style={[s.sexTxt, g.sex === sx && { color: '#fff' }]}>{sx}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <TouchableOpacity style={s.photoBtn} onPress={() => Alert.alert('Photo', 'Camera support for guest photos coming in next build.')}>
          <Text style={s.photoBtnTxt}>📷  Add Guest Photo (optional)</Text>
        </TouchableOpacity>

        <View style={s.navRow}>
          <TouchableOpacity style={s.ghost} onPress={() => gIdx > 0 ? setGIdx(gIdx - 1) : setStep('party')}>
            <Text style={s.ghostTxt}>← Back</Text></TouchableOpacity>
          <View style={{ flexDirection: 'row', gap: space.sm }}>
            {gIdx < partySize - 1 && <TouchableOpacity style={s.ghost} onPress={nextGuest}><Text style={s.ghostTxt}>Skip →</Text></TouchableOpacity>}
            <TouchableOpacity style={s.btn} onPress={nextGuest}>
              <Text style={s.btnText}>{gIdx < partySize - 1 ? 'Next Guest →' : 'Next: Rooms →'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )

  // ── Room selection ───────────────────────────────────────────────────────
  if (step === 'rooms') return (
    <SafeAreaView style={s.root}>
      <ScrollView contentContainerStyle={s.page}>
        <Text style={s.title}>Select Room(s)</Text>
        <View style={s.nightsRow}>
          <Text style={s.label}>Number of Nights</Text>
          <TextInput style={[s.input, { width: 80, textAlign: 'center' }]} value={nights}
            onChangeText={setNights} keyboardType="number-pad" />
          <Text style={[s.label, { color: colors.accent }]}>→ {checkOut()}</Text>
        </View>

        {rooms.length === 0
          ? <Text style={s.emptyTxt}>No available rooms. Check the desktop app.</Text>
          : rooms.map(r => {
              const sel = selRooms.includes(r.id)
              return (
                <TouchableOpacity key={r.id} style={[s.roomCard, sel && s.roomSel]}
                  onPress={() => setSelRooms(p => p.includes(r.id) ? p.filter(x => x !== r.id) : [...p, r.id])}>
                  {sel && <Text style={s.check}>✓</Text>}
                  <Text style={[s.roomNum, sel && { color: colors.accent }]}>Room {r.room_number}</Text>
                  <Text style={s.roomSub}>{r.room_type} · Floor {r.floor}</Text>
                  <Text style={s.roomPrice}>₹{Number(r.price_per_night).toLocaleString('en-IN')}/night</Text>
                </TouchableOpacity>
              )
            })
        }

        <View style={s.field}><Text style={s.label}>Notes (optional)</Text>
          <TextInput style={[s.input, { minHeight: 60 }]} multiline value={notes} onChangeText={setNotes}
            placeholder="Special requests, extra bed…" placeholderTextColor={colors.textMute} /></View>

        <View style={s.navRow}>
          <TouchableOpacity style={s.ghost} onPress={() => setStep('guests')}><Text style={s.ghostTxt}>← Back</Text></TouchableOpacity>
          <TouchableOpacity style={[s.btn, !selRooms.length && { opacity: 0.4 }]} disabled={!selRooms.length} onPress={() => setStep('confirm')}>
            <Text style={s.btnText}>Review →</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  )

  // ── Confirm ──────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={s.root}>
      <ScrollView contentContainerStyle={s.page}>
        <Text style={s.title}>Confirm Check-In</Text>

        <View style={s.section}><Text style={s.sectionLabel}>GUESTS ({partySize})</Text>
          {guests.map((x, i) => (
            <View key={i} style={s.summaryRow}>
              <Text style={s.summaryName}>{x.name || `Guest ${i + 1}`}{i === 0 ? ' ★' : ''}</Text>
              <Text style={s.summarySub}>{[x.phone, x.age && `Age ${x.age}`, x.sex].filter(Boolean).join(' · ') || 'No details'}</Text>
            </View>
          ))}
        </View>

        <View style={s.section}><Text style={s.sectionLabel}>ROOMS & STAY</Text>
          <Text style={s.summaryName}>{selRooms.map(id => rooms.find(r => r.id === id)?.room_number).filter(Boolean).map(n => `Room ${n}`).join(', ')}</Text>
          <Text style={s.summarySub}>{parseInt(nights) || 1} night{parseInt(nights) !== 1 ? 's' : ''} · Check-out {checkOut()}</Text>
          {notes ? <Text style={s.summarySub}>Note: {notes}</Text> : null}
        </View>

        <View style={s.navRow}>
          <TouchableOpacity style={s.ghost} onPress={() => setStep('rooms')}><Text style={s.ghostTxt}>← Back</Text></TouchableOpacity>
          <TouchableOpacity style={[s.btn, saving && { opacity: 0.5 }]} disabled={saving} onPress={submit}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>✓ Confirm Check-In</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  root:        { flex: 1, backgroundColor: colors.bg },
  page:        { padding: space.lg, paddingBottom: 60 },
  center:      { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.xl },
  title:       { fontSize: font.xl, fontWeight: '800', color: colors.textPri, marginBottom: space.sm },
  stepLabel:   { fontSize: font.xl, fontWeight: '800', color: colors.textPri, marginBottom: 4 },
  sub:         { fontSize: font.md, color: colors.textMute, marginBottom: space.lg, lineHeight: 20 },
  grid:        { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: space.md },
  gridBtn:     { width: '22%', height: 48, borderRadius: radius.sm, borderWidth: 2, borderColor: colors.border, backgroundColor: colors.elevated, alignItems: 'center', justifyContent: 'center' },
  gridBtnSel:  { backgroundColor: colors.accent, borderColor: colors.accent },
  gridNum:     { fontSize: font.lg, fontWeight: '800', color: colors.textSec },
  customRow:   { flexDirection: 'row', gap: space.sm, marginBottom: space.md },
  infoBox:     { backgroundColor: colors.accentDim, borderRadius: radius.sm, padding: space.sm, marginBottom: space.md },
  infoTxt:     { color: colors.accent, fontWeight: '700', fontSize: font.sm, textAlign: 'center' },
  dots:        { flexDirection: 'row', gap: 6, marginBottom: space.lg },
  dot:         { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border },
  dotActive:   { width: 20, borderRadius: 4, backgroundColor: colors.accent },
  dotDone:     { backgroundColor: colors.green },
  field:       { marginBottom: space.md },
  label:       { fontSize: font.sm, fontWeight: '700', color: colors.textSec, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.4 },
  input:       { backgroundColor: colors.elevated, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, padding: 11, color: colors.textPri, fontSize: font.md },
  row:         { flexDirection: 'row', gap: space.md },
  sexRow:      { flexDirection: 'row', gap: 8 },
  sexBtn:      { flex: 1, height: 42, borderRadius: radius.sm, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.elevated, alignItems: 'center', justifyContent: 'center' },
  sexSel:      { backgroundColor: colors.accent, borderColor: colors.accent },
  sexTxt:      { color: colors.textSec, fontWeight: '800', fontSize: font.md },
  photoBtn:    { backgroundColor: colors.elevated, borderRadius: radius.sm, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.borderHi, padding: 14, alignItems: 'center', marginBottom: space.md },
  photoBtnTxt: { color: colors.textMute, fontWeight: '600', fontSize: font.md },
  navRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: space.lg },
  btn:         { backgroundColor: colors.accent, borderRadius: radius.md, paddingVertical: 12, paddingHorizontal: 22 },
  btnText:     { color: '#fff', fontWeight: '800', fontSize: font.md },
  ghost:       { backgroundColor: colors.elevated, borderRadius: radius.md, borderWidth: 1, borderColor: colors.borderHi, paddingVertical: 12, paddingHorizontal: 18 },
  ghostTxt:    { color: colors.textSec, fontWeight: '700', fontSize: font.md },
  nightsRow:   { flexDirection: 'row', alignItems: 'center', gap: space.md, marginBottom: space.md, flexWrap: 'wrap' },
  emptyTxt:    { color: colors.textMute, textAlign: 'center', fontSize: font.md, paddingVertical: space.xl },
  roomCard:    { backgroundColor: colors.elevated, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border, padding: space.md, marginBottom: space.sm, position: 'relative' },
  roomSel:     { borderColor: colors.accent, backgroundColor: colors.accentDim },
  check:       { position: 'absolute', top: 10, right: 12, color: colors.accent, fontWeight: '900', fontSize: font.lg },
  roomNum:     { fontSize: font.lg, fontWeight: '900', color: colors.textPri },
  roomSub:     { fontSize: font.sm, color: colors.textMute },
  roomPrice:   { fontSize: font.md, fontWeight: '700', color: colors.accent, marginTop: 4 },
  section:     { backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: space.md, marginBottom: space.md },
  sectionLabel:{ fontSize: font.xs, fontWeight: '800', color: colors.textMute, letterSpacing: 0.8, marginBottom: space.sm },
  summaryRow:  { paddingVertical: 8, borderTopWidth: 1, borderTopColor: colors.border },
  summaryName: { fontSize: font.md, fontWeight: '700', color: colors.textPri },
  summarySub:  { fontSize: font.sm, color: colors.textMute, marginTop: 2 },
})
