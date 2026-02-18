# decide2watch

A tournament bracket app that helps you decide what to watch. Instead of endlessly browsing, you're presented with two movies or TV shows side by side — pick one, repeat, and after a few rounds of elimination you have your answer.

Data is pulled from [TMDB](https://www.themoviedb.org/).

## Features

- **Tournament bracket** — single-elimination format with 8, 16, or 32 titles
- **Rich metadata cards** — poster, rating, genres, synopsis, runtime, cast, streaming providers, and TMDB link
- **Content filtering** — browse trending/popular titles or search by keyword, filter by genre, toggle between movies, TV shows, or both
- **Winner screen** — horizontal layout with poster, full details, and a "View on TMDB" link
- **Bracket visualization** — view the full tournament tree after the winner is decided
- **Polished UI** — dark cinematic theme, Framer Motion animations, responsive design

## Tech Stack

- React 19 + TypeScript
- Vite
- Framer Motion
- CSS Modules
- Vitest + React Testing Library

## Getting Started

```bash
# install dependencies
npm install

# create a .env file with your TMDB v3 API key
echo "VITE_TMDB_API_KEY=your_api_key_here" > .env

# start dev server
npm run dev
```

Get a free API key at [themoviedb.org/settings/api](https://www.themoviedb.org/settings/api). Use the **API Key** (v3 auth), not the API Read Access Token.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |

## Project Structure

```
src/
├── components/
│   ├── BracketView/       # Tournament tree visualization
│   ├── LoadingScreen/     # Loading animation
│   ├── MatchupScreen/     # Side-by-side card battle
│   ├── MovieCard/         # Rich metadata card
│   ├── SetupScreen/       # Config form (content type, bracket size, genre, search)
│   └── WinnerScreen/      # Winner display with horizontal layout
├── context/
│   └── BracketContext.tsx  # useReducer state management
├── lib/
│   └── bracket.ts         # Pure bracket logic (shuffle, build, advance)
├── services/
│   └── tmdb.ts            # TMDB API service
├── constants/
│   └── genres.ts          # Genre maps, image URL constants
├── types/
│   └── index.ts           # TypeScript types
├── App.tsx                # App shell, routing, header
└── main.tsx               # Entry point
```
