import { useState } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, Image, Alert,
} from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as ImagePicker from 'expo-image-picker'
import { useCheckIn } from './_context'
import { Colors, Spacing, FontSize, FontWeight, Radius } from '../../src/constants/theme'

const SEX_OPTIONS = ['male', 'female', 'other'] as const

export default function GuestsScreen() {
  const router = useRouter()
  const { state, updateGuest } = useCheckIn()
  const [expandedIndex, setExpanded] = useState(0)

  const pickPortrait = async (index: number) => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      allowsEditing: true,
      aspect: [1, 1],
    })
    if (!result.canceled && result.assets[0]) {
      updateGuest(index, { localPhotoUri: result.assets[0].uri })
    }
  }

  const canProceed = state.guests.every(g => g.name.trim().length > 0)

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.content}>
        <View style={s.progress}>
          {[1, 2, 3, 4].map(i => (
            <View key={i} style={[s.progressStep, i <= 2 && s.progressActive]} />
          ))}
        </View>

        <Text style={s.stepLabel}>STEP 2 OF 4</Text>
        <Text style={s.title}>Guest Details</Text>
        <Text style={s.subtitle}>Name is required. All other fields are optional.</Text>

        {state.guests.map((guest, index) => (
          <TouchableOpacity
            key={index}
            style={[s.guestCard, expandedIndex === index && s.guestCardActive]}
            onPress={() => setExpanded(index)}
            activeOpacity={0.85}
          >
            {/* Card header */}
            <View style={s.cardHeader}>
              {guest.localPhotoUri
                ? <Image source={{ uri: guest.localPhotoUri }} style={s.avatar} />
                : (
                  <View style={s.avatarPlaceholder}>
                    <Text style={s.avatarIcon}>{index === 0 ? '★' : '♟'}</Text>
                  </View>
                )
              }
              <View style={{ flex: 1 }}>
                <Text style={s.guestNum}>
                  Guest {index + 1}{guest.is_primary_contact ? '  (Primary)' : ''}
                </Text>
                <Text style={s.guestName} numberOfLines={1}>
                  {guest.name || 'Tap to fill details'}
                </Text>
              </View>
              <Text style={s.chevron}>{expandedIndex === index ? '▲' : '▼'}</Text>
            </View>

            {/* Expanded form */}
            {expandedIndex === index && (
              <View style={s.form}>
                {/* Portrait photo */}
                <TouchableOpacity style={s.photoBtn} onPress={() => pickPortrait(index)}>
                  <Text style={s.photoBtnText}>
                    {guest.localPhotoUri ? '↻ Retake Portrait' : '📷 Take Portrait Photo'}
                  </Text>
                </TouchableOpacity>

                {/* Name */}
                <View style={s.field}>
                  <Text style={s.label}>Full Name *</Text>
                  <TextInput
                    style={s.input}
                    value={guest.name}
                    onChangeText={v => updateGuest(index, { name: v })}
                    placeholder="Enter full name"
                    placeholderTextColor={Colors.textMuted}
                    autoCorrect={false}
                  />
                </View>

                {/* Age */}
                <View style={s.field}>
                  <Text style={s.label}>Age (optional)</Text>
                  <TextInput
                    style={s.input}
                    value={guest.age?.toString() ?? ''}
                    onChangeText={v => updateGuest(index, { age: v ? parseInt(v) : undefined })}
                    placeholder="e.g. 34"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="number-pad"
                  />
                </View>

                {/* Sex */}
                <View style={s.field}>
                  <Text style={s.label}>Sex (optional)</Text>
                  <View style={s.sexRow}>
                    {SEX_OPTIONS.map(opt => (
                      <TouchableOpacity
                        key={opt}
                        style={[s.sexBtn, guest.sex === opt && s.sexBtnActive]}
                        onPress={() => updateGuest(index, { sex: opt })}
                      >
                        <Text style={[s.sexBtnText, guest.sex === opt && s.sexBtnTextActive]}>
                          {opt.charAt(0).toUpperCase() + opt.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            )}
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={[s.nextBtn, !canProceed && s.nextBtnDisabled]}
          onPress={() => canProceed && router.push('/checkin/id-capture')}
          activeOpacity={canProceed ? 0.75 : 1}
        >
          <Text style={s.nextBtnText}>
            {canProceed ? 'Next: ID Document →' : 'Fill all names to continue'}
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
  progressStep: { flex: 1, height: 4, borderRadius: 2, backgroundColor: Colors.bgGlass, borderWidth: 1, borderColor: Colors.border },
  progressActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },

  stepLabel: { fontSize: FontSize.xs, color: Colors.accent, fontWeight: FontWeight.bold, letterSpacing: 1.5 },
  title:     { fontSize: FontSize.xl, fontWeight: FontWeight.heavy, color: Colors.textPrimary },
  subtitle:  { fontSize: FontSize.base, color: Colors.textMuted, lineHeight: 22 },

  guestCard: {
    backgroundColor: Colors.bgGlass, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border, overflow: 'hidden',
  },
  guestCardActive: { borderColor: Colors.accent },
  cardHeader:      { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.md },
  avatar:          { width: 44, height: 44, borderRadius: Radius.full, backgroundColor: Colors.bgElevated },
  avatarPlaceholder: {
    width: 44, height: 44, borderRadius: Radius.full,
    backgroundColor: Colors.accentDim, borderWidth: 1, borderColor: 'rgba(108,99,255,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarIcon:  { fontSize: 20 },
  guestNum:    { fontSize: FontSize.xs, color: Colors.accent, fontWeight: FontWeight.semibold },
  guestName:   { fontSize: FontSize.base, color: Colors.textPrimary, fontWeight: FontWeight.medium, marginTop: 2 },
  chevron:     { color: Colors.textMuted, fontSize: 12 },

  form: { padding: Spacing.md, paddingTop: 0, gap: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.border },
  photoBtn: {
    backgroundColor: Colors.accentDim, borderRadius: Radius.sm,
    borderWidth: 1, borderColor: 'rgba(108,99,255,0.25)',
    padding: Spacing.sm, alignItems: 'center',
  },
  photoBtnText: { color: Colors.accent, fontWeight: FontWeight.semibold, fontSize: FontSize.sm },

  field: { gap: 6 },
  label: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  input: {
    backgroundColor: Colors.bgBase, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.sm, padding: Spacing.sm,
    color: Colors.textPrimary, fontSize: FontSize.base,
  },
  sexRow:          { flexDirection: 'row', gap: 8 },
  sexBtn:          { flex: 1, paddingVertical: 9, borderRadius: Radius.sm, backgroundColor: Colors.bgBase, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  sexBtnActive:    { backgroundColor: Colors.accentDim, borderColor: Colors.accent },
  sexBtnText:      { fontSize: FontSize.sm, color: Colors.textMuted, fontWeight: FontWeight.medium },
  sexBtnTextActive:{ color: Colors.accent },

  nextBtn:         { backgroundColor: Colors.accent, borderRadius: Radius.md, padding: Spacing.md, alignItems: 'center', marginTop: Spacing.sm },
  nextBtnDisabled: { opacity: 0.4 },
  nextBtnText:     { color: '#fff', fontWeight: FontWeight.bold, fontSize: FontSize.base },
})
