import React, { useState, useEffect } from 'react'
import { View, StyleSheet, StatusBar } from 'react-native'
import { getServerConfig } from './src/store'
import { ping } from './src/api'
import PairScreen from './src/screens/PairScreen'
import HomeScreen from './src/screens/HomeScreen'
import CheckInWizard from './src/screens/CheckInWizard'
import { colors } from './src/theme'

type Screen = 'loading' | 'pair' | 'home' | 'checkin'

export default function App() {
  const [screen, setScreen] = useState<Screen>('loading')

  useEffect(() => {
    getServerConfig().then(async cfg => {
      if (!cfg) { setScreen('pair'); return }
      // Config exists — go to home directly (ping happens there)
      setScreen('home')
    })
  }, [])

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
      {screen === 'loading' && <View style={s.root} />}
      {screen === 'pair'    && <PairScreen onPaired={() => setScreen('home')} />}
      {screen === 'home'    && <HomeScreen onStartCheckin={() => setScreen('checkin')} onUnpair={() => setScreen('pair')} />}
      {screen === 'checkin' && <CheckInWizard onDone={() => setScreen('home')} />}
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg }
})
