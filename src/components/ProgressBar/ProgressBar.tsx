import styles from './ProgressBar.module.css'

interface ProgressBarProps {
  roundName: string
  matchNumber: number
  totalMatches: number
  roundNumber: number
  totalRounds: number
}

export function ProgressBar({
  roundName,
  matchNumber,
  totalMatches,
  roundNumber,
  totalRounds,
}: ProgressBarProps) {
  // Calculate overall tournament progress
  // Each round halves the number of matchups: round 0 has bracketSize/2, round 1 has bracketSize/4, etc.
  // Total matchups across all rounds = bracketSize - 1 (for a single-elimination bracket)
  // Completed = sum of all matchups in previous rounds + current matchup index
  let completedMatches = 0
  for (let r = 0; r < roundNumber; r++) {
    // Each round r has totalMatches_for_that_round = totalFirstRoundMatches / 2^r
    // But we can simplify: total matches in round r = bracketSize / 2^(r+1)
    // Since we don't have bracketSize directly, we compute from totalRounds
    const matchesInRound = Math.pow(2, totalRounds - 1 - r)
    completedMatches += matchesInRound
  }
  completedMatches += matchNumber - 1 // current match is 1-indexed, subtract 1 for completed

  const totalTournamentMatches = Math.pow(2, totalRounds) - 1
  const progressPercent = totalTournamentMatches > 0
    ? (completedMatches / totalTournamentMatches) * 100
    : 0

  return (
    <div className={styles.container}>
      <div className={styles.info}>
        <span className={styles.roundName}>{roundName}</span>
        <span className={styles.matchInfo}>
          Match {matchNumber} of {totalMatches}
        </span>
      </div>
      <div className={styles.track}>
        <div
          className={styles.fill}
          style={{ width: `${Math.min(progressPercent, 100)}%` }}
        />
      </div>
    </div>
  )
}
