# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Development
npm run dev          # Start development server at localhost:4321
npm run build        # Build production site to ./dist/
npm run preview      # Preview production build locally

# Astro CLI
npm run astro        # Run Astro CLI commands
```

## Project Architecture

### Core Framework
- **Astro** static site generator with TypeScript
- **Tailwind CSS** for styling with custom neural network animations
- **MDX/Markdown** content with KaTeX math rendering support
- **Three.js** for 3D neural network visualization

### Content Structure
- Blog posts in `src/content/blog/` with frontmatter schema validation
- Content collection defined in `src/content.config.ts` with required fields:
  - `title`, `description`, `pubDate` (required)
  - `updatedDate`, `heroImage`, `tags`, `category` (optional)
- Korean language primary with multilingual meta tags

### Key Components
- **Neural Network 3D**: Interactive background visualization using Three.js
- **BlogPost Layout**: Korean-optimized with KaTeX math rendering
- **Theme System**: Dark/light mode with custom color scheme
- **Table of Contents**: Floating navigation component

### Styling System
- Custom Tailwind config with neural network color palette (`neural.cyan`, `neural.pink`)
- Gradient animations for visual effects
- Atkinson font family with Korean/Japanese font support
- Responsive design with mobile-first approach

### Interactive Features
- 3D neural network responds to blog post data
- Theme switching capabilities
- Floating table of contents
- Hover effects and animations throughout

### Site Configuration
- Site URL: `https://hunbot.dev`
- Korean language (`lang="ko"`)
- Math rendering with KaTeX
- Syntax highlighting for Python, R, JavaScript, SQL, Bash, TypeScript
- Draft support enabled

### File Organization
- Components: Reusable Astro components in `src/components/`
- Scripts: Modular JavaScript in `public/scripts/` (neural network, theme, controls)
- Styles: Custom CSS in `public/styles/` for neural network and controls
- Assets: Images and media in `src/assets/`

## Development Notes

### Content Creation
- Blog posts must include frontmatter with title, description, and pubDate
- Math expressions supported via KaTeX syntax
- Tags and categories used for content organization
- Hero images optional but displayed prominently when present

### Neural Network Integration
- Three.js visualization initialized on homepage
- Post data passed to neural network for dynamic representation
- Fallback handling for loading errors
- Keyboard shortcuts: Space (play/pause), Ctrl+R (reset)

### Styling Conventions
- Korean text optimization with proper font loading
- Custom gradient animations for visual appeal
- Purple/blue color scheme with neural network accents
- Responsive design patterns throughout

## SEO Implementation

### Search Engine Optimization Features
- **Comprehensive Meta Tags**: Open Graph, Twitter Cards, article-specific tags
- **Structured Data**: JSON-LD schemas for WebSite, Person, BlogPosting, and BreadcrumbList
- **Korean Language Optimization**: Proper lang attributes and Korean-specific meta tags
- **Performance Optimization**: Font preloading, DNS prefetch, canonical URLs
- **Technical SEO**: Sitemap generation, robots.txt, proper heading hierarchy

### Structured Data Types
- **WebSite Schema**: Site-wide information with search functionality
- **Person Schema**: Author information with social profiles
- **BlogPosting Schema**: Individual posts with publication dates, tags, and author info
- **BreadcrumbList Schema**: Navigation structure for better crawling
- **Blog Schema**: Blog index page with post listings

### SEO Best Practices
- Korean language optimization with proper lang attributes
- Semantic HTML structure with proper heading hierarchy
- Image optimization with alt text and responsive loading
- Internal linking through breadcrumbs and navigation
- Mobile-first responsive design for Core Web Vitals
- Fast loading with optimized assets and fonts