import { Nav } from '@/components/nav'
import { getAllPosts } from '@/lib/markdown'
import Link from 'next/link'
import { format } from 'date-fns'

export function generateStaticParams() {
  const posts = getAllPosts()
  const tags = new Set<string>()
  posts.forEach((post) => post.tags.forEach((tag) => tags.add(tag)))
  return Array.from(tags).map((tag) => ({ tag }))
}

export default async function TagPage({ params }: { params: { tag: string } }) {
  const { tag } = await params;
  const posts = getAllPosts().filter((post) => post.tags.includes(tag));

  return (
    <main className="min-h-screen bg-white dark:bg-gray-950">
      <Nav />
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          Posts tagged with #{tag}
        </h1>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <article
              key={post.slug}
              className="flex flex-col rounded-lg border border-gray-200 dark:border-gray-800 p-6 hover:shadow-lg transition-shadow"
            >
              <Link href={`/blog/${post.slug}`}>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {post.title}
                </h2>
              </Link>
              <time className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                {format(new Date(post.date), 'MMMM d, yyyy')}
              </time>
              <p className="text-gray-600 dark:text-gray-300 mb-4 flex-grow">
                {post.excerpt}
              </p>
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <Link
                    key={tag}
                    href={`/tags/${tag}`}
                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  )
} 