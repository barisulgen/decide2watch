export type MediaType = 'movie' | 'tv'
export type ContentFilter = 'movie' | 'tv' | 'both'
export type BracketSize = 8 | 16 | 32

export interface MediaItem {
  id: number
  mediaType: MediaType
  title: string
  posterPath: string | null
  backdropPath: string | null
  overview: string
  voteAverage: number
  voteCount: number
  genreIds: number[]
  genres: string[]
  releaseDate: string
  popularity: number
  runtime: number | null
  numberOfSeasons: number | null
  numberOfEpisodes: number | null
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
  name: string
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
