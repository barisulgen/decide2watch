# decide2watch Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a tournament bracket web app that helps users decide what to watch by pitting movies/TV shows against each other in elimination rounds, pulling data from TMDB.

**Architecture:** Client-side React SPA. Bracket state managed via `useReducer` + React Context. TMDB API called directly from the client with an API key injected at build time. Framer Motion for polished cinematic transitions.

**Tech Stack:** React 18, TypeScript, Vite, Framer Motion, CSS Modules, Vitest + React Testing Library

---

## File Structure

```
src/
  types/
    index.ts                  — shared TypeScript types
  constants/
    genres.ts                 — TMDB genre ID → name maps
  services/
    tmdb.ts                   — all TMDB API calls
  lib/
    bracket.ts                — pure bracket logic (shuffle, build, advance)
  context/
    BracketContext.tsx         — useReducer + context provider
  components/
    SetupScreen/
      SetupScreen.tsx
      SetupScreen.module.css
    MovieCard/
      MovieCard.tsx
      MovieCard.module.css
    MatchupScreen/
      MatchupScreen.tsx
      MatchupScreen.module.css
    WinnerScreen/
      WinnerScreen.tsx
      WinnerScreen.module.css
    BracketView/
      BracketView.tsx
      BracketView.module.css
    ProgressBar/
      ProgressBar.tsx
      ProgressBar.module.css
  App.tsx
  App.module.css
  main.tsx
  index.css                   — CSS variables, resets, dark theme
tests/
  lib/
    bracket.test.ts
  services/
    tmdb.test.ts
```

---

### Task 1: Project Scaffolding

**Files:**
- Create: entire project via `npm create vite`
- Create: `.env.example`
- Modify: `vite.config.ts`, `tsconfig.json`, `package.json`

**Step 1: Scaffold Vite project**

```bash
cd c:/Users/PC/Documents/REPOS/PERSONAL/decide2watch
npm create vite@latest . -- --template react-ts
```

Select: React, TypeScript

**Step 2: Install dependencies**

```bash
npm install framer-motion
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

**Step 3: Configure Vitest**

Add to `vite.config.ts`:

```ts
/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test-setup.ts',
  },
})
```

Create `src/test-setup.ts`:

```ts
import '@testing-library/jest-dom'
```

Add to `tsconfig.app.json` compilerOptions:

```json
"types": ["vitest/globals"]
```

**Step 4: Create `.env.example`**

```
VITE_TMDB_API_KEY=your_tmdb_api_key_here
```

Add `.env` to `.gitignore` (should already be there from Vite template, verify).

**Step 5: Clean up Vite boilerplate**

- Delete `src/App.css` contents (will replace)
- Delete `src/assets/` folder
- Replace `src/App.tsx` with a minimal placeholder:

```tsx
function App() {
  return <div>decide2watch</div>
}
export default App
```

- Clear `src/index.css` contents (will replace in Task 7)

**Step 6: Verify everything works**

```bash
npm run dev
npm run build
npx vitest run
```

**Step 7: Commit**

```bash
git add -A
git commit -m "chore: scaffold Vite React TypeScript project with dependencies"
```

---

### Task 2: Types & Constants

**Files:**
- Create: `src/types/index.ts`
- Create: `src/constants/genres.ts`

**Step 1: Define TypeScript types**

```ts
// src/types/index.ts

export type MediaType = 'movie' | 'tv'
export type ContentFilter = 'movie' | 'tv' | 'both'
export type BracketSize = 8 | 16 | 32

export interface MediaItem {
  id: number
  mediaType: MediaType
  title: string           // movie.title or tv.name
  posterPath: string | null
  backdropPath: string | null
  overview: string
  voteAverage: number
  voteCount: number
  genreIds: number[]
  genres: string[]         // resolved genre names
  releaseDate: string      // movie.release_date or tv.first_air_date
  popularity: number
  // enriched fields (filled after detail fetch)
  runtime: number | null           // minutes for movies
  numberOfSeasons: number | null   // for TV
  numberOfEpisodes: number | null  // for TV
  tagline: string | null
  cast: CastMember[]
  watchProviders: WatchProvider[]
}

export interface CastMember {
  id: number
  name: string
  character: string
  profilePath: string | null
}

export interface WatchProvider {
  providerId: number
  providerName: string
  logoPath: string
  type: 'flatrate' | 'rent' | 'buy' | 'free'
}

export interface Matchup {
  a: MediaItem
  b: MediaItem
  winner: MediaItem | null
}

export interface BracketRound {
  name: string           // "Round of 16", "Quarterfinals", etc.
  matchups: Matchup[]
}

export type AppScreen = 'setup' | 'loading' | 'matchup' | 'winner'

export interface BracketState {
  screen: AppScreen
  contentFilter: ContentFilter
  bracketSize: BracketSize
  genreId: number | null
  searchQuery: string
  items: MediaItem[]
  rounds: BracketRound[]
  currentRoundIndex: number
  currentMatchupIndex: number
  error: string | null
}

