import { motion } from 'framer-motion'

export function WinnerScreen() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <p>Winner Screen</p>
    </motion.div>
  )
}
