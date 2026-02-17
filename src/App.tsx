import { useBracket } from './context/BracketContext'
import { SetupScreen } from './components/SetupScreen/SetupScreen'
import { MatchupScreen } from './components/MatchupScreen/MatchupScreen'
import { WinnerScreen } from './components/WinnerScreen/WinnerScreen'
import { LoadingScreen } from './components/LoadingScreen/LoadingScreen'
import { AnimatePresence } from 'framer-motion'
import styles from './App.module.css'

function App() {
  const { screen } = useBracket()

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <h1 className={styles.logo}>decide2watch</h1>
      </header>
      <main className={styles.main}>
        <AnimatePresence mode="wait">
          {screen === 'setup' && <SetupScreen key="setup" />}
          {screen === 'loading' && <LoadingScreen key="loading" />}
          {screen === 'matchup' && <MatchupScreen key="matchup" />}
          {screen === 'winner' && <WinnerScreen key="winner" />}
        </AnimatePresence>
      </main>
    </div>
  )
}

export default App
