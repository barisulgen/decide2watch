import { motion } from 'framer-motion'
import styles from './LoadingScreen.module.css'

export function LoadingScreen() {
  return (
    <motion.div
      className={styles.container}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      {/* Film reel icon - CSS-only animated element */}
      <div className={styles.reelWrapper}>
        <div className={styles.reel}>
          <div className={styles.reelHole} />
          <div className={styles.reelHole} />
          <div className={styles.reelHole} />
          <div className={styles.reelHole} />
          <div className={styles.reelHole} />
          <div className={styles.reelHole} />
          <div className={styles.reelCenter} />
        </div>
        <div className={styles.glowRing} />
      </div>

      <h2 className={styles.title}>Building your bracket...</h2>
      <p className={styles.subtitle}>Fetching movies & crunching ratings</p>

      {/* Indeterminate progress bar */}
      <div className={styles.progressTrack}>
        <div className={styles.progressBar} />
      </div>

      {/* Film strip decorative element */}
      <div className={styles.filmStrip}>
        <div className={styles.filmFrames}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className={styles.filmFrame} />
          ))}
        </div>
      </div>
    </motion.div>
  )
}
