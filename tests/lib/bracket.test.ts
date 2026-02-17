import { describe, it, expect } from 'vitest'
import { shuffleArray, buildBracket, getRoundName, advanceBracket } from '../../src/lib/bracket'
import type { MediaItem, BracketRound } from '../../src/types'

function makeItem(id: number): MediaItem {
  return {
    id,
    mediaType: 'movie',
    title: `Movie ${id}`,
    posterPath: null,
    backdropPath: null,
    overview: '',
    voteAverage: 7,
    voteCount: 100,
    genreIds: [],
    genres: [],
    releaseDate: '2024-01-01',
    popularity: 100,
    runtime: 120,
    numberOfSeasons: null,
    numberOfEpisodes: null,
    tagline: null,
    cast: [],
    watchProviders: [],
  }
}

describe('shuffleArray', () => {
  it('returns array of same length', () => {
    const arr = [1, 2, 3, 4, 5]
    const result = shuffleArray(arr)
    expect(result).toHaveLength(5)
  })

  it('contains all original elements', () => {
    const arr = [1, 2, 3, 4, 5]
    const result = shuffleArray(arr)
    expect(result.sort()).toEqual([1, 2, 3, 4, 5])
  })

  it('does not mutate the original array', () => {
    const arr = [1, 2, 3, 4, 5]
    const copy = [...arr]
    shuffleArray(arr)
    expect(arr).toEqual(copy)
  })
})

describe('getRoundName', () => {
  it('names rounds correctly for 8-bracket', () => {
    expect(getRoundName(0, 3)).toBe('Quarterfinals')
    expect(getRoundName(1, 3)).toBe('Semifinals')
    expect(getRoundName(2, 3)).toBe('Final')
  })

  it('names rounds correctly for 16-bracket', () => {
    expect(getRoundName(0, 4)).toBe('Round of 16')
    expect(getRoundName(1, 4)).toBe('Quarterfinals')
    expect(getRoundName(2, 4)).toBe('Semifinals')
    expect(getRoundName(3, 4)).toBe('Final')
  })

  it('names rounds correctly for 32-bracket', () => {
    expect(getRoundName(0, 5)).toBe('Round of 32')
    expect(getRoundName(1, 5)).toBe('Round of 16')
    expect(getRoundName(2, 5)).toBe('Quarterfinals')
    expect(getRoundName(3, 5)).toBe('Semifinals')
    expect(getRoundName(4, 5)).toBe('Final')
  })
})

describe('buildBracket', () => {
  it('creates first round with correct number of matchups', () => {
    const items = Array.from({ length: 8 }, (_, i) => makeItem(i))
    const rounds = buildBracket(items)
    expect(rounds).toHaveLength(1)
    expect(rounds[0].matchups).toHaveLength(4)
  })

  it('pairs items into matchups with no winner yet', () => {
    const items = Array.from({ length: 8 }, (_, i) => makeItem(i))
    const rounds = buildBracket(items)
    for (const matchup of rounds[0].matchups) {
      expect(matchup.a).toBeDefined()
      expect(matchup.b).toBeDefined()
      expect(matchup.winner).toBeNull()
    }
  })

  it('names the first round correctly', () => {
    const items8 = Array.from({ length: 8 }, (_, i) => makeItem(i))
    expect(buildBracket(items8)[0].name).toBe('Quarterfinals')

    const items16 = Array.from({ length: 16 }, (_, i) => makeItem(i))
    expect(buildBracket(items16)[0].name).toBe('Round of 16')
  })
})

describe('advanceBracket', () => {
  it('creates next round when all matchups in current round are decided', () => {
    const items = Array.from({ length: 8 }, (_, i) => makeItem(i))
    const rounds = buildBracket(items)

    rounds[0].matchups[0].winner = rounds[0].matchups[0].a
    rounds[0].matchups[1].winner = rounds[0].matchups[1].b
    rounds[0].matchups[2].winner = rounds[0].matchups[2].a
    rounds[0].matchups[3].winner = rounds[0].matchups[3].b

    const totalRounds = Math.log2(8)
    const newRounds = advanceBracket(rounds, totalRounds)
    expect(newRounds).toHaveLength(2)
    expect(newRounds[1].matchups).toHaveLength(2)
    expect(newRounds[1].name).toBe('Semifinals')
  })

  it('detects tournament completion', () => {
    const items = Array.from({ length: 4 }, (_, i) => makeItem(i))
    const rounds = buildBracket(items)

    rounds[0].matchups[0].winner = rounds[0].matchups[0].a
    rounds[0].matchups[1].winner = rounds[0].matchups[1].a

    const totalRounds = Math.log2(4)
    let newRounds = advanceBracket(rounds, totalRounds)
    expect(newRounds).toHaveLength(2)
    expect(newRounds[1].matchups).toHaveLength(1)
    expect(newRounds[1].name).toBe('Final')

    newRounds[1].matchups[0].winner = newRounds[1].matchups[0].a
    newRounds = advanceBracket(newRounds, totalRounds)
    expect(newRounds).toHaveLength(2)
  })
})
