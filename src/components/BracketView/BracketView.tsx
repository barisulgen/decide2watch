import { motion } from 'framer-motion'
import { useBracket } from '../../context/BracketContext'
import styles from './BracketView.module.css'

export function BracketView() {
  const { rounds } = useBracket()

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3 }}
      style={{ overflow: 'hidden', width: '100%' }}
    >
      <div className={styles.bracket}>
        {rounds.map((round, roundIndex) => (
          <div key={roundIndex} className={styles.round}>
            <div className={styles.roundTitle}>{round.name}</div>
            {round.matchups.map((matchup, matchupIndex) => (
              <div key={matchupIndex} className={styles.matchup}>
                <div
                  className={`${styles.seed} ${
                    matchup.winner
                      ? matchup.winner.id === matchup.a.id
                        ? styles.winner
                        : styles.loser
                      : ''
                  }`}
                  title={matchup.a.title}
                >
                  {matchup.a.title}
                </div>
                <div
                  className={`${styles.seed} ${
                    matchup.winner
                      ? matchup.winner.id === matchup.b.id
                        ? styles.winner
                        : styles.loser
                      : ''
                  }`}
                  title={matchup.b.title}
                >
                  {matchup.b.title}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </motion.div>
  )
}
