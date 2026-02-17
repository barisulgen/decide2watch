import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useBracket, useBracketDispatch } from '../../context/BracketContext'
import { MovieCard } from '../MovieCard/MovieCard'
import type { MediaItem } from '../../types'
import styles from './MatchupScreen.module.css'

type PickSide = 'left' | 'right' | null

export function MatchupScreen() {
  const { rounds, currentRoundIndex, currentMatchupIndex } = useBracket()
  const dispatch = useBracketDispatch()

  const [pickState, setPickState] = useState<PickSide>(null)
  const [showRoundAnnouncement, setShowRoundAnnouncement] = useState(false)

  const currentRound = rounds[currentRoundIndex]
  const currentMatchup = currentRound.matchups[currentMatchupIndex]

  // Show round announcement when entering a new round (not the first one)
  useEffect(() => {
    if (currentMatchupIndex === 0 && currentRoundIndex > 0) {
      setShowRoundAnnouncement(true)
      const timer = setTimeout(() => {
        setShowRoundAnnouncement(false)
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [currentRoundIndex, currentMatchupIndex])

  const handlePick = useCallback(
    (winner: MediaItem, side: 'left' | 'right') => {
      if (pickState !== null) return

      setPickState(side)

      setTimeout(() => {
        dispatch({ type: 'PICK_WINNER', payload: winner })
        setPickState(null)
      }, 800)
    },
    [pickState, dispatch],
  )

  // Animation variants
  const leftCardVariants = {
    initial: { x: -200, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: pickState === 'left'
      ? { scale: 1.02, opacity: 1, transition: { duration: 0.3 } }
      : pickState === 'right'
        ? { x: -200, opacity: 0, transition: { duration: 0.4 } }
        : { x: -200, opacity: 0, transition: { duration: 0.3 } },
  }

  const rightCardVariants = {
    initial: { x: 200, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: pickState === 'right'
      ? { scale: 1.02, opacity: 1, transition: { duration: 0.3 } }
      : pickState === 'left'
        ? { x: 200, opacity: 0, transition: { duration: 0.4 } }
        : { x: 200, opacity: 0, transition: { duration: 0.3 } },
  }

  const springTransition = {
    type: 'spring' as const,
    stiffness: 200,
    damping: 25,
  }

  return (
    <motion.div
      className={styles.wrapper}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Round Announcement Overlay */}
      <AnimatePresence>
        {showRoundAnnouncement && (
          <motion.div
            className={styles.roundOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <motion.span
              className={styles.roundAnnouncementText}
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.1, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            >
              {currentRound.name}
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Matchup Arena */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${currentRoundIndex}-${currentMatchupIndex}`}
          className={styles.arena}
        >
          {/* Left Card */}
          <motion.div
            className={`${styles.cardLeft} ${pickState === 'left' ? styles.cardWinner : ''}`}
            variants={leftCardVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={springTransition}
            whileHover={{ y: -8, boxShadow: '0 16px 48px rgba(0, 0, 0, 0.6)' }}
            whileTap={{ scale: 0.98 }}
          >
            <MovieCard
              item={currentMatchup.a}
              onClick={() => handlePick(currentMatchup.a, 'left')}
              disabled={pickState !== null}
            />
          </motion.div>

          {/* VS Element */}
          <div className={styles.vsContainer}>
            <span className={styles.vs}>VS</span>
          </div>

          {/* Right Card */}
          <motion.div
            className={`${styles.cardRight} ${pickState === 'right' ? styles.cardWinner : ''}`}
            variants={rightCardVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={springTransition}
            whileHover={{ y: -8, boxShadow: '0 16px 48px rgba(0, 0, 0, 0.6)' }}
            whileTap={{ scale: 0.98 }}
          >
            <MovieCard
              item={currentMatchup.b}
              onClick={() => handlePick(currentMatchup.b, 'right')}
              disabled={pickState !== null}
            />
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  )
}
