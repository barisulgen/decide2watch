import { createContext, useContext, useReducer, type Dispatch, type ReactNode } from 'react'
import type { BracketState, BracketAction } from '../types'
import { getRoundName } from '../lib/bracket'

const initialState: BracketState = {
  screen: 'setup',
  contentFilter: 'movie',
  bracketSize: 16,
  genreId: null,
  searchQuery: '',
  items: [],
  rounds: [],
  currentRoundIndex: 0,
  currentMatchupIndex: 0,
  error: null,
}

function bracketReducer(state: BracketState, action: BracketAction): BracketState {
  switch (action.type) {
    case 'SET_CONFIG':
      return { ...state, ...action.payload }
    case 'SET_LOADING':
      return { ...state, screen: 'loading', error: null }
    case 'SET_ITEMS':
      return { ...state, items: action.payload }
    case 'START_BRACKET':
      return { ...state, screen: 'matchup', rounds: action.payload, currentRoundIndex: 0, currentMatchupIndex: 0 }
    case 'PICK_WINNER': {
      const rounds = structuredClone(state.rounds)
      const currentRound = rounds[state.currentRoundIndex]
      currentRound.matchups[state.currentMatchupIndex].winner = action.payload

      const isRoundComplete = state.currentMatchupIndex + 1 >= currentRound.matchups.length
      const totalRounds = Math.log2(state.bracketSize)
      const isFinal = state.currentRoundIndex + 1 >= totalRounds && isRoundComplete

      if (isFinal) {
        return { ...state, rounds, screen: 'winner' }
      }

      if (isRoundComplete) {
        const winners = currentRound.matchups.map(m => m.winner!)
        const nextMatchups = []
        for (let i = 0; i < winners.length; i += 2) {
          nextMatchups.push({ a: winners[i], b: winners[i + 1], winner: null })
        }
        rounds.push({
          name: getRoundName(state.currentRoundIndex + 1, totalRounds),
          matchups: nextMatchups,
        })
        return { ...state, rounds, currentRoundIndex: state.currentRoundIndex + 1, currentMatchupIndex: 0 }
      }

      return { ...state, rounds, currentMatchupIndex: state.currentMatchupIndex + 1 }
    }
    case 'SET_ERROR':
      return { ...state, screen: 'setup', error: action.payload }
    case 'RESET':
      return initialState
    default:
      return state
  }
}

const BracketContext = createContext<BracketState>(initialState)
const BracketDispatchContext = createContext<Dispatch<BracketAction>>(() => {})

export function BracketProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(bracketReducer, initialState)
  return (
    <BracketContext.Provider value={state}>
      <BracketDispatchContext.Provider value={dispatch}>
        {children}
      </BracketDispatchContext.Provider>
    </BracketContext.Provider>
  )
}

export function useBracket() {
  return useContext(BracketContext)
}

export function useBracketDispatch() {
  return useContext(BracketDispatchContext)
}
