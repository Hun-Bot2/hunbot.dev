'use client'

import * as React from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <button
      onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
      className="relative p-0 m-0 bg-transparent border-none outline-none focus:outline-none hover:text-gray-500 dark:hover:text-gray-400 transition-colors"
      aria-label="Toggle theme"
      style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <Sun className="h-6 w-6 rotate-0 scale-100 transition-all duration-200 dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute top-0 left-0 h-6 w-6 rotate-90 scale-0 transition-all duration-200 dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </button>
  )
}