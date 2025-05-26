import { Nav } from '@/components/nav'
import { getAllPosts, getAllTags, Post } from '@/lib/markdown'
import Link from 'next/link'
import { format } from 'date-fns'
import FeaturedCarouselClient from '@/components/FeaturedCarouselClient'

export default function Home() {
  const posts: Post[] = getAllPosts()
  const allTags: string[] = getAllTags()
  const featuredPosts = posts.slice(0, 3) // Top 3 as featured
  const restPosts = posts.slice(3, 9) // Next 6 for grid

  return (
    <main className="min-h-screen bg-white dark:bg-gray-950">
      <Nav />
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-5xl font-serif font-bold tracking-tight text-black dark:text-white text-center mt-16 mb-4">
          ALL POSTS.
        </h1>
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {allTags.map(tag => (
            <Link key={tag} href={`/tags/${tag}`}>
              <span className="text-base font-medium text-gray-700 dark:text-gray-300 hover:underline">{tag}</span>
            </Link>
          ))}
        </div>

        <section className="mb-16">
          <h2 className="text-2xl font-serif font-bold mb-4">Featured.</h2>
          <FeaturedCarouselClient posts={featuredPosts} />
        </section>

        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3">
          {restPosts.map((post) => (
            <article
              key={post.slug}
              className="flex flex-col rounded-xl border border-gray-200 dark:border-gray-800 p-6 bg-white dark:bg-black"
            >
              <div className="mb-2 text-xs text-gray-500">{format(new Date(post.date), 'yyyy/MM/dd')}</div>
              <div className="mb-2 flex flex-wrap gap-2">
                {post.tags.map(tag => (
                  <span key={tag} className="text-xs font-medium text-gray-700 dark:text-gray-300">#{tag}</span>
                ))}
              </div>
              <h3 className="text-lg font-bold font-serif text-black dark:text-white mb-2">{post.title}</h3>
              <p className="text-gray-600 dark:text-gray-300">{post.excerpt}</p>
            </article>
          ))}
        </div>
      </div>
    </main>
  )
} 