export type BracketAction =
  | { type: 'SET_CONFIG'; payload: { contentFilter: ContentFilter; bracketSize: BracketSize; genreId: number | null; searchQuery: string } }
  | { type: 'SET_LOADING' }
  | { type: 'SET_ITEMS'; payload: MediaItem[] }
  | { type: 'START_BRACKET'; payload: BracketRound[] }
  | { type: 'PICK_WINNER'; payload: MediaItem }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'RESET' }
```

**Step 2: Define genre maps**

```ts
// src/constants/genres.ts

// TMDB genre IDs → names (movies)
export const MOVIE_GENRES: Record<number, string> = {
  28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy',
  80: 'Crime', 99: 'Documentary', 18: 'Drama', 10751: 'Family',
  14: 'Fantasy', 36: 'History', 27: 'Horror', 10402: 'Music',
  9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi', 10770: 'TV Movie',
  53: 'Thriller', 10752: 'War', 37: 'Western',
}

// TMDB genre IDs → names (TV)
export const TV_GENRES: Record<number, string> = {
  10759: 'Action & Adventure', 16: 'Animation', 35: 'Comedy', 80: 'Crime',
  99: 'Documentary', 18: 'Drama', 10751: 'Family', 10762: 'Kids',
  9648: 'Mystery', 10763: 'News', 10764: 'Reality', 10765: 'Sci-Fi & Fantasy',
  10766: 'Soap', 10767: 'Talk', 10768: 'War & Politics', 37: 'Western',
}

// Combined for when we don't know media type yet
export const ALL_GENRES: Record<number, string> = { ...MOVIE_GENRES, ...TV_GENRES }

// Genre options for the setup screen filter (combined, deduplicated)
export const GENRE_OPTIONS = [
  { id: 28, name: 'Action' },
  { id: 12, name: 'Adventure' },
  { id: 16, name: 'Animation' },
  { id: 35, name: 'Comedy' },
  { id: 80, name: 'Crime' },
  { id: 99, name: 'Documentary' },
  { id: 18, name: 'Drama' },
  { id: 10751, name: 'Family' },
  { id: 14, name: 'Fantasy' },
  { id: 36, name: 'History' },
  { id: 27, name: 'Horror' },
  { id: 9648, name: 'Mystery' },
  { id: 10749, name: 'Romance' },
  { id: 878, name: 'Sci-Fi' },
  { id: 53, name: 'Thriller' },
  { id: 10752, name: 'War' },
  { id: 37, name: 'Western' },
]

export const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p'
export const POSTER_SIZE = '/w500'
export const BACKDROP_SIZE = '/w1280'
export const PROFILE_SIZE = '/w185'
export const LOGO_SIZE = '/w92'
```

**Step 3: Commit**

```bash
git add src/types/index.ts src/constants/genres.ts
git commit -m "feat: add TypeScript types and TMDB genre constants"
```

---

### Task 3: Bracket Engine (TDD)

**Files:**
- Create: `src/lib/bracket.ts`
- Create: `tests/lib/bracket.test.ts`

**Step 1: Write failing tests**

```ts
// tests/lib/bracket.test.ts
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
    expect(rounds).toHaveLength(1) // only first round is pre-built
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

    // Decide all 4 matchups in quarterfinals
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
    const rounds = buildBracket(items) // Semifinals

    rounds[0].matchups[0].winner = rounds[0].matchups[0].a
    rounds[0].matchups[1].winner = rounds[0].matchups[1].a

    const totalRounds = Math.log2(4)
    let newRounds = advanceBracket(rounds, totalRounds)
    // Final round
    expect(newRounds).toHaveLength(2)
    expect(newRounds[1].matchups).toHaveLength(1)
    expect(newRounds[1].name).toBe('Final')

    // Decide the final
    newRounds[1].matchups[0].winner = newRounds[1].matchups[0].a
    newRounds = advanceBracket(newRounds, totalRounds)
    // No new round added — tournament is over
    expect(newRounds).toHaveLength(2)
  })
})
```

**Step 2: Run tests to verify they fail**

```bash
npx vitest run tests/lib/bracket.test.ts
```

Expected: FAIL — module `../../src/lib/bracket` not found.

**Step 3: Implement bracket engine**

```ts
// src/lib/bracket.ts
import type { MediaItem, BracketRound, Matchup } from '../types'

/**
 * Fisher-Yates shuffle. Returns a new array.
 */
