import { useState } from 'react'
import { useLocation } from 'react-router'

type MenuState = {
  path: string
  open: boolean
}

export function useRouteMenuOpen(): [boolean, (open: boolean | ((current: boolean) => boolean)) => void] {
  const location = useLocation()
  const [menuState, setMenuState] = useState<MenuState>({
    path: location.pathname,
    open: false,
  })
  const menuOpen =
    menuState.path === location.pathname && menuState.open

  function setMenuOpen(
    value: boolean | ((current: boolean) => boolean),
  ): void {
    setMenuState((current) => {
      const isOpen = current.path === location.pathname && current.open
      const nextOpen = typeof value === 'function' ? value(isOpen) : value
      return { path: location.pathname, open: nextOpen }
    })
  }

  return [menuOpen, setMenuOpen]
}
