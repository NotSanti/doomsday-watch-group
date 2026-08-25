import { averageRating } from '@/features/reviews/review-metrics'
import type { TitleRow } from '@/features/watchlist/title-schemas'

export const TITLE_RANKING_PREVIEW_LIMIT = 5

export type RankedTitleRating = {
  title: TitleRow
  rating: number
  ratingCount: number
}

export function rankTitlesByRating(
  titles: readonly TitleRow[],
  reviews: readonly { title_id: string; rating: number }[],
): RankedTitleRating[] {
  const titleById = new Map(
    titles
      .filter((title) => title.is_active)
      .map((title) => [title.id, title]),
  )
  const ranked: RankedTitleRating[] = []
  const seen = new Set<string>()

  for (const review of reviews) {
    if (seen.has(review.title_id)) {
      continue
    }

    const title = titleById.get(review.title_id)
    if (!title) {
      continue
    }

    seen.add(review.title_id)
    ranked.push({ title, rating: review.rating, ratingCount: 1 })
  }

  return ranked.sort(compareRankedTitles)
}

export function rankTitlesByAverageRating(
  titles: readonly TitleRow[],
  reviews: readonly { title_id: string; rating: number }[],
): RankedTitleRating[] {
  const ratingsByTitle = new Map<string, number[]>()

  for (const review of reviews) {
    const existing = ratingsByTitle.get(review.title_id)
    if (existing) {
      existing.push(review.rating)
    } else {
      ratingsByTitle.set(review.title_id, [review.rating])
    }
  }

  const ranked: RankedTitleRating[] = []

  for (const title of titles) {
    if (!title.is_active) {
      continue
    }

    const ratings = ratingsByTitle.get(title.id)
    if (!ratings) {
      continue
    }

    const average = averageRating(ratings)
    if (average === null) {
      continue
    }

    ranked.push({
      title,
      rating: average,
      ratingCount: ratings.length,
    })
  }

  return ranked.sort(compareRankedTitles)
}

function compareRankedTitles(
  left: RankedTitleRating,
  right: RankedTitleRating,
): number {
  if (right.rating !== left.rating) {
    return right.rating - left.rating
  }

  if (right.ratingCount !== left.ratingCount) {
    return right.ratingCount - left.ratingCount
  }

  return left.title.name.localeCompare(right.title.name)
}
