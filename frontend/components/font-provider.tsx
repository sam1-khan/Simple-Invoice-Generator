"use client"

import { createContext, useContext, useEffect, useState } from "react"

export type Font = "inter" | "manrope" | "system"
type FontProviderProps = {
  children: React.ReactNode
  defaultFont?: Font
  storageKey?: string
}
type FontProviderState = {
  font: Font
  setFont: (font: Font) => void
}

const initialState: FontProviderState = {
  font: "system",
  setFont: () => null,
}

const FontProviderContext = createContext<FontProviderState>(initialState)

export function FontProvider({
  children,
  defaultFont = "system",
  storageKey = "app-font",
  ...props
}: FontProviderProps) {
  const [font, setFont] = useState<Font>(defaultFont)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedFont = localStorage.getItem(storageKey) as Font | null
      if (storedFont) {
        setFont(storedFont)
      }
    }
  }, [storageKey])

  useEffect(() => {
    if (typeof window !== "undefined") {
      const root = window.document.documentElement
      const fontMap = {
        inter: "var(--font-inter)",
        manrope: "var(--font-manrope)",
        system: "var(--font-system)",
      }
      root.style.setProperty("--app-font-family", fontMap[font])
    }
  }, [font])

  const value = {
    font,
    setFont: (font: Font) => {
      if (typeof window !== "undefined") {
        localStorage.setItem(storageKey, font)
      }
      setFont(font)
    },
  }

  return (
    <FontProviderContext.Provider {...props} value={value}>
      {children}
    </FontProviderContext.Provider>
  )
}

export const useFont = () => {
  const context = useContext(FontProviderContext)
  if (context === undefined)
    throw new Error("useFont must be used within a FontProvider")
  return context
}