'use client'

import Giscus from '@giscus/react'

export default function Comments() {
  return (
    <Giscus
      id="comments"
      repo="Hun-Bot2/hunbot.dev"
      repoId="hunbot"
      category="General"
      categoryId="[YOUR_CATEGORY_ID]"
      mapping="pathname"
      term="Welcome to @giscus/react component!"
      reactionsEnabled="1"
      emitMetadata="0"
      inputPosition="bottom"
      theme="preferred_color_scheme"
      lang="en"
      loading="lazy"
    />
  )
} 