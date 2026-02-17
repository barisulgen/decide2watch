import { motion } from 'framer-motion'

export function MatchupScreen() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <p>Matchup Screen</p>
    </motion.div>
  )
}
