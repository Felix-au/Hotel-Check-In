import { useEffect } from 'react'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { openQueue } from '../src/lib/offlineQueue'
import { startSyncEngine, stopSyncEngine } from '../src/lib/syncEngine'
import { Colors } from '../src/constants/theme'

export default function RootLayout() {
  useEffect(() => {
    // Initialize offline database and start background sync
    openQueue().catch(console.error)
    startSyncEngine(30_000)
    return () => stopSyncEngine()
  }, [])

  return (
    <>
      <StatusBar style="light" backgroundColor={Colors.bgBase} />
      <Stack
        screenOptions={{
          headerStyle:      { backgroundColor: Colors.bgSurface },
          headerTintColor:  Colors.textPrimary,
          headerTitleStyle: { fontWeight: '700', fontSize: 16 },
          contentStyle:     { backgroundColor: Colors.bgBase },
          animation:        'slide_from_right',
        }}
      >
        <Stack.Screen name="index"         options={{ title: 'Hotel Check-In', headerShown: false }} />
        <Stack.Screen name="pair"          options={{ title: 'Connect to Server' }} />
        <Stack.Screen name="checkin/index" options={{ title: 'New Check-In' }} />
        <Stack.Screen name="checkin/guests"       options={{ title: 'Guest Details' }} />
        <Stack.Screen name="checkin/id-capture"   options={{ title: 'ID Document Capture', headerShown: false }} />
        <Stack.Screen name="checkin/portrait"     options={{ title: 'Guest Photo', headerShown: false }} />
        <Stack.Screen name="checkin/rooms"        options={{ title: 'Room & Stay' }} />
        <Stack.Screen name="checkin/confirm"      options={{ title: 'Confirm Check-In' }} />
        <Stack.Screen name="queue"         options={{ title: 'Sync Queue' }} />
      </Stack>
    </>
  )
}
