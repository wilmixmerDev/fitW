"use client"

import { createContext, useContext, useState, useEffect } from "react"
import { es, type Translations } from "@/i18n/es"
import { en } from "@/i18n/en"

export type Lang = "es" | "en"

const LANGS: Record<Lang, Translations> = { es, en }
const LANG_NAMES: Record<Lang, string> = { es: "Español", en: "English" }

interface LangCtx {
  lang: Lang
  setLang: (l: Lang) => void
  t: Translations
  langNames: typeof LANG_NAMES
}

const LanguageContext = createContext<LangCtx>({
  lang: "es",
  setLang: () => {},
  t: es,
  langNames: LANG_NAMES,
})

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("es")

  useEffect(() => {
    const stored = localStorage.getItem("fitw-lang") as Lang | null
    if (stored && stored in LANGS) setLangState(stored)
  }, [])

  function setLang(l: Lang) {
    setLangState(l)
    localStorage.setItem("fitw-lang", l)
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: LANGS[lang], langNames: LANG_NAMES }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useT() {
  return useContext(LanguageContext).t
}

export function useLang() {
  const { lang, setLang, langNames } = useContext(LanguageContext)
  return { lang, setLang, langNames, allLangs: Object.keys(LANGS) as Lang[] }
}
