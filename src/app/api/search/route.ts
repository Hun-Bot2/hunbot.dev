import { NextResponse } from 'next/server'
import { getAllPosts } from '@/lib/markdown'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')

  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 })
  }

  const posts = getAllPosts()
  const searchResults = posts
    .filter((post) => {
      const searchContent = `${post.title} ${post.excerpt}`.toLowerCase()
      return searchContent.includes(query.toLowerCase())
    })
    .map((post) => ({
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
    }))

  return NextResponse.json(searchResults)
} 