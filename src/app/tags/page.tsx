import { Nav } from '@/components/nav'
import { getAllPosts, getAllTags } from '@/lib/markdown'
import Link from 'next/link'

export default function TagsPage() {
  const tags = getAllTags()
  const posts = getAllPosts()

  return (
    <main className="min-h-screen bg-white dark:bg-gray-950">
      <Nav />
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          Tags
        </h1>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {tags.map((tag) => {
            const tagPosts = posts.filter((post) => post.tags.includes(tag))
            return (
              <div
                key={tag}
                className="rounded-lg border border-gray-200 dark:border-gray-800 p-6"
              >
                <Link
                  href={`/tags/${tag}`}
                  className="text-xl font-semibold text-gray-900 dark:text-white hover:underline"
                >
                  #{tag}
                </Link>
                <p className="mt-2 text-gray-600 dark:text-gray-300">
                  {tagPosts.length} post{tagPosts.length !== 1 ? 's' : ''}
                </p>
                <ul className="mt-4 space-y-2">
                  {tagPosts.slice(0, 3).map((post) => (
                    <li key={post.slug}>
                      <Link
                        href={`/blog/${post.slug}`}
                        className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                      >
                        {post.title}
                      </Link>
                    </li>
                  ))}
                  {tagPosts.length > 3 && (
                    <li>
                      <Link
                        href={`/tags/${tag}`}
                        className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                      >
                        +{tagPosts.length - 3} more
                      </Link>
                    </li>
                  )}
                </ul>
              </div>
            )
          })}
        </div>
      </div>
    </main>
  )
} 