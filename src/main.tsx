import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BracketProvider } from './context/BracketContext'
import App from './App'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BracketProvider>
      <App />
    </BracketProvider>
  </StrictMode>,
)
