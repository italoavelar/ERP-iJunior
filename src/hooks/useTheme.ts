import { useCallback, useEffect, useState } from 'react'

const KEY = 'ijunior-fin-theme'

const read = (): boolean => {
  try {
    return localStorage.getItem(KEY) === 'dark'
  } catch {
    return false
  }
}

const write = (dark: boolean) => {
  try {
    localStorage.setItem(KEY, dark ? 'dark' : 'light')
  } catch {
    /* modo privado / storage bloqueado — o tema vale só para esta sessão */
  }
}

/** Tema persistido no navegador, espelhado em `data-theme` no <html>. */
export function useTheme() {
  const [dark, setDark] = useState(read)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
  }, [dark])

  const toggle = useCallback(() => {
    setDark((d) => {
      write(!d)
      return !d
    })
  }, [])

  return { dark, toggle }
}
