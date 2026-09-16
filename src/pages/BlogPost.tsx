import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, CalendarDays } from 'lucide-react';
import SEO from '../components/SEO';
import ResponsiveImage from '../components/ResponsiveImage';
import NotFound from './NotFound';
import { MarkdownContent } from '../components/Markdown';
import { BLOG_POSTS } from '../blogPosts';
import { SITE_NAME, absoluteUrl } from '../config/site';

const BlogPost = () => {
  const { id } = useParams();
  const post = BLOG_POSTS.find(p => p.id === id);

  if (!post) return <NotFound />;

  return (
    <article className="pt-32 pb-20 px-6 max-w-4xl mx-auto">
      <SEO
        title={post.title}
        description={post.excerpt}
        canonical={`/blog/${post.id}`}
        type="article"
        image={post.image}
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: post.title,
          description: post.excerpt,
          image: absoluteUrl(post.image),
          datePublished: post.date,
          author: { '@type': 'Organization', name: SITE_NAME },
          publisher: { '@type': 'Organization', name: SITE_NAME },
          mainEntityOfPage: absoluteUrl(`/blog/${post.id}`)
        }}
      />

      <Link
        to="/blog"
        className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-egypt-papyrus/60 hover:text-egypt-gold transition-colors"
      >
        <ArrowLeft size={14} /> All articles
      </Link>

      <header className="mt-8 mb-10">
        <div className="flex flex-wrap items-center gap-3 mb-5">
          {post.tags.map(tag => (
            <span key={tag} className="rounded-full border border-egypt-gold/30 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-egypt-gold">
              {tag}
            </span>
          ))}
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
        </div>
        <h1 className="font-serif text-4xl md:text-6xl uppercase tracking-tight text-white">{post.title}</h1>
        <p className="mt-4 text-sm uppercase tracking-widest text-egypt-papyrus/50">By {post.author}</p>
      </header>

      <ResponsiveImage
        src={post.image}
        alt={post.title}
        priority
        sizes="(min-width: 1024px) 896px, 100vw"
        className="w-full rounded-[30px] border border-white/10 object-cover"
      />

      <div className="mt-4"><MarkdownContent content={post.content} /></div>

      <div className="mt-16 glass rounded-[30px] border border-egypt-gold/20 p-8 md:p-10">
        <h2 className="font-serif text-2xl uppercase text-white">Plan your own route</h2>
        <p className="mt-3 text-sm font-light leading-relaxed text-egypt-papyrus/70">
          Every article here maps onto a real itinerary. Browse the tour collection, sketch a
          route in the planner, or send us an inquiry — we confirm every trip with a written
          quotation before anything is booked.
        </p>
        <div className="mt-6 flex flex-wrap gap-4">
          <Link
            to="/tours"
            className="rounded-full bg-egypt-gold px-8 py-4 text-xs font-black uppercase tracking-widest text-egypt-night hover:bg-white transition-colors"
          >
            Browse tours
          </Link>
          <Link
            to="/contact"
            className="rounded-full border border-egypt-gold/40 px-8 py-4 text-xs font-black uppercase tracking-widest text-egypt-gold hover:bg-egypt-gold/10 transition-colors"
          >
            Send an inquiry
          </Link>
        </div>
      </div>
    </article>
  );
};

export default BlogPost;
