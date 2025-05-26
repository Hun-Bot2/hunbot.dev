'use client'
import { Post } from '@/lib/markdown'
import FeaturedCarousel from './FeatureedCarousel'

export default function FeaturedCarouselClient({ posts }: { posts: Post[] }) {
  return <FeaturedCarousel posts={posts} />
} 