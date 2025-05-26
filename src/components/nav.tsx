'use client'

import Link from 'next/link'
import { ThemeToggle } from './theme-toggle'

export function Nav() {
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-xl font-bold whitespace-nowrap">
          Career Blog
        </Link>

        <div className="flex items-center gap-10">
          {/* 왼쪽 메뉴 그룹 */}
            <span className="text-sm italic text-gray-500 dark:text-gray-400">2025년 5월 26일 시작</span>
            <Link href="/blog" className="text-gray-800 dark:text-gray-200 italic">
              Blog
            </Link>
            <Link href="/tags" className="text-gray-900 dark:text-white font-semibold">
              Tags
            </Link>
            <Link href="/rss.xml" className="text-2xl" aria-label="RSS Feed">
              🌀
            </Link>
          {/* 오른쪽 다크모드 토글 */}
          <ThemeToggle />
        </div>
      </div>
    </nav>
  )
}