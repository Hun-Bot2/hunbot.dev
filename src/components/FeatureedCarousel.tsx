'use client'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Pagination, Autoplay } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import { Post } from '@/lib/markdown'

export default function FeaturedCarousel({ posts }: { posts: Post[] }) {
  return (
    <div className="relative mb-16">
      <Swiper
        modules={[Navigation, Pagination, Autoplay]}
        navigation
        pagination={{ clickable: true }}
        autoplay={{ delay: 4000, disableOnInteraction: false }}
        loop
        className="rounded-2xl"
      >
        {posts.map((post: Post) => (
          <SwiperSlide key={post.slug}>
            <div className="flex flex-col md:flex-row items-center bg-white dark:bg-black p-8 rounded-2xl shadow-none">
              <div>
                <div className="mb-2 text-xs text-gray-500">{post.date}</div>
                <div className="mb-2 flex flex-wrap gap-2">
                  {post.tags.map((tag: string) => (
                    <span key={tag} className="text-xs font-medium text-gray-700 dark:text-gray-300">#{tag}</span>
                  ))}
                </div>
                <h2 className="text-2xl font-bold font-serif text-black dark:text-white mb-2">{post.title}</h2>
                <p className="text-gray-600 dark:text-gray-300">{post.excerpt}</p>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  )
}
