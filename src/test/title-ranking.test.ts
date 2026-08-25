import {
  rankTitlesByAverageRating,
  rankTitlesByRating,
} from '@/features/members/title-ranking'
import { makeTitle } from '@/test/supabase-mock'

const ironMan = makeTitle({
  id: 'aa000000-0000-4000-8000-000000000001',
  name: 'Iron Man',
})
const wandaVision = makeTitle({
  id: 'aa000000-0000-4000-8000-000000000020',
  name: 'WandaVision',
})
const thor = makeTitle({
  id: 'aa000000-0000-4000-8000-000000000003',
  name: 'Thor',
})
const inactive = makeTitle({
  id: 'aa000000-0000-4000-8000-000000000099',
  name: 'Hidden Title',
  is_active: false,
})

describe('title ranking', () => {
  it('omits unrated, inactive, and unknown titles', () => {
    expect(
      rankTitlesByRating(
        [ironMan, wandaVision, inactive],
        [
          { title_id: ironMan.id, rating: 8 },
          { title_id: inactive.id, rating: 10 },
          { title_id: 'aa000000-0000-4000-8000-0000000000aa', rating: 9 },
        ],
      ).map((row) => row.title.name),
    ).toEqual(['Iron Man'])
  })

  it('ranks one member’s ratings highest first, then by name', () => {
    const ranked = rankTitlesByRating(
      [ironMan, wandaVision, thor],
      [
        { title_id: ironMan.id, rating: 9 },
        { title_id: wandaVision.id, rating: 10 },
        { title_id: thor.id, rating: 9 },
      ],
    )

    expect(
      ranked.map((row) => ({
        name: row.title.name,
        rating: row.rating,
      })),
    ).toEqual([
      { name: 'WandaVision', rating: 10 },
      { name: 'Iron Man', rating: 9 },
      { name: 'Thor', rating: 9 },
    ])
  })

  it('ranks group averages highest first, then by rating count, then name', () => {
    const ranked = rankTitlesByAverageRating(
      [ironMan, wandaVision, thor],
      [
        { title_id: ironMan.id, rating: 8 },
        { title_id: ironMan.id, rating: 10 },
        { title_id: wandaVision.id, rating: 10 },
        { title_id: thor.id, rating: 9 },
      ],
    )

    expect(
      ranked.map((row) => ({
        name: row.title.name,
        rating: row.rating,
        ratingCount: row.ratingCount,
      })),
    ).toEqual([
      { name: 'WandaVision', rating: 10, ratingCount: 1 },
      { name: 'Iron Man', rating: 9, ratingCount: 2 },
      { name: 'Thor', rating: 9, ratingCount: 1 },
    ])
  })
})
