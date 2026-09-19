import React from 'react';
import { ArrowRight, CalendarDays } from 'lucide-react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import ResponsiveImage from '../components/ResponsiveImage';
import { BLOG_POSTS } from '../blogPosts';
import { absoluteUrl } from '../config/site';

const Blog = () => (
  <div className="pt-32 pb-20 px-6 max-w-6xl mx-auto">
    <SEO
      title="Egyptian Culture Blog"
      description="Guides to Egypt's temples, itineraries, and practical travel advice — written by the Travision Tours team."
      canonical="/blog"
      structuredData={{
        '@context': 'https://schema.org',
        '@type': 'Blog',
        name: 'The Scribe’s Archive',
        description: "Guides to Egypt's temples, itineraries, and practical travel advice.",
        url: absoluteUrl('/blog'),
        blogPost: BLOG_POSTS.map(post => ({
          '@type': 'BlogPosting',
          headline: post.title,
          description: post.excerpt,
          datePublished: post.date,
          url: absoluteUrl(`/blog/${post.id}`)
        }))
      }}
    />
    <header className="mb-16">
      <span className="text-label mb-4 block">The Scribe's Archive</span>
      <h1 className="text-5xl md:text-7xl font-serif uppercase tracking-tight">
        Cultural <br />
        <span className="text-egypt-gold">Insights</span>
      </h1>
      <p className="mt-6 max-w-2xl text-egypt-papyrus/60 font-light leading-relaxed">
        Practical guides to Egypt's monuments, itineraries, and travel realities — written to help
        you plan a trip worth remembering.
      </p>
    </header>

    <div className="grid gap-8 md:grid-cols-2">
      {BLOG_POSTS.map(post => (
        <article
          key={post.id}
          className="glass rounded-[30px] border border-white/10 overflow-hidden flex flex-col hover:border-egypt-gold/40 transition-colors"
        >
          <Link to={`/blog/${post.id}`} className="block" tabIndex={-1} aria-hidden="true">
            <ResponsiveImage
              src={post.image}
              alt={post.title}
              sizes="(min-width: 768px) 50vw, 100vw"
              className="aspect-[16/9] w-full object-cover"
            />
          </Link>
          <div className="flex flex-col flex-grow p-7">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {post.tags.map(tag => (
                <span
                  key={tag}
                  className="rounded-full border border-egypt-gold/30 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-egypt-gold"
                >
                  {tag}
                </span>
              ))}
            </div>
            <h2 className="font-serif text-2xl text-white leading-snug">
              <Link to={`/blog/${post.id}`} className="hover:text-egypt-gold transition-colors">
                {post.title}
              </Link>
            </h2>
            <p className="mt-3 text-sm font-light leading-relaxed text-egypt-papyrus/60 flex-grow">
              {post.excerpt}
            </p>
            <div className="mt-6 flex items-center justify-between">
              <span className="inline-flex items-center gap-2 text-[10px] uppercase tracking-widest text-egypt-papyrus/50">
                <CalendarDays size={12} />
                <time dateTime={post.date}>
                  {new Date(`${post.date}T00:00:00Z`).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    timeZone: 'UTC'
                  })}
                </time>
              </span>
              <Link
                to={`/blog/${post.id}`}
                className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-egypt-gold hover:text-white transition-colors"
              >
                Read <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </article>
      ))}
    </div>
  </div>
);

export default Blog;
