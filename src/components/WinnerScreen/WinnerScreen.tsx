import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useBracket, useBracketDispatch } from '../../context/BracketContext'
import { MovieCard } from '../MovieCard/MovieCard'
import { BracketView } from '../BracketView/BracketView'
import styles from './WinnerScreen.module.css'

/* ---------- Confetti helpers ---------- */

const CONFETTI_COUNT = 30
const CONFETTI_COLORS = [
  '#fbbf24', // gold
  '#f59e0b', // amber
  '#6366f1', // accent / indigo
  '#818cf8', // lighter indigo
  '#ffffff', // white
  '#22c55e', // green
  '#ec4899', // pink
  '#f97316', // orange
]

interface ConfettiPiece {
  id: number
  x: number // random spread -50vw to 50vw
  y: number // random upward burst
  rotate: number
  scale: number
  color: string
  shape: 'square' | 'circle'
  delay: number
  duration: number
}

function generateConfetti(): ConfettiPiece[] {
  return Array.from({ length: CONFETTI_COUNT }, (_, i) => ({
    id: i,
    x: (Math.random() - 0.5) * 100, // vw units spread
    y: -(Math.random() * 60 + 30), // fly upward between -30vh and -90vh
    rotate: Math.random() * 720 - 360,
    scale: Math.random() * 0.6 + 0.4,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    shape: Math.random() > 0.5 ? 'square' : 'circle',
    delay: Math.random() * 0.4,
    duration: Math.random() * 1.2 + 1.0,
  }))
}

/* ---------- Component ---------- */

export function WinnerScreen() {
  const { rounds } = useBracket()
  const dispatch = useBracketDispatch()

  const [showBracket, setShowBracket] = useState(false)

  // Capture winner on mount so it survives RESET during exit animation
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const winner = useMemo(() => {
    if (rounds.length === 0) return null
    const finalRound = rounds[rounds.length - 1]
    return finalRound.matchups[0].winner
  }, [])

  const confettiPieces = useMemo(() => generateConfetti(), [])

  if (!winner) return null

  const tmdbUrl = `https://www.themoviedb.org/${winner.mediaType}/${winner.id}`

  return (
    <motion.div
      className={styles.wrapper}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* ---- Confetti Layer ---- */}
      <div className={styles.confettiContainer} aria-hidden="true">
        {confettiPieces.map((piece) => (
          <motion.div
            key={piece.id}
            className={`${styles.confettiPiece} ${
              piece.shape === 'circle' ? styles.confettiCircle : styles.confettiSquare
            }`}
            style={{
              backgroundColor: piece.color,
              width: piece.scale * 12,
              height: piece.scale * 12,
            }}
            initial={{
              x: 0,
              y: 0,
              opacity: 1,
              rotate: 0,
              scale: 0,
            }}
            animate={{
              x: `${piece.x}vw`,
              y: `${piece.y}vh`,
              opacity: 0,
              rotate: piece.rotate,
              scale: piece.scale,
            }}
            transition={{
              duration: piece.duration,
              delay: piece.delay,
              ease: 'easeOut',
            }}
          />
        ))}
      </div>

      {/* ---- Title ---- */}
      <motion.h1
        className={styles.title}
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.1 }}
      >
        YOUR WINNER
      </motion.h1>

      {/* ---- Winner Card ---- */}
      <motion.div
        className={styles.cardWrapper}
        initial={{ y: 100, opacity: 0, scale: 0.8 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 150, damping: 15, delay: 0.3 }}
      >
        <div className={styles.glowBorder}>
          <MovieCard item={winner} />
        </div>
      </motion.div>

      {/* ---- TMDB Link ---- */}
      <motion.a
        className={styles.tmdbLink}
        href={tmdbUrl}
        target="_blank"
        rel="noopener noreferrer"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
      >
        View on TMDB
        <span className={styles.externalIcon} aria-hidden="true">
          &#8599;
        </span>
      </motion.a>

      {/* ---- Buttons ---- */}
      <motion.div
        className={styles.buttons}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.9 }}
      >
        <button
          className={styles.bracketBtn}
          onClick={() => setShowBracket((prev) => !prev)}
          type="button"
        >
          {showBracket ? 'Hide Bracket' : 'View Bracket'}
        </button>

        <button
          className={styles.playAgainBtn}
          onClick={() => dispatch({ type: 'RESET' })}
          type="button"
        >
          Play Again
        </button>
      </motion.div>

      {/* ---- Bracket View ---- */}
      <AnimatePresence>
        {showBracket && <BracketView key="bracket" />}
      </AnimatePresence>
    </motion.div>
  )
}
