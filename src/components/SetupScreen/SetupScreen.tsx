import { motion } from 'framer-motion'

export function SetupScreen() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <p>Setup Screen</p>
    </motion.div>
  )
}
