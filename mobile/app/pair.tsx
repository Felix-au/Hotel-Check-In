import { useState, useEffect } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native'
import { CameraView, useCameraPermissions } from 'expo-camera'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { saveServerConfig, pingServer, getServerConfig } from '../src/lib/api'
import { Colors, Spacing, FontSize, FontWeight, Radius } from '../src/constants/theme'

export default function PairScreen() {
  const router = useRouter()
  const [permission, requestPermission]     = useCameraPermissions()
  const [mode, setMode]                     = useState<'qr' | 'manual'>('qr')
  const [scanned, setScanned]               = useState(false)
  const [manualUrl, setManualUrl]           = useState('')
  const [testing, setTesting]               = useState(false)
  const [currentUrl, setCurrentUrl]         = useState('')

  useEffect(() => {
    getServerConfig().then(c => setCurrentUrl(c?.url ?? ''))
  }, [])

  const handleQRScan = async ({ data }: { data: string }) => {
    if (scanned) return
    setScanned(true)

    try {
      let url = data
      let token: string | undefined
      // Data may be JSON: { url, token }
      try {
        const parsed = JSON.parse(data)
        if (parsed.url) {
          url = parsed.url
          token = parsed.token
        }
      } catch { /* raw URL */ }

      await testAndSave(url, token)
    } catch (err: any) {
      Alert.alert('Invalid QR Code', err.message ?? 'Could not parse pairing data.')
      setScanned(false)
    }
  }

  const handleManualSave = async () => {
    const url = manualUrl.trim()
    if (!url) return Alert.alert('Enter a URL', 'e.g. http://192.168.1.15:8080')
    await testAndSave(url)
  }

  const testAndSave = async (url: string, token?: string) => {
    setTesting(true)
    try {
      // Temporarily set config to test it
      await saveServerConfig({ url, token })
      const ok = await pingServer()
      if (!ok) throw new Error(`Could not reach ${url}. Ensure you're on the same network or VPN.`)
      setCurrentUrl(url)
      Alert.alert('✓ Connected!', `Server at ${url} is reachable.`, [
        { text: 'Done', onPress: () => router.back() }
      ])
    } catch (err: any) {
      Alert.alert('Connection Failed', err.message)
      setScanned(false)
    } finally {
      setTesting(false)
    }
  }

  if (!permission) return <View style={s.safe} />

  if (!permission.granted) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.center}>
          <Text style={s.permTitle}>Camera Permission Required</Text>
          <Text style={s.permSub}>Needed to scan the server QR code</Text>
          <TouchableOpacity style={s.btn} onPress={requestPermission}>
            <Text style={s.btnText}>Grant Camera Access</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={s.safe}>
      {/* Mode toggle */}
      <View style={s.toggle}>
        <TouchableOpacity style={[s.toggleBtn, mode === 'qr' && s.toggleActive]} onPress={() => setMode('qr')}>
          <Text style={[s.toggleText, mode === 'qr' && s.toggleTextActive]}>Scan QR</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.toggleBtn, mode === 'manual' && s.toggleActive]} onPress={() => setMode('manual')}>
          <Text style={[s.toggleText, mode === 'manual' && s.toggleTextActive]}>Manual URL</Text>
        </TouchableOpacity>
      </View>

      {mode === 'qr' ? (
        <View style={{ flex: 1 }}>
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={scanned ? undefined : handleQRScan}
          />
          {/* QR frame overlay */}
          <View style={s.overlay}>
            <View style={s.frame}>
              <View style={[s.corner, s.tl]} /><View style={[s.corner, s.tr]} />
              <View style={[s.corner, s.bl]} /><View style={[s.corner, s.br]} />
            </View>
            <Text style={s.scanHint}>Point at the QR code on the desktop app</Text>
          </View>
          {testing && (
            <View style={s.testingOverlay}>
              <ActivityIndicator color={Colors.accent} size="large" />
              <Text style={s.testingText}>Testing connection...</Text>
            </View>
          )}
        </View>
      ) : (
        <View style={s.manualContainer}>
          {currentUrl ? (
            <View style={s.currentCard}>
              <Text style={s.currentLabel}>Currently connected to:</Text>
              <Text style={s.currentUrl}>{currentUrl}</Text>
            </View>
          ) : null}
          <Text style={s.inputLabel}>Server URL</Text>
          <TextInput
            style={s.input}
            value={manualUrl}
            onChangeText={setManualUrl}
            placeholder="http://192.168.1.x:8080"
            placeholderTextColor={Colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />
          <Text style={s.inputHint}>
            Find this URL on the desktop app under Settings → Device Pairing.
          </Text>
          <TouchableOpacity style={s.btn} onPress={handleManualSave} disabled={testing}>
            {testing
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.btnText}>Test & Save</Text>
            }
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  )
}

const CORNER_SIZE = 24
const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.bgBase },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.lg, gap: Spacing.md },
  toggle: {
    flexDirection: 'row', margin: Spacing.md,
    backgroundColor: Colors.bgSurface, borderRadius: Radius.sm,
    borderWidth: 1, borderColor: Colors.border, padding: 4,
  },
  toggleBtn: {
    flex: 1, paddingVertical: 9, borderRadius: Radius.sm - 2,
    alignItems: 'center',
  },
  toggleActive:     { backgroundColor: Colors.accent },
  toggleText:       { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textMuted },
  toggleTextActive: { color: '#fff' },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center', justifyContent: 'center',
  },
  frame: {
    width: 240, height: 240, position: 'relative',
  },
  corner: {
    position: 'absolute', width: CORNER_SIZE, height: CORNER_SIZE,
    borderColor: Colors.accent, borderWidth: 3,
  },
  tl: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  tr: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
  bl: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
  br: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
  scanHint: {
    marginTop: 24, color: Colors.textSecondary, fontSize: FontSize.sm,
    backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: Radius.full, overflow: 'hidden',
  },
  testingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center', justifyContent: 'center', gap: Spacing.md,
  },
  testingText: { color: Colors.textPrimary, fontSize: FontSize.base },

  manualContainer: { flex: 1, padding: Spacing.lg, gap: Spacing.sm },
  currentCard: {
    backgroundColor: Colors.greenDim, borderRadius: Radius.md,
    borderWidth: 1, borderColor: 'rgba(34,208,154,0.25)',
    padding: Spacing.md, marginBottom: Spacing.sm,
  },
  currentLabel: { fontSize: FontSize.xs, color: Colors.green },
  currentUrl:   { fontSize: FontSize.sm, color: Colors.textPrimary, marginTop: 4 },
  inputLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  input: {
    backgroundColor: Colors.bgGlass,
    borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.sm, padding: Spacing.md,
    color: Colors.textPrimary, fontSize: FontSize.base,
  },
  inputHint: { fontSize: FontSize.xs, color: Colors.textMuted, lineHeight: 18 },
  btn: {
    backgroundColor: Colors.accent, borderRadius: Radius.md,
    padding: Spacing.md, alignItems: 'center', marginTop: Spacing.sm,
  },
  btnText: { color: '#fff', fontWeight: FontWeight.bold, fontSize: FontSize.base },
  permTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  permSub:   { fontSize: FontSize.sm, color: Colors.textMuted, textAlign: 'center' },
})
