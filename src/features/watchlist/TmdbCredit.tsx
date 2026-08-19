export const TMDB_CREDIT =
  'This product uses the TMDB API but is not endorsed or certified by TMDB.'

export function TmdbCredit({ className }: { className?: string }) {
  return (
    <p className={className}>
      {TMDB_CREDIT}{' '}
      <a
        className="text-heading underline decoration-border-strong underline-offset-2 hover:text-primary-emphasis"
        href="https://www.themoviedb.org/"
        rel="noreferrer"
        target="_blank"
      >
        The Movie Database
      </a>
      .
    </p>
  )
}
