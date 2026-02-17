import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useBracket, useBracketDispatch } from '../../context/BracketContext'
import { fetchTrending, fetchByGenre, fetchBySearch, enrichAll, isApiKeySet } from '../../services/tmdb'
import { shuffleArray, buildBracket } from '../../lib/bracket'
import { GENRE_OPTIONS } from '../../constants/genres'
import type { ContentFilter, BracketSize, MediaItem } from '../../types'
import styles from './SetupScreen.module.css'

const CONTENT_OPTIONS: { value: ContentFilter; label: string }[] = [
  { value: 'movie', label: 'Movies' },
  { value: 'tv', label: 'TV Shows' },
  { value: 'both', label: 'Both' },
]

const SIZE_OPTIONS: { value: BracketSize; label: string; sub: string }[] = [
  { value: 8, label: '8', sub: 'Quick \u00b7 3 rounds' },
  { value: 16, label: '16', sub: 'Classic \u00b7 4 rounds' },
  { value: 32, label: '32', sub: 'Epic \u00b7 5 rounds' },
]

export function SetupScreen() {
  const state = useBracket()
  const dispatch = useBracketDispatch()

  const [contentFilter, setContentFilter] = useState<ContentFilter>('movie')
  const [bracketSize, setBracketSize] = useState<BracketSize>(16)
  const [genreId, setGenreId] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Compute the index for the active segment pill position
  const contentIndex = CONTENT_OPTIONS.findIndex(o => o.value === contentFilter)

  function handleGenreChange(value: string) {
    const id = value ? Number(value) : null
    setGenreId(id)
    if (id !== null) {
      setSearchQuery('')
    }
  }

  function handleSearchChange(value: string) {
    setSearchQuery(value)
    if (value.trim()) {
      setGenreId(null)
    }
  }

  async function handleStart() {
    setIsSubmitting(true)

    dispatch({ type: 'SET_CONFIG', payload: { contentFilter, bracketSize, genreId, searchQuery } })
    dispatch({ type: 'SET_LOADING' })

    try {
      let items: MediaItem[]
      if (searchQuery.trim()) {
        items = await fetchBySearch(searchQuery, contentFilter, bracketSize)
      } else if (genreId) {
        items = await fetchByGenre(contentFilter, genreId, bracketSize)
      } else {
        items = await fetchTrending(contentFilter, bracketSize)
      }

      if (items.length < bracketSize) {
        dispatch({
          type: 'SET_ERROR',
          payload: `Not enough results (found ${items.length}, need ${bracketSize}). Try a different search, broader genre, or smaller bracket size.`,
        })
        setIsSubmitting(false)
        return
      }

      const shuffled = shuffleArray(items.slice(0, bracketSize))
      const enriched = await enrichAll(shuffled)
      const rounds = buildBracket(enriched)
      dispatch({ type: 'START_BRACKET', payload: rounds })
    } catch (err) {
      dispatch({
        type: 'SET_ERROR',
        payload: err instanceof Error ? err.message : 'Failed to fetch data from TMDB.',
      })
      setIsSubmitting(false)
    }
  }

  // If API key is not configured, show a setup message
  if (!isApiKeySet()) {
    return (
      <motion.div
        className={styles.wrapper}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -16 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className={styles.card}>
          <div className={styles.apiKeyMissing}>
            <h2>API Key Required</h2>
            <p>
              To get started, you need a free TMDB API key.
              <br /><br />
              1. Create an account at{' '}
              <a href="https://www.themoviedb.org/signup" target="_blank" rel="noopener noreferrer">
                themoviedb.org
              </a>
              <br />
              2. Go to{' '}
              <a href="https://www.themoviedb.org/settings/api" target="_blank" rel="noopener noreferrer">
                Settings &rarr; API
              </a>
              {' '}and copy your API key
              <br />
              3. Create a <code>.env</code> file in the project root:
              <br /><br />
              <code>VITE_TMDB_API_KEY=your_key_here</code>
              <br /><br />
              4. Restart the dev server.
            </p>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      className={styles.wrapper}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className={styles.card}>
        <h2 className={styles.title}>Build Your Bracket</h2>
        <p className={styles.subtitle}>Pick your preferences and let the showdown begin</p>

        {/* Content Type Toggle */}
        <div className={styles.section}>
          <span className={styles.label}>Content Type</span>
          <div className={styles.segmented}>
            {/* Animated pill */}
            <motion.div
              className={styles.segmentPill}
              layout
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              style={{
                left: `calc(${(contentIndex / CONTENT_OPTIONS.length) * 100}% + 4px)`,
                width: `calc(${100 / CONTENT_OPTIONS.length}% - 4px)`,
              }}
            />
            {CONTENT_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`${styles.segmentBtn} ${contentFilter === option.value ? styles.segmentBtnActive : ''}`}
                onClick={() => setContentFilter(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Bracket Size */}
        <div className={styles.section}>
          <span className={styles.label}>Bracket Size</span>
          <div className={styles.sizeGroup}>
            {SIZE_OPTIONS.map((option) => (
              <motion.button
                key={option.value}
                type="button"
                className={`${styles.sizeBtn} ${bracketSize === option.value ? styles.sizeBtnActive : ''}`}
                onClick={() => setBracketSize(option.value)}
                whileTap={{ scale: 0.96 }}
              >
                {option.label}
                <span className={styles.sizeSub}>{option.sub}</span>
              </motion.button>
            ))}
          </div>
        </div>

        <div className={styles.divider}>or narrow it down</div>

        {/* Genre Dropdown */}
        <div className={styles.section}>
          <span className={styles.label}>Genre</span>
          <select
            className={styles.select}
            value={genreId ?? ''}
            onChange={(e) => handleGenreChange(e.target.value)}
            disabled={searchQuery.trim().length > 0}
          >
            <option value="">All Genres</option>
            {GENRE_OPTIONS.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>

        {/* Search Input */}
        <div className={styles.section}>
          <span className={styles.label}>Search</span>
          <input
            type="text"
            className={styles.input}
            placeholder="Search for a title, actor, keyword..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            disabled={genreId !== null}
          />
          {(genreId !== null || searchQuery.trim().length > 0) && (
            <p className={styles.mutualHint}>
              {genreId !== null
                ? 'Clear genre to enable search'
                : 'Clear search to enable genre filter'}
            </p>
          )}
        </div>

        {/* Error Display */}
        <AnimatePresence>
          {state.error && (
            <motion.div
              className={styles.error}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
            >
              {state.error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Start Button */}
        <motion.button
          type="button"
          className={styles.startBtn}
          onClick={handleStart}
          disabled={isSubmitting}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {isSubmitting ? 'Loading...' : 'Start Bracket'}
        </motion.button>
      </div>
    </motion.div>
  )
}
