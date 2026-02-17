import { useBracket } from './context/BracketContext'
import { SetupScreen } from './components/SetupScreen/SetupScreen'
import { MatchupScreen } from './components/MatchupScreen/MatchupScreen'
import { WinnerScreen } from './components/WinnerScreen/WinnerScreen'
import { LoadingScreen } from './components/LoadingScreen/LoadingScreen'
import { AnimatePresence } from 'framer-motion'
import styles from './App.module.css'

function App() {
  const { screen, rounds, currentRoundIndex, currentMatchupIndex, bracketSize } = useBracket()

  const isMatchup = screen === 'matchup'
  const totalRounds = Math.log2(bracketSize)

  let progressPercent = 0
  let roundName = ''
  let matchLabel = ''

  if (isMatchup && rounds.length > 0) {
    const currentRound = rounds[currentRoundIndex]
    roundName = currentRound.name
    matchLabel = `Match ${currentMatchupIndex + 1} of ${currentRound.matchups.length}`

    let completedMatches = 0
    for (let r = 0; r < currentRoundIndex; r++) {
      completedMatches += Math.pow(2, totalRounds - 1 - r)
    }
    completedMatches += currentMatchupIndex
    const totalTournamentMatches = Math.pow(2, totalRounds) - 1
    progressPercent = totalTournamentMatches > 0
      ? (completedMatches / totalTournamentMatches) * 100
      : 0
  }

  return (
    <div className={styles.app}>
      <header className={`${styles.header} ${isMatchup ? styles.headerCompact : ''}`}>
        <div className={styles.headerContent}>
          <h1 className={styles.logo}>
            <span className={styles.logoIcon}>▶</span>
            decide<span className={styles.logoAccent}>2</span>watch
          </h1>

          {isMatchup && (
            <div className={styles.progressInfo}>
              <span className={styles.roundName}>{roundName}</span>
              <span className={styles.dot}>·</span>
              <span className={styles.matchInfo}>{matchLabel}</span>
            </div>
          )}
        </div>

        {isMatchup && (
          <div className={styles.progressTrack}>
            <div
              className={styles.progressFill}
              style={{ width: `${Math.min(progressPercent, 100)}%` }}
            />
          </div>
        )}
      </header>

      <main className={`${styles.main} ${isMatchup ? styles.mainMatchup : ''}`}>
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
