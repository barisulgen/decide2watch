import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useBracket, useBracketDispatch } from '../../context/BracketContext'
import { BracketView } from '../BracketView/BracketView'
import { TMDB_IMAGE_BASE, POSTER_SIZE, PROFILE_SIZE, LOGO_SIZE } from '../../constants/genres'
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
  x: number
  y: number
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
    x: (Math.random() - 0.5) * 100,
    y: -(Math.random() * 60 + 30),
    rotate: Math.random() * 720 - 360,
    scale: Math.random() * 0.6 + 0.4,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    shape: Math.random() > 0.5 ? 'square' : 'circle',
    delay: Math.random() * 0.4,
    duration: Math.random() * 1.2 + 1.0,
  }))
}

function formatRuntime(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

function formatVoteCount(count: number): string {
  if (count >= 1000) return count.toLocaleString()
  return String(count)
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
  const year = winner.releaseDate ? winner.releaseDate.slice(0, 4) : null
  const cast = winner.cast?.slice(0, 5) ?? []
  const providers = winner.watchProviders?.slice(0, 6) ?? []

  const ratingClass =
    winner.voteAverage >= 7
      ? styles.ratingHigh
      : winner.voteAverage >= 5
        ? styles.ratingMid
        : styles.ratingLow

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
            initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 0 }}
            animate={{
              x: `${piece.x}vw`,
              y: `${piece.y}vh`,
              opacity: 0,
              rotate: piece.rotate,
              scale: piece.scale,
            }}
            transition={{ duration: piece.duration, delay: piece.delay, ease: 'easeOut' }}
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

      {/* ---- Horizontal Layout: Poster Left, Info Right ---- */}
      <motion.div
        className={styles.winnerLayout}
        initial={{ y: 80, opacity: 0, scale: 0.9 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 150, damping: 15, delay: 0.3 }}
      >
        {/* Poster Side */}
        <div className={styles.posterSide}>
          <div className={styles.glowBorder}>
            <div className={styles.posterContainer}>
              {winner.posterPath ? (
                <img
                  className={styles.posterImage}
                  src={`${TMDB_IMAGE_BASE}${POSTER_SIZE}${winner.posterPath}`}
                  alt={winner.title}
                />
              ) : (
                <div className={styles.posterPlaceholder}>
                  <span className={styles.posterIcon} aria-hidden="true">
                    🎬
                  </span>
                  <span className={styles.posterTitle}>{winner.title}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Info Side */}
        <div className={styles.infoSide}>
          {/* Title & Year */}
          <div className={styles.infoTitleRow}>
            <h2 className={styles.infoTitle}>{winner.title}</h2>
            {year && <span className={styles.infoYear}>({year})</span>}
          </div>

          {/* Rating */}
          <div className={styles.ratingRow}>
            <span className={`${styles.ratingBadge} ${ratingClass}`}>
              {winner.voteAverage.toFixed(1)}
            </span>
            <span className={styles.voteCount}>
              &middot; {formatVoteCount(winner.voteCount)} votes
            </span>
          </div>

          {/* Genres */}
          {winner.genres.length > 0 && (
            <div className={styles.genres}>
              {winner.genres.map((genre) => (
                <span key={genre} className={styles.genrePill}>
                  {genre}
                </span>
              ))}
            </div>
          )}

          {/* Synopsis */}
          {winner.overview && (
            <p className={styles.synopsis}>{winner.overview}</p>
          )}

          {/* Runtime / Seasons */}
          {winner.mediaType === 'movie' && winner.runtime != null && (
            <div className={styles.meta}>
              <span className={styles.metaIcon} aria-hidden="true">&#9201;</span>
              {formatRuntime(winner.runtime)}
            </div>
          )}
          {winner.mediaType === 'tv' &&
            (winner.numberOfSeasons != null || winner.numberOfEpisodes != null) && (
              <div className={styles.meta}>
                <span className={styles.metaIcon} aria-hidden="true">&#128250;</span>
                {winner.numberOfSeasons != null && (
                  <span>{winner.numberOfSeasons} Season{winner.numberOfSeasons !== 1 ? 's' : ''}</span>
                )}
                {winner.numberOfSeasons != null && winner.numberOfEpisodes != null && (
                  <span>&middot;</span>
                )}
                {winner.numberOfEpisodes != null && (
                  <span>{winner.numberOfEpisodes} Episode{winner.numberOfEpisodes !== 1 ? 's' : ''}</span>
                )}
              </div>
            )}

          {/* Cast */}
          {cast.length > 0 && (
            <div className={styles.castSection}>
              <span className={styles.castLabel}>Cast</span>
              <div className={styles.castList}>
                {cast.map((member) => (
                  <div key={member.id} className={styles.castMember}>
                    {member.profilePath ? (
                      <img
                        className={styles.castPhoto}
                        src={`${TMDB_IMAGE_BASE}${PROFILE_SIZE}${member.profilePath}`}
                        alt={member.name}
                        loading="lazy"
                      />
                    ) : (
                      <div className={styles.castPhotoPlaceholder}>
                        <span className={styles.castInitial}>{member.name.charAt(0)}</span>
                      </div>
                    )}
                    <span className={styles.castName}>{member.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Providers */}
          <div className={styles.providersSection}>
            <span className={styles.providersLabel}>Available on</span>
            {providers.length > 0 ? (
              <div className={styles.providersList}>
                {providers.map((provider) => (
                  <img
                    key={provider.providerId}
                    className={styles.providerLogo}
                    src={`${TMDB_IMAGE_BASE}${LOGO_SIZE}${provider.logoPath}`}
                    alt={provider.providerName}
                    title={provider.providerName}
                    loading="lazy"
                  />
                ))}
              </div>
            ) : (
              <span className={styles.providersEmpty}>Streaming info unavailable</span>
            )}
          </div>

          {/* TMDB Link */}
          <a
            className={styles.tmdbLink}
            href={tmdbUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            View on TMDB
            <span className={styles.externalIcon} aria-hidden="true">&#8599;</span>
          </a>

          {/* Buttons */}
          <div className={styles.buttons}>
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
          </div>
        </div>
      </motion.div>

      {/* ---- Bracket View ---- */}
      <AnimatePresence>
        {showBracket && <BracketView key="bracket" />}
      </AnimatePresence>
    </motion.div>
  )
}
