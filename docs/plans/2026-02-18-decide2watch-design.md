# decide2watch — Design Document

## Problem

Instead of endlessly browsing for something to watch, the user gets a tournament bracket of movie/TV show matchups. Pick one from each pair, repeat until a winner emerges.

## Data Source

TMDB free API. API key stored as `VITE_TMDB_API_KEY` environment variable, injected at build time.

## Tech Stack

- React + Vite
- Framer Motion (transitions and animations)
- CSS Modules or plain CSS with CSS variables
- No backend — fully client-side SPA

## User Flow

1. **Setup screen** — User configures:
   - Content type: Movies / TV Shows / Both
   - Bracket size: 8, 16, or 32
   - Source: defaults to Trending, optionally filter by genre or search query
   - Start button

2. **Matchup screen** — Two cards side by side (stacked on mobile). Each shows poster, title, year, rating, genres, synopsis, runtime or seasons/episodes, cast highlights, and streaming providers. User clicks one to pick it. Progress indicator shows round and match number.

3. **Winner screen** — Winning title displayed with all info + TMDB page link. "View Bracket" button reveals the full bracket tree. "Play Again" button resets.

## Bracket Mechanic

Fixed power-of-2 single-elimination bracket. User selects 8, 16, or 32 titles. Titles are shuffled and paired. Winner of each pair advances. Rounds continue until one title remains.

If a search/filter returns fewer results than the selected bracket size, the user is prompted to lower the bracket size or broaden the search. No silent padding.

## Architecture

### Components

- `App` — top-level routing and state
- `SetupScreen` — config form
- `MatchupScreen` — core battle view with two cards
- `MovieCard` — poster + all metadata for one title
- `WinnerScreen` — final result display
- `BracketView` — SVG/CSS-grid bracket tree (on demand)
- `ProgressBar` — round/match indicator

### State Management

React context or `useReducer`. State includes:
- Bracket structure (array of rounds, each round is array of pairs)
- Current round index
- Current match index within round
- Results per round (winners)
- All fetched title data

All state is client-side. No persistence.

### TMDB API Calls

- `/trending/{movie|tv}/{week}` — default source
- `/discover/{movie|tv}` — genre filter
- `/search/multi` — user search query
- Per-title enrichment using `append_to_response=credits,watch/providers` to get cast and streaming data in a single call per title

For a 16-title bracket: 1 pool fetch + 16 enrichment calls = 17 total API calls at startup.

## UI & Styling

### Layout

- Desktop: two cards side by side, ~400-450px each, "VS" divider in center
- Mobile: cards stacked vertically, full-width, "VS" between them
- Dark theme by default — makes posters pop, cinema feel

### Transitions & Polish (Framer Motion)

- **Matchup entrance:** Cards slide in from left/right (top/bottom on mobile) with spring easing. "VS" pulses in with glow.
- **Pick animation:** Winner scales up with gold shimmer border. Loser flips or dissolves away.
- **Round transitions:** Full-screen overlay announcing next round with dramatic fade, like a title card.
- **Winner reveal:** Confetti/particle burst, card rises from center with spotlight glow.
- **Micro-interactions:** Hover lifts with shadow depth, subtle parallax on poster on mouse move, count-up animation on rating scores.

### Styling Approach

- CSS Modules or plain CSS
- CSS variables for theming
- Responsive via media queries
- All animations GPU-accelerated (transform/opacity)

## Error Handling

- **Small result set:** Prompt user to lower bracket size or broaden search. No silent padding.
- **TMDB rate limits (40 req/10s):** Stagger enrichment calls slightly.
- **Missing data:** Placeholder image for missing poster, fallback text for missing synopsis, "Streaming info unavailable" for missing providers.
- **Missing API key:** Clear setup message on first load if env var is not set.
- **Mobile performance:** Framer Motion uses GPU-accelerated properties by default.
