import { Nav } from '@/components/nav'
import { getPostBySlug, getAllPosts } from '@/lib/markdown'
import { format } from 'date-fns'
import Link from 'next/link'
import Comments from '@/components/comments'

export async function generateStaticParams() {
  const posts = getAllPosts()
  return posts.map((post) => ({
    slug: post.slug,
  }))
}

export default async function BlogPost({
  params,
}: {
  params: { slug: string }
}) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  return (
    <main className="min-h-screen bg-white dark:bg-gray-950">
      <Nav />
      <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            {post.title}
          </h1>
          <time className="text-gray-500 dark:text-gray-400">
            {format(new Date(post.date), 'MMMM d, yyyy')}
          </time>
          <div className="mt-4 flex flex-wrap gap-2">
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
        </header>

        <div
          className="prose dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        <div className="mt-12">
          <Comments />
        </div>
      </article>
    </main>
  )
} 