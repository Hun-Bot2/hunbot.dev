import { Nav } from '@/components/nav'
import { getAllPosts, getAllTags } from '@/lib/markdown'
import Link from 'next/link'
import { format } from 'date-fns'

const POSTS_PER_PAGE = 6

export default async function BlogPage({
  searchParams,
}: {
  searchParams: { page?: string }
}) {
  const { page } = await searchParams;
  const currentPage = Number(page) || 1
  const allPosts = getAllPosts()
  const allTags: string[] = getAllTags()
  const totalPages = Math.ceil(allPosts.length / POSTS_PER_PAGE)
  const posts = allPosts.slice(
    (currentPage - 1) * POSTS_PER_PAGE,
    currentPage * POSTS_PER_PAGE
  )

  return (
    <>
      <Nav />
      <main className="min-h-screen bg-white dark:bg-gray-950">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <h1 className="text-5xl font-serif font-bold tracking-tight text-black dark:text-white text-center mt-16 mb-4">
            ALL POSTS.
          </h1>
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {allTags.map((tag: string) => (
              <Link key={tag} href={`/tags/${tag}`}>
                <span className="text-base font-medium text-gray-700 dark:text-gray-300 hover:underline">{tag}</span>
              </Link>
            ))}
          </div>
          
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

          {totalPages > 1 && (
            <div className="mt-8 flex justify-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Link
                  key={page}
                  href={`/blog?page=${page}`}
                  className={`px-4 py-2 rounded-md ${
                    page === currentPage
                      ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                      : 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white'
                  }`}
                >
                  {page}
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  )
} 