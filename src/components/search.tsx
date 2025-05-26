'use client'

import { useState, useEffect } from 'react'
import { Search as SearchIcon } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface SearchResult {
  slug: string
  title: string
  excerpt: string
}

export function Search() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const searchPosts = async () => {
      if (query.length < 2) {
        setResults([])
        return
      }

      setIsLoading(true)
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
        const data = await response.json()
        setResults(data)
      } catch (error) {
        console.error('Search failed:', error)
        setResults([])
      }
      setIsLoading(false)
    }

    const debounce = setTimeout(searchPosts, 300)
    return () => clearTimeout(debounce)
  }, [query])

  return (
    <div className="relative">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search posts..."
          className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 pl-10 text-gray-900 dark:border-gray-800 dark:bg-gray-950 dark:text-white"
        />
        <SearchIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
      </div>

      {query.length >= 2 && (
        <div className="absolute z-10 mt-2 w-full rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-800 dark:bg-gray-950">
          {isLoading ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              Searching...
            </div>
          ) : results.length > 0 ? (
            <ul className="max-h-96 overflow-auto p-2">
              {results.map((result) => (
                <li key={result.slug}>
                  <Link
                    href={`/blog/${result.slug}`}
                    className="block rounded-md p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
                    onClick={() => setQuery('')}
                  >
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {result.title}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {result.excerpt}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              No results found
            </div>
          )}
        </div>
      )}
    </div>
  )
} 