import { useState } from 'react'
import { motion } from 'framer-motion'
import type { MediaItem } from '../../types'
import { TMDB_IMAGE_BASE, POSTER_SIZE, PROFILE_SIZE, LOGO_SIZE } from '../../constants/genres'
import styles from './MovieCard.module.css'

interface MovieCardProps {
  item: MediaItem
  onClick?: () => void
  disabled?: boolean
}

function formatRuntime(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

function formatVoteCount(count: number): string {
  if (count >= 1000) {
    return count.toLocaleString()
  }
  return String(count)
}

function getRatingClass(rating: number): string {
  if (rating >= 7) return styles.ratingHigh
  if (rating >= 5) return styles.ratingMid
  return styles.ratingLow
}

export function MovieCard({ item, onClick, disabled = false }: MovieCardProps) {
  const [synopsisExpanded, setSynopsisExpanded] = useState(false)

  const year = item.releaseDate ? item.releaseDate.slice(0, 4) : null
  const cast = item.cast?.slice(0, 5) ?? []
  const providers = item.watchProviders?.slice(0, 6) ?? []

  const cardClasses = [
    styles.card,
    onClick ? styles.cardClickable : '',
    disabled ? styles.cardDisabled : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <motion.div className={cardClasses} onClick={disabled ? undefined : onClick}>
      {/* ---- Poster ---- */}
      <div className={styles.poster}>
        {item.posterPath ? (
          <img
            className={styles.posterImage}
            src={`${TMDB_IMAGE_BASE}${POSTER_SIZE}${item.posterPath}`}
            alt={item.title}
            loading="lazy"
          />
        ) : (
          <div className={styles.posterPlaceholder}>
            <span className={styles.posterIcon} aria-hidden="true">
              🎬
            </span>
            <span className={styles.posterTitle}>{item.title}</span>
          </div>
        )}
      </div>

      {/* ---- Content ---- */}
      <div className={styles.content}>
        {/* Title & Year */}
        <div className={styles.titleRow}>
          <span className={styles.title}>{item.title}</span>
          {year && <span className={styles.year}>({year})</span>}
        </div>

        {/* Rating Badge */}
        <div className={styles.ratingRow}>
          <span className={`${styles.ratingBadge} ${getRatingClass(item.voteAverage)}`}>
            {item.voteAverage.toFixed(1)}
          </span>
          <span className={styles.voteCount}>
            &middot; {formatVoteCount(item.voteCount)} votes
          </span>
        </div>

        {/* Genre Tags */}
        {item.genres.length > 0 && (
          <div className={styles.genres}>
            {item.genres.map((genre) => (
              <span key={genre} className={styles.genrePill}>
                {genre}
              </span>
            ))}
          </div>
        )}

        {/* Synopsis */}
        {item.overview && (
          <div className={styles.synopsisSection}>
            <p
              className={`${styles.synopsis} ${
                !synopsisExpanded ? styles.synopsisClamped : ''
              }`}
            >
              {item.overview}
            </p>
            <button
              className={styles.toggleBtn}
              onClick={(e) => {
                e.stopPropagation()
                setSynopsisExpanded((prev) => !prev)
              }}
              type="button"
            >
              {synopsisExpanded ? 'Show less' : 'Show more'}
            </button>
          </div>
        )}

        <hr className={styles.divider} />

        {/* Runtime / Seasons */}
        {item.mediaType === 'movie' && item.runtime != null && (
          <div className={styles.meta}>
            <span className={styles.metaIcon} aria-hidden="true">
              &#9201;
            </span>
            {formatRuntime(item.runtime)}
          </div>
        )}

        {item.mediaType === 'tv' &&
          (item.numberOfSeasons != null || item.numberOfEpisodes != null) && (
            <div className={styles.meta}>
              <span className={styles.metaIcon} aria-hidden="true">
                &#128250;
              </span>
              {item.numberOfSeasons != null && (
                <span>
                  {item.numberOfSeasons} Season{item.numberOfSeasons !== 1 ? 's' : ''}
                </span>
              )}
              {item.numberOfSeasons != null && item.numberOfEpisodes != null && (
                <span>&middot;</span>
              )}
              {item.numberOfEpisodes != null && (
                <span>
                  {item.numberOfEpisodes} Episode{item.numberOfEpisodes !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          )}

        {/* Cast */}
        {cast.length > 0 && (
          <div className={styles.castSection}>
            <span className={styles.castLabel}>Cast</span>
            <div className={styles.castList}>
              {cast.map((member) => (
                <div key={member.id} className={styles.castMember}>
                  {member.profilePath ? (
                    <img
                      className={styles.castPhoto}
                      src={`${TMDB_IMAGE_BASE}${PROFILE_SIZE}${member.profilePath}`}
                      alt={member.name}
                      loading="lazy"
                    />
                  ) : (
                    <div className={styles.castPhotoPlaceholder}>
                      <span className={styles.castInitial}>
                        {member.name.charAt(0)}
                      </span>
                    </div>
                  )}
                  <span className={styles.castName}>{member.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Streaming Providers */}
        <div className={styles.providersSection}>
          <span className={styles.providersLabel}>Available on</span>
          {providers.length > 0 ? (
            <div className={styles.providersList}>
              {providers.map((provider) => (
                <img
                  key={provider.providerId}
                  className={styles.providerLogo}
                  src={`${TMDB_IMAGE_BASE}${LOGO_SIZE}${provider.logoPath}`}
                  alt={provider.providerName}
                  title={provider.providerName}
                  loading="lazy"
                />
              ))}
            </div>
          ) : (
            <span className={styles.providersEmpty}>
              Streaming info unavailable
            </span>
          )}
        </div>
      </div>
    </motion.div>
  )
}
