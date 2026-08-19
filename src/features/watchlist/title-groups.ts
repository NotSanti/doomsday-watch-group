import type { TitleRow } from '@/features/watchlist/title-schemas'

export const OTHER_ERA_LABEL = 'Other titles'

export type TitleEraGroup = {
  era: string
  titles: TitleRow[]
}

export function eraForTitle(title: Pick<TitleRow, 'era'>): string {
  return title.era ?? OTHER_ERA_LABEL
}

export function groupTitlesByEra(titles: readonly TitleRow[]): TitleEraGroup[] {
  const groups: TitleEraGroup[] = []

  for (const title of titles) {
    const era = eraForTitle(title)
    const current = groups.at(-1)

    if (current && current.era === era) {
      current.titles.push(title)
      continue
    }

    groups.push({ era, titles: [title] })
  }

  return groups
}
