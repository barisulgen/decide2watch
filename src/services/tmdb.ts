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
  title?: string
  name?: string
  poster_path: string | null
  backdrop_path: string | null
  overview: string
  vote_average: number
  vote_count: number
  genre_ids: number[]
  release_date?: string
  first_air_date?: string
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
    runtime: null,
    numberOfSeasons: null,
    numberOfEpisodes: null,
    tagline: null,
    cast: [],
    watchProviders: [],
  }
}

/**
 * Fetches trending media from /trending/{movie|tv|all}/week.
 * For 'both', uses /trending/all/week and filters to movie+tv only.
 * Paginates if needed (20 results per page).
 */
export async function fetchTrending(filter: ContentFilter, count: number): Promise<MediaItem[]> {
  const mediaPath = filter === 'both' ? 'all' : filter
  const items: MediaItem[] = []
  let page = 1

  while (items.length < count) {
    const data = await tmdbFetch<TmdbListResponse>(`/trending/${mediaPath}/week`, {
      page: String(page),
    })

    const mapped = data.results
      .filter(raw => {
        if (filter === 'both') {
          return raw.media_type === 'movie' || raw.media_type === 'tv'
        }
        return true
      })
      .map(raw => mapRawItem(raw, filter === 'both' ? undefined : (filter as MediaType)))

    items.push(...mapped)

    if (page >= data.total_pages) break
    page++
  }

  return items.slice(0, count)
}

/**
 * Fetches media by genre from /discover/{movie|tv}.
 * For 'both', fetches both types and interleaves the results.
 */
export async function fetchByGenre(filter: ContentFilter, genreId: number, count: number): Promise<MediaItem[]> {
  const types: MediaType[] = filter === 'both' ? ['movie', 'tv'] : [filter as MediaType]
  const perType = filter === 'both' ? Math.ceil(count / 2) : count
  const allItems: MediaItem[] = []

  for (const type of types) {
    const items: MediaItem[] = []
    let page = 1

    while (items.length < perType) {
      const data = await tmdbFetch<TmdbListResponse>(`/discover/${type}`, {
        with_genres: String(genreId),
        sort_by: 'popularity.desc',
        page: String(page),
      })

      const mapped = data.results.map(raw => mapRawItem(raw, type))
      items.push(...mapped)

      if (page >= data.total_pages) break
      page++
    }

    allItems.push(...items.slice(0, perType))
  }

  return allItems.slice(0, count)
}

/**
 * Searches media via /search/multi.
 * Filters results by media_type based on the filter param.
 */
export async function fetchBySearch(query: string, filter: ContentFilter, count: number): Promise<MediaItem[]> {
  const items: MediaItem[] = []
  let page = 1

  while (items.length < count) {
    const data = await tmdbFetch<TmdbListResponse>('/search/multi', {
      query,
      page: String(page),
    })

    const mapped = data.results
      .filter(raw => {
        if (filter === 'both') {
          return raw.media_type === 'movie' || raw.media_type === 'tv'
        }
        return raw.media_type === filter
      })
      .map(raw => mapRawItem(raw))

    items.push(...mapped)

    if (page >= data.total_pages) break
    page++
  }

  return items.slice(0, count)
}

/**
 * Enriches a single MediaItem with detailed info from /movie/{id} or /tv/{id}.
 * Uses append_to_response=credits,watch/providers to get cast + streaming in one call.
 * For watch providers, prefers US region, falls back to first available.
 * Cast is limited to top 5 members.
 */
export async function enrichItem(item: MediaItem): Promise<MediaItem> {
  interface TmdbDetailResponse {
    runtime?: number | null
    number_of_seasons?: number | null
    number_of_episodes?: number | null
    tagline?: string | null
    credits?: {
      cast?: Array<{
        id: number
        name: string
        character: string
        profile_path: string | null
      }>
    }
    'watch/providers'?: {
      results?: Record<string, {
        flatrate?: Array<{ provider_id: number; provider_name: string; logo_path: string }>
        rent?: Array<{ provider_id: number; provider_name: string; logo_path: string }>
        buy?: Array<{ provider_id: number; provider_name: string; logo_path: string }>
        free?: Array<{ provider_id: number; provider_name: string; logo_path: string }>
      }>
    }
  }

  const path = item.mediaType === 'movie' ? `/movie/${item.id}` : `/tv/${item.id}`
  const data = await tmdbFetch<TmdbDetailResponse>(path, {
    append_to_response: 'credits,watch/providers',
  })

  // Extract cast (top 5)
  const cast: CastMember[] = (data.credits?.cast ?? [])
    .slice(0, 5)
    .map(c => ({
      id: c.id,
      name: c.name,
      character: c.character,
      profilePath: c.profile_path,
    }))

  // Extract watch providers — prefer US, fall back to first available
  const providerResults = data['watch/providers']?.results
  let regionData = providerResults?.US
  if (!regionData && providerResults) {
    const keys = Object.keys(providerResults)
    if (keys.length > 0) {
      regionData = providerResults[keys[0]]
    }
  }

  const watchProviders: WatchProvider[] = []
  const seenProviderIds = new Set<number>()

  if (regionData) {
    const providerTypes: Array<{ list: typeof regionData.flatrate; type: WatchProvider['type'] }> = [
      { list: regionData.flatrate, type: 'flatrate' },
      { list: regionData.free, type: 'free' },
      { list: regionData.rent, type: 'rent' },
      { list: regionData.buy, type: 'buy' },
    ]

    for (const { list, type } of providerTypes) {
      if (list) {
        for (const p of list) {
          if (!seenProviderIds.has(p.provider_id)) {
            seenProviderIds.add(p.provider_id)
            watchProviders.push({
              providerId: p.provider_id,
              providerName: p.provider_name,
              logoPath: p.logo_path,
              type,
            })
          }
        }
      }
    }
  }

  return {
    ...item,
    runtime: data.runtime ?? null,
    numberOfSeasons: data.number_of_seasons ?? null,
    numberOfEpisodes: data.number_of_episodes ?? null,
    tagline: data.tagline || null,
    cast,
    watchProviders,
  }
}

/**
 * Enriches all items in batches of 5 to avoid rate limits.
 * Calls onProgress with percentage after each batch.
 */
export async function enrichAll(
  items: MediaItem[],
  onProgress?: (percent: number) => void,
): Promise<MediaItem[]> {
  const batchSize = 5
  const enriched: MediaItem[] = []

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize)
    const results = await Promise.all(batch.map(item => enrichItem(item)))
    enriched.push(...results)

    if (onProgress) {
      const percent = Math.round((enriched.length / items.length) * 100)
      onProgress(percent)
    }
  }

  return enriched
}

/**
 * Returns true if VITE_TMDB_API_KEY is set and not the placeholder value.
 */
export function isApiKeySet(): boolean {
  return Boolean(API_KEY) && API_KEY !== 'your_api_key_here'
}
