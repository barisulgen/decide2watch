import type { MediaItem, BracketRound, Matchup } from '../types'

export function shuffleArray<T>(array: T[]): T[] {
  const copy = [...array]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export function getRoundName(roundIndex: number, totalRounds: number): string {
  const roundsFromEnd = totalRounds - roundIndex
  switch (roundsFromEnd) {
    case 1: return 'Final'
    case 2: return 'Semifinals'
    case 3: return 'Quarterfinals'
    default: {
      const count = Math.pow(2, roundsFromEnd)
      return `Round of ${count}`
    }
  }
}

export function buildBracket(items: MediaItem[]): BracketRound[] {
  const totalRounds = Math.log2(items.length)
  const matchups: Matchup[] = []

  for (let i = 0; i < items.length; i += 2) {
    matchups.push({
      a: items[i],
      b: items[i + 1],
      winner: null,
    })
  }

  return [{
    name: getRoundName(0, totalRounds),
    matchups,
  }]
}

export function advanceBracket(rounds: BracketRound[], totalRounds: number): BracketRound[] {
  const currentRound = rounds[rounds.length - 1]
  const allDecided = currentRound.matchups.every(m => m.winner !== null)

  if (!allDecided) return rounds
  if (rounds.length >= totalRounds) return rounds

  const winners = currentRound.matchups.map(m => m.winner!)
  const nextMatchups: Matchup[] = []

  for (let i = 0; i < winners.length; i += 2) {
    nextMatchups.push({
      a: winners[i],
      b: winners[i + 1],
      winner: null,
    })
  }

  const nextRound: BracketRound = {
    name: getRoundName(rounds.length, totalRounds),
    matchups: nextMatchups,
  }

  return [...rounds, nextRound]
}

export function isTournamentComplete(rounds: BracketRound[], totalRounds: number): boolean {
  return rounds.length === totalRounds &&
    rounds[rounds.length - 1].matchups[0].winner !== null
}

export function getWinner(rounds: BracketRound[]): MediaItem | null {
  const finalRound = rounds[rounds.length - 1]
  if (finalRound.matchups.length !== 1) return null
  return finalRound.matchups[0].winner
}