export function shuffleArray<T>(array: T[]): T[] {
  const copy = [...array]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

/**
 * Get a human-readable round name based on round index and total rounds.
 */
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

/**
 * Build the initial bracket from a shuffled list of items.
 * Only creates the first round — subsequent rounds are built as winners are decided.
 */
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

/**
 * If the current (last) round is fully decided, build and append the next round.
 * Returns a new rounds array (immutable).
 */
export function advanceBracket(rounds: BracketRound[], totalRounds: number): BracketRound[] {
  const currentRound = rounds[rounds.length - 1]
  const allDecided = currentRound.matchups.every(m => m.winner !== null)

  if (!allDecided) return rounds
  if (rounds.length >= totalRounds) return rounds // tournament is over

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

/**
 * Check if the tournament is complete (final match decided).
 */
export function isTournamentComplete(rounds: BracketRound[], totalRounds: number): boolean {
  return rounds.length === totalRounds &&
    rounds[rounds.length - 1].matchups[0].winner !== null
}

/**
 * Get the tournament winner.
 */
export function getWinner(rounds: BracketRound[]): MediaItem | null {
  const finalRound = rounds[rounds.length - 1]
  if (finalRound.matchups.length !== 1) return null
  return finalRound.matchups[0].winner
}
```

**Step 4: Run tests to verify they pass**

```bash
npx vitest run tests/lib/bracket.test.ts
```

Expected: all tests PASS.

**Step 5: Commit**

```bash
git add src/lib/bracket.ts tests/lib/bracket.test.ts
git commit -m "feat: implement bracket engine with shuffle, build, and advance logic"
```

---

### Task 4: TMDB API Service

**Files:**
- Create: `src/services/tmdb.ts`

**Step 1: Implement TMDB service**

```ts
// src/services/tmdb.ts
import type { MediaItem, MediaType, ContentFilter, CastMember, WatchProvider } from '../types'
import { ALL_GENRES } from '../constants/genres'

const API_KEY = import.meta.env.VITE_TMDB_API_KEY as string
const BASE_URL = 'https://api.themoviedb.org/3'

async function tmdbFetch<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${BASE_URL}${path}`)
  url.searchParams.set('api_key', API_KEY)
  url.searchParams.set('language', 'en-US')
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value)
  }

  const response = await fetch(url.toString())
  if (!response.ok) {
    throw new Error(`TMDB API error: ${response.status} ${response.statusText}`)
  }
  return response.json()
}

interface TmdbListResponse {
  page: number
  results: TmdbRawItem[]
  total_pages: number
  total_results: number
}

interface TmdbRawItem {
  id: number
  media_type?: string
  title?: string        // movie
  name?: string         // tv
  poster_path: string | null
  backdrop_path: string | null
  overview: string
  vote_average: number
  vote_count: number
  genre_ids: number[]
  release_date?: string  // movie
  first_air_date?: string // tv
  popularity: number
}

function resolveGenreNames(genreIds: number[]): string[] {
  return genreIds.map(id => ALL_GENRES[id]).filter(Boolean)
}

function mapRawItem(raw: TmdbRawItem, forcedType?: MediaType): MediaItem {
  const mediaType: MediaType = (forcedType ?? raw.media_type ?? 'movie') as MediaType
  return {
    id: raw.id,
    mediaType,
    title: mediaType === 'movie' ? (raw.title ?? 'Unknown') : (raw.name ?? 'Unknown'),
    posterPath: raw.poster_path,
    backdropPath: raw.backdrop_path,
    overview: raw.overview || 'No synopsis available.',
    voteAverage: raw.vote_average,
    voteCount: raw.vote_count,
    genreIds: raw.genre_ids,
    genres: resolveGenreNames(raw.genre_ids),
    releaseDate: (mediaType === 'movie' ? raw.release_date : raw.first_air_date) ?? '',
    popularity: raw.popularity,
    // enriched later
    runtime: null,
    numberOfSeasons: null,
    numberOfEpisodes: null,
    tagline: null,
    cast: [],
    watchProviders: [],
  }
}

/**
 * Fetch trending items. For 'both', uses /trending/all/week.
 * For movie or tv specifically, uses /trending/{type}/week.
 */
export async function fetchTrending(filter: ContentFilter, count: number): Promise<MediaItem[]> {
  const items: MediaItem[] = []

  if (filter === 'both') {
    // Fetch enough pages to get count items (each page has 20)
    const pages = Math.ceil(count / 20)
    for (let page = 1; page <= pages && items.length < count; page++) {
      const data = await tmdbFetch<TmdbListResponse>('/trending/all/week', { page: String(page) })
      const filtered = data.results.filter(r => r.media_type === 'movie' || r.media_type === 'tv')
      items.push(...filtered.map(r => mapRawItem(r)))
    }
  } else {
    const pages = Math.ceil(count / 20)
    for (let page = 1; page <= pages && items.length < count; page++) {
      const data = await tmdbFetch<TmdbListResponse>(`/trending/${filter}/week`, { page: String(page) })
      items.push(...data.results.map(r => mapRawItem(r, filter)))
    }
  }

  return items.slice(0, count)
}

/**
 * Discover items by genre.
 */
export async function fetchByGenre(filter: ContentFilter, genreId: number, count: number): Promise<MediaItem[]> {
  const items: MediaItem[] = []
  const types: MediaType[] = filter === 'both' ? ['movie', 'tv'] : [filter as MediaType]

  for (const type of types) {
    const pages = Math.ceil(count / 20)
    for (let page = 1; page <= pages && items.length < count; page++) {
      const data = await tmdbFetch<TmdbListResponse>(`/discover/${type}`, {
        with_genres: String(genreId),
        sort_by: 'popularity.desc',
        page: String(page),
      })
      items.push(...data.results.map(r => mapRawItem(r, type)))
    }
  }

  return items.slice(0, count)
}

/**
 * Search for items by query string.
 */
export async function fetchBySearch(query: string, filter: ContentFilter, count: number): Promise<MediaItem[]> {
  const items: MediaItem[] = []
  const pages = Math.ceil(count / 20)

  for (let page = 1; page <= pages && items.length < count; page++) {
    const data = await tmdbFetch<TmdbListResponse>('/search/multi', {
      query,
      page: String(page),
    })
    const filtered = data.results.filter(r => {
      const type = r.media_type
      if (filter === 'both') return type === 'movie' || type === 'tv'
      return type === filter
    })
    items.push(...filtered.map(r => mapRawItem(r)))
  }

  return items.slice(0, count)
}

/**
 * Enrich a single item with details (runtime/seasons, cast, watch providers).
 * Uses append_to_response to batch into a single API call.
 */
export async function enrichItem(item: MediaItem): Promise<MediaItem> {
  const type = item.mediaType
  const path = type === 'movie' ? `/movie/${item.id}` : `/tv/${item.id}`

  const data = await tmdbFetch<any>(path, {
    append_to_response: 'credits,watch/providers',
  })

  const cast: CastMember[] = (data.credits?.cast ?? [])
    .slice(0, 5)
    .map((c: any) => ({
      id: c.id,
      name: c.name,
      character: c.character ?? c.roles?.[0]?.character ?? '',
      profilePath: c.profile_path,
    }))

  // Watch providers — use US region, fall back to first available
  const providerData = data['watch/providers']?.results?.US ??
                       data['watch/providers']?.results?.[Object.keys(data['watch/providers']?.results ?? {})[0]]
  const watchProviders: WatchProvider[] = []

  for (const provType of ['flatrate', 'rent', 'buy', 'free'] as const) {
    for (const p of (providerData?.[provType] ?? [])) {
      watchProviders.push({
        providerId: p.provider_id,
        providerName: p.provider_name,
        logoPath: p.logo_path,
        type: provType,
      })
    }
  }

  // Deduplicate providers by ID (same provider can appear in multiple types)
  const seen = new Set<number>()
  const uniqueProviders = watchProviders.filter(p => {
    if (seen.has(p.providerId)) return false
    seen.add(p.providerId)
    return true
  })

  const genres: string[] = (data.genres ?? []).map((g: any) => g.name)

  return {
    ...item,
    runtime: type === 'movie' ? (data.runtime ?? null) : null,
    numberOfSeasons: type === 'tv' ? (data.number_of_seasons ?? null) : null,
    numberOfEpisodes: type === 'tv' ? (data.number_of_episodes ?? null) : null,
    tagline: data.tagline || null,
    genres: genres.length > 0 ? genres : item.genres,
    cast,
    watchProviders: uniqueProviders,
  }
}

/**
 * Enrich all items, staggering requests to avoid rate limits.
 * Calls onProgress with percentage after each item completes.
 */
export async function enrichAll(
  items: MediaItem[],
  onProgress?: (percent: number) => void
): Promise<MediaItem[]> {
  const enriched: MediaItem[] = []
  // Process in batches of 5 to avoid rate limiting
  const batchSize = 5

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize)
    const results = await Promise.all(batch.map(item => enrichItem(item)))
    enriched.push(...results)
    onProgress?.(Math.round((enriched.length / items.length) * 100))
  }

  return enriched
}

/**
 * Check if the API key is configured.
 */
export function isApiKeySet(): boolean {
  return Boolean(API_KEY && API_KEY !== 'your_tmdb_api_key_here')
}
```

**Step 2: Commit**

```bash
git add src/services/tmdb.ts
git commit -m "feat: implement TMDB API service with fetch, discover, search, and enrichment"
```

---

### Task 5: Bracket Context & State Management

**Files:**
- Create: `src/context/BracketContext.tsx`

**Step 1: Implement reducer and context**

```tsx
// src/context/BracketContext.tsx
import { createContext, useContext, useReducer, type Dispatch, type ReactNode } from 'react'
import type { BracketState, BracketAction } from '../types'

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
      return {
        ...state,
        ...action.payload,
      }
    case 'SET_LOADING':
      return {
        ...state,
        screen: 'loading',
        error: null,
      }
    case 'SET_ITEMS':
      return {
        ...state,
        items: action.payload,
      }
    case 'START_BRACKET':
      return {
        ...state,
        screen: 'matchup',
        rounds: action.payload,
        currentRoundIndex: 0,
        currentMatchupIndex: 0,
      }
    case 'PICK_WINNER': {
      const rounds = structuredClone(state.rounds)
      const currentRound = rounds[state.currentRoundIndex]
      currentRound.matchups[state.currentMatchupIndex].winner = action.payload

      const isRoundComplete = state.currentMatchupIndex + 1 >= currentRound.matchups.length
      const totalRounds = Math.log2(state.bracketSize)
      const isFinal = state.currentRoundIndex + 1 >= totalRounds && isRoundComplete

      if (isFinal) {
        return {
          ...state,
          rounds,
          screen: 'winner',
        }
      }

      if (isRoundComplete) {
        // Build next round from winners
        const winners = currentRound.matchups.map(m => m.winner!)
        const nextMatchups = []
        for (let i = 0; i < winners.length; i += 2) {
          nextMatchups.push({ a: winners[i], b: winners[i + 1], winner: null })
        }
        const { getRoundName } = require('../lib/bracket')
        rounds.push({
          name: getRoundName(state.currentRoundIndex + 1, totalRounds),
          matchups: nextMatchups,
        })
        return {
          ...state,
          rounds,
          currentRoundIndex: state.currentRoundIndex + 1,
          currentMatchupIndex: 0,
        }
      }

      return {
        ...state,
        rounds,
        currentMatchupIndex: state.currentMatchupIndex + 1,
      }
    }
    case 'SET_ERROR':
      return {
        ...state,
        screen: 'setup',
        error: action.payload,
      }
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
```

**NOTE for implementer:** The `require()` in the reducer is not ideal with ESM. Replace with a direct import at the top of the file:

```ts
import { getRoundName } from '../lib/bracket'
```

**Step 2: Commit**

```bash
git add src/context/BracketContext.tsx
git commit -m "feat: implement bracket state management with useReducer and context"
```

---

### Task 6: Global Styles & Dark Theme

**Files:**
- Modify: `src/index.css`
- Modify: `index.html` (update title)

**Step 1: Write global styles**

```css
/* src/index.css */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

:root {
  /* Colors */
  --bg-primary: #0a0a0f;
  --bg-secondary: #12121a;
  --bg-card: #1a1a2e;
  --bg-card-hover: #22223a;
  --surface: #16213e;
  --border: #2a2a4a;
  --border-glow: #6366f1;

  --text-primary: #e2e8f0;
  --text-secondary: #94a3b8;
  --text-muted: #64748b;

  --accent: #6366f1;
  --accent-hover: #818cf8;
  --accent-glow: rgba(99, 102, 241, 0.4);

  --gold: #fbbf24;
  --gold-glow: rgba(251, 191, 36, 0.4);

  --red: #ef4444;
  --green: #22c55e;

  --rating-high: #22c55e;
  --rating-mid: #fbbf24;
  --rating-low: #ef4444;

  /* Sizing */
  --card-width: 440px;
  --card-radius: 16px;
  --radius-sm: 8px;
  --radius-md: 12px;

  /* Shadows */
  --shadow-card: 0 8px 32px rgba(0, 0, 0, 0.4);
  --shadow-card-hover: 0 16px 48px rgba(0, 0, 0, 0.6);
  --shadow-glow: 0 0 30px var(--accent-glow);
  --shadow-gold: 0 0 40px var(--gold-glow);
}

*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  background: var(--bg-primary);
  color: var(--text-primary);
  min-height: 100vh;
  overflow-x: hidden;
}

/* Scrollbar */
::-webkit-scrollbar {
  width: 8px;
}
::-webkit-scrollbar-track {
  background: var(--bg-secondary);
}
::-webkit-scrollbar-thumb {
  background: var(--border);
  border-radius: 4px;
}
::-webkit-scrollbar-thumb:hover {
  background: var(--text-muted);
}

button {
  cursor: pointer;
  font-family: inherit;
  border: none;
  outline: none;
}

a {
  color: var(--accent);
  text-decoration: none;
}

img {
  display: block;
  max-width: 100%;
}

#root {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
```

**Step 2: Update `index.html` title**

Change `<title>Vite + React + TS</title>` to `<title>decide2watch</title>`.

**Step 3: Commit**

```bash
git add src/index.css index.html
git commit -m "feat: add dark theme global styles and CSS variables"
```

---

### Task 7: App Shell

**Files:**
- Modify: `src/App.tsx`
- Create: `src/App.module.css`
- Modify: `src/main.tsx`

**Step 1: Wire up App with BracketProvider and screen routing**

```tsx
// src/main.tsx
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
```

```tsx
// src/App.tsx
import { useBracket } from './context/BracketContext'
import { SetupScreen } from './components/SetupScreen/SetupScreen'
import { MatchupScreen } from './components/MatchupScreen/MatchupScreen'
import { WinnerScreen } from './components/WinnerScreen/WinnerScreen'
import { LoadingScreen } from './components/LoadingScreen/LoadingScreen'
import { AnimatePresence } from 'framer-motion'
import styles from './App.module.css'

function App() {
  const { screen } = useBracket()

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <h1 className={styles.logo}>decide2watch</h1>
      </header>
      <main className={styles.main}>
        <AnimatePresence mode="wait">
          {screen === 'setup' && <SetupScreen key="setup" />}
          {screen === 'loading' && <LoadingScreen key="loading" />}
          {screen === 'matchup' && <MatchupScreen key="matchup" />}
          {screen === 'winner' && <WinnerScreen key="winner" />}
        </AnimatePresence>
      </main>
    </div>
  )
}

export default App
```

```css
/* src/App.module.css */
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  padding: 1.25rem 2rem;
  text-align: center;
  border-bottom: 1px solid var(--border);
  background: var(--bg-secondary);
}

.logo {
  font-size: 1.5rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  background: linear-gradient(135deg, var(--accent), var(--gold));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.main {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}
```

**Step 2: Create placeholder components** so the app compiles (each will be built out in subsequent tasks):

Create stub files for: `SetupScreen`, `LoadingScreen`, `MatchupScreen`, `WinnerScreen` — each exporting a simple `<div>` with the screen name. Example:

```tsx
// src/components/SetupScreen/SetupScreen.tsx
import { motion } from 'framer-motion'

export function SetupScreen() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <p>Setup Screen (placeholder)</p>
    </motion.div>
  )
}
```

Create matching stubs for `LoadingScreen/LoadingScreen.tsx`, `MatchupScreen/MatchupScreen.tsx`, `WinnerScreen/WinnerScreen.tsx`.

**Step 3: Verify app builds and renders**

```bash
npm run build
```

**Step 4: Commit**

```bash
git add src/
git commit -m "feat: wire up App shell with screen routing and BracketProvider"
```

---

### Task 8: SetupScreen Component

**Files:**
- Modify: `src/components/SetupScreen/SetupScreen.tsx`
- Create: `src/components/SetupScreen/SetupScreen.module.css`

**Step 1: Build the setup form**

The SetupScreen renders:
- Content type toggle (Movies / TV Shows / Both) — styled as a segmented control
- Bracket size selector (8 / 16 / 32) — styled as button group
- Genre dropdown (optional) — styled select or custom dropdown
- Search input (optional) — text input, clears genre when used and vice versa
- Start button
- Error message display (if `state.error` is set)

On submit, it:
1. Dispatches `SET_CONFIG` with the form values
2. Dispatches `SET_LOADING`
3. Calls the appropriate TMDB fetch function (trending, genre, or search)
4. If results < bracketSize, dispatches `SET_ERROR` with a message
5. Shuffles results, calls `buildBracket`
6. Calls `enrichAll` with progress callback
7. Dispatches `START_BRACKET`

Include full component and CSS implementation with Framer Motion entrance animations for the form elements. The form should feel premium — smooth transitions between states, hover effects on buttons, etc.

Key details for the implementer:
- Use `useBracketDispatch()` for dispatching actions
- Import `fetchTrending`, `fetchByGenre`, `fetchBySearch`, `enrichAll`, `isApiKeySet` from services
- Import `shuffleArray`, `buildBracket` from lib
- Show API key missing error if `!isApiKeySet()` on mount
- Genre selector should only show when search field is empty, and vice versa
- Start button disabled while no valid config

**Step 2: Style it**

Dark card-style form centered on screen, ~500px max-width. Segmented controls for content type and bracket size. Inputs with subtle glow on focus. Big gradient Start button.

**Step 3: Commit**

```bash
git add src/components/SetupScreen/
git commit -m "feat: implement SetupScreen with config form and TMDB fetching"
```

---

### Task 9: LoadingScreen Component

**Files:**
- Create: `src/components/LoadingScreen/LoadingScreen.tsx`
- Create: `src/components/LoadingScreen/LoadingScreen.module.css`

**Step 1: Build loading screen**

Simple centered screen showing:
- A film reel or bracket loading animation (CSS-only animation or Framer Motion)
- "Building your bracket..." text
- Progress percentage (from the `enrichAll` callback)
- The progress bar should animate smoothly

This screen is shown between setup submission and bracket start. The actual loading logic runs in SetupScreen's submit handler — this component just displays status. Pass progress via a simple state lifted to App or via context.

**Alternative simpler approach:** Since the loading happens in SetupScreen's async handler, keep a local `loadingPercent` state in SetupScreen and show the LoadingScreen inline (SetupScreen transitions to loading view internally). This avoids complex state threading. The `screen` state can still be 'loading' for the AnimatePresence transition.

**Step 2: Commit**

```bash
git add src/components/LoadingScreen/
git commit -m "feat: implement LoadingScreen with progress animation"
```

---

### Task 10: MovieCard Component

**Files:**
- Modify: `src/components/MovieCard/MovieCard.tsx`
- Create: `src/components/MovieCard/MovieCard.module.css`

**Step 1: Build the card**

The MovieCard displays all metadata for one `MediaItem`. Layout (top to bottom):

1. **Poster** — Full-width image using `TMDB_IMAGE_BASE + POSTER_SIZE + posterPath`. Placeholder if null.
2. **Title & Year** — Title in bold, year extracted from releaseDate in muted text beside it.
3. **Rating badge** — Vote average as a colored badge (green >7, yellow >5, red <=5). Show vote count in muted text.
4. **Genre tags** — Horizontal scrolling row of small pills.
5. **Synopsis** — Overview text, clamped to 3 lines with "show more" toggle.
6. **Runtime/Seasons** — "2h 15m" for movies, "3 Seasons · 24 Episodes" for TV.
7. **Cast** — Horizontal row of small circular profile photos + name. Max 5.
8. **Streaming** — Row of provider logos with tooltip names. Group by type (Stream | Rent | Buy).

Props: `item: MediaItem`, `onClick: () => void`, `disabled?: boolean`

The entire card is clickable. Use `motion.div` as the wrapper.

**Step 2: Style it**

Dark card with rounded corners, subtle border. Poster fills top with slight rounded top corners. Content section below with comfortable padding. On mobile, card is full-width.

**Step 3: Commit**

```bash
git add src/components/MovieCard/
git commit -m "feat: implement MovieCard with full metadata display"
```

---

### Task 11: MatchupScreen Component

**Files:**
- Modify: `src/components/MatchupScreen/MatchupScreen.tsx`
- Create: `src/components/MatchupScreen/MatchupScreen.module.css`
- Create: `src/components/ProgressBar/ProgressBar.tsx`
- Create: `src/components/ProgressBar/ProgressBar.module.css`

**Step 1: Build the MatchupScreen**

Layout:
- ProgressBar at the top showing round name, match number (e.g., "Quarterfinals — Match 2 of 4")
- Two MovieCards side by side (desktop) or stacked (mobile) with a "VS" element between them
- The VS element should have a glowing pulse animation

Read current matchup from bracket state:
```ts
const { rounds, currentRoundIndex, currentMatchupIndex } = useBracket()
const currentRound = rounds[currentRoundIndex]
const currentMatchup = currentRound.matchups[currentMatchupIndex]
```

On card click:
1. Dispatch `PICK_WINNER` with the selected item
2. Animate the transition (winner celebration, loser fade)
3. After animation completes, the next matchup renders

Use `AnimatePresence` with `mode="wait"` and key on `${currentRoundIndex}-${currentMatchupIndex}` to trigger enter/exit animations per matchup.

**Step 2: Build ProgressBar**

Simple bar showing:
- Round name on the left
- "Match X of Y" on the right
- A progress track below with filled segment

**Step 3: Implement the round transition overlay**

Between rounds, show a full-screen overlay announcing the next round name (e.g., "SEMIFINALS") with a cinematic fade-in/fade-out. Use a brief `setTimeout` or Framer Motion's `onAnimationComplete` to auto-dismiss after ~1.5 seconds.

**Step 4: Commit**

```bash
git add src/components/MatchupScreen/ src/components/ProgressBar/
git commit -m "feat: implement MatchupScreen with VS layout and ProgressBar"
```

---

### Task 12: WinnerScreen Component

**Files:**
- Modify: `src/components/WinnerScreen/WinnerScreen.tsx`
- Create: `src/components/WinnerScreen/WinnerScreen.module.css`

**Step 1: Build the winner display**

Layout:
- "YOUR WINNER" title with gold gradient text
- The winning MovieCard displayed prominently (larger than matchup cards)
- TMDB link: `https://www.themoviedb.org/${item.mediaType}/${item.id}`
- "View Bracket" button that toggles the BracketView component
- "Play Again" button that dispatches `RESET`

Get the winner:
```ts
const { rounds } = useBracket()
const finalRound = rounds[rounds.length - 1]
const winner = finalRound.matchups[0].winner!
```

Winner entrance: card rises from below with scale animation, gold spotlight glow behind it, confetti particles.

**Step 2: Implement confetti effect**

Use a simple canvas-based confetti or CSS particle animation. Keep it lightweight — a burst of ~50 particles on winner reveal, not continuous. Can use a small utility function that creates absolutely-positioned animated divs or a `<canvas>`.

**Step 3: Commit**

```bash
git add src/components/WinnerScreen/
git commit -m "feat: implement WinnerScreen with winner reveal and confetti"
```

---

### Task 13: BracketView Component

**Files:**
- Create: `src/components/BracketView/BracketView.tsx`
- Create: `src/components/BracketView/BracketView.module.css`

**Step 1: Build the bracket visualization**

Renders the entire tournament bracket as a tree. Uses CSS Grid or flexbox with connecting lines.

Structure:
- Each round is a column
- Each matchup shows both titles (small text) with the winner highlighted
- Lines connect winners to their next matchup
- Scrollable horizontally on mobile

Data source: `rounds` from bracket state. Each round has matchups, each matchup has `.a`, `.b`, and `.winner`.

Keep this simple — small text labels for titles, connecting lines via CSS borders or SVG `<line>` elements. This is a "view on demand" feature, not the main attraction.

Wrap in `AnimatePresence` and `motion.div` so it slides in/out when toggled.

**Step 2: Commit**

```bash
git add src/components/BracketView/
git commit -m "feat: implement BracketView bracket tree visualization"
```

---

### Task 14: Animations & Transitions Polish

**Files:**
- Modify: All component files to add/refine Framer Motion animations

**Step 1: Card entrance animations**

In MatchupScreen, cards slide in from the sides:

```tsx
// Left card
<motion.div
  initial={{ x: -200, opacity: 0 }}
  animate={{ x: 0, opacity: 1 }}
  exit={{ x: -100, opacity: 0 }}
  transition={{ type: 'spring', stiffness: 200, damping: 25 }}
>

// Right card
<motion.div
  initial={{ x: 200, opacity: 0 }}
  animate={{ x: 0, opacity: 1 }}
  exit={{ x: 100, opacity: 0 }}
  transition={{ type: 'spring', stiffness: 200, damping: 25, delay: 0.1 }}
>
```

**Step 2: Pick animation**

When a card is clicked:
1. Winner card scales up slightly with gold border glow
2. Loser card fades and slides away
3. Brief pause, then next matchup slides in

Use a local state `pickState: null | 'left' | 'right'` to trigger these animations before dispatching the actual pick.

**Step 3: VS animation**

The "VS" text pulses with a glow:

```tsx
<motion.span
  animate={{
    scale: [1, 1.15, 1],
    textShadow: [
      '0 0 10px var(--accent-glow)',
      '0 0 30px var(--accent-glow)',
      '0 0 10px var(--accent-glow)',
    ],
  }}
  transition={{ duration: 2, repeat: Infinity }}
>
  VS
</motion.span>
```

**Step 4: Hover micro-interactions**

MovieCard hover:

```tsx
<motion.div
  whileHover={{ y: -8, boxShadow: 'var(--shadow-card-hover)' }}
  whileTap={{ scale: 0.98 }}
  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
>
```

**Step 5: Winner reveal animation**

Sequence: card enters from bottom with scale bounce, then gold glow pulses, then confetti fires.

```tsx
<motion.div
  initial={{ y: 100, opacity: 0, scale: 0.8 }}
  animate={{ y: 0, opacity: 1, scale: 1 }}
  transition={{
    type: 'spring',
    stiffness: 150,
    damping: 15,
    delay: 0.3,
  }}
>
```

**Step 6: Rating count-up**

When a MovieCard mounts, animate the rating number from 0 to its value using a simple `useEffect` + `requestAnimationFrame` counter, or Framer Motion's `useMotionValue` + `useTransform`.

**Step 7: Commit**

```bash
git add -A
git commit -m "feat: add polished Framer Motion animations and transitions"
```

---

### Task 15: Responsive Design

**Files:**
- Modify: CSS module files for all components

**Step 1: Mobile breakpoints**

Add media queries at `768px` breakpoint:

- **MatchupScreen:** Cards stack vertically instead of side by side. VS rotates to horizontal divider.
- **MovieCard:** Full-width, slightly smaller text.
- **SetupScreen:** Full-width form with more padding.
- **BracketView:** Horizontal scroll.
- **ProgressBar:** Slightly smaller font.

At `480px`:
- Further reduce padding and font sizes
- Card poster height shrinks
- Cast section hides (too cramped on very small screens)

**Step 2: Test on mobile viewport**

Open dev tools, test at 375px (iPhone SE) and 768px (tablet).

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: add responsive design for mobile and tablet"
```

---

### Task 16: Error States & Edge Cases

**Files:**
- Modify: `src/components/SetupScreen/SetupScreen.tsx`
- Create: `src/components/ApiKeyMissing/ApiKeyMissing.tsx`

**Step 1: API key missing screen**

If `!isApiKeySet()`, show a friendly screen explaining how to set up the API key:

```
To get started:
1. Get a free API key from themoviedb.org/settings/api
2. Create a .env file in the project root
3. Add: VITE_TMDB_API_KEY=your_key_here
4. Restart the dev server
```

Check this in `App.tsx` and render it instead of the normal flow.

**Step 2: Loading error handling**

In SetupScreen's fetch handler, wrap in try/catch. On error, dispatch `SET_ERROR` with the error message. Display the error above the Start button in red text.

**Step 3: Insufficient results**

After fetching, if `results.length < bracketSize`:

```
Not enough results (found X, need Y). Try a larger genre, a different search, or a smaller bracket size.
```

**Step 4: Missing poster placeholder**

In MovieCard, if `posterPath` is null, render a placeholder div with a film icon and the title text.

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: add error states, API key check, and missing data fallbacks"
```

---

### Task 17: Final Integration & Testing

**Step 1: End-to-end manual test**

1. Set a valid TMDB API key in `.env`
2. `npm run dev`
3. Test: Movies / 8-bracket / Trending → play through to winner
4. Test: TV Shows / 16-bracket / Genre filter → play through
5. Test: Both / 8-bracket / Search "marvel" → play through
6. Test: View Bracket on winner screen
7. Test: Play Again
8. Test: Search that returns too few results
9. Test on mobile viewport

**Step 2: Fix any issues found**

Address bugs found during manual testing.

**Step 3: Production build test**

```bash
npm run build
npx vite preview
```

Verify the production build works correctly.

**Step 4: Final commit**

```bash
git add -A
git commit -m "chore: final integration fixes and polish"
```

---

## Summary

| Task | What | Key Files |
|------|------|-----------|
| 1 | Project scaffolding | `vite.config.ts`, `package.json` |
| 2 | Types & constants | `src/types/index.ts`, `src/constants/genres.ts` |
| 3 | Bracket engine (TDD) | `src/lib/bracket.ts`, `tests/lib/bracket.test.ts` |
| 4 | TMDB API service | `src/services/tmdb.ts` |
| 5 | State management | `src/context/BracketContext.tsx` |
| 6 | Global styles | `src/index.css` |
| 7 | App shell | `src/App.tsx`, `src/main.tsx` |
| 8 | SetupScreen | `src/components/SetupScreen/` |
| 9 | LoadingScreen | `src/components/LoadingScreen/` |
| 10 | MovieCard | `src/components/MovieCard/` |
| 11 | MatchupScreen + ProgressBar | `src/components/MatchupScreen/`, `src/components/ProgressBar/` |
| 12 | WinnerScreen | `src/components/WinnerScreen/` |
| 13 | BracketView | `src/components/BracketView/` |
| 14 | Animations polish | All components |
| 15 | Responsive design | All CSS modules |
| 16 | Error states | Various |
| 17 | Integration testing | N/A |
