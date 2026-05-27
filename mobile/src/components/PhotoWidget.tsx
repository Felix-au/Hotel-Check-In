import React from 'react'
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { colors, radius, font, space } from '../theme'

interface Props {
  uri: string | null
  onChange: (uri: string | null) => void
  fallbackIcon?: string
  size?: number
}

export default function PhotoWidget({ uri, onChange, fallbackIcon = '👤', size = 100 }: Props) {
  const openCamera = async () => {
    const r = await ImagePicker.launchCameraAsync({ quality: 0.85, allowsEditing: true, aspect: [1,1] })
    if (!r.canceled && r.assets[0]) onChange(r.assets[0].uri)
  }
  const openGallery = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({ quality: 0.85, allowsEditing: true, aspect: [1,1] })
    if (!r.canceled && r.assets[0]) onChange(r.assets[0].uri)
  }
  return (
    <View style={s.wrap}>
      <TouchableOpacity style={[s.thumb, { width: size, height: size }]} onPress={openCamera}>
        {uri ? <Image source={{ uri }} style={s.img} /> : <Text style={{ fontSize: size * 0.38 }}>{fallbackIcon}</Text>}
      </TouchableOpacity>
      <View style={s.row}>
        <TouchableOpacity style={s.btn} onPress={openCamera}><Text style={s.btnTxt}>📷</Text></TouchableOpacity>
        <TouchableOpacity style={s.btn} onPress={openGallery}><Text style={s.btnTxt}>🗂</Text></TouchableOpacity>
        {uri && <TouchableOpacity style={[s.btn, { borderColor: colors.red }]} onPress={() => onChange(null)}><Text style={[s.btnTxt, { color: colors.red }]}>✕</Text></TouchableOpacity>}
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  wrap:  { alignItems: 'center', gap: space.xs },
  thumb: { borderRadius: radius.md, borderWidth: 2, borderColor: colors.borderHi, backgroundColor: colors.elevated, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  img:   { width: '100%', height: '100%' },
  row:   { flexDirection: 'row', gap: 6 },
  btn:   { paddingVertical: 5, paddingHorizontal: 10, borderRadius: radius.xs, borderWidth: 1, borderColor: colors.borderHi, backgroundColor: colors.elevated },
  btnTxt:{ fontSize: font.md, color: colors.textSec },
})
