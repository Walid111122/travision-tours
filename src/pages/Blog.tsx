import React from 'react';
import { BookOpen, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';

/**
 * Blog is intentionally hidden while articles are being prepared.
 *
 * The route is kept so the URL resolves rather than 404-ing, but it is marked
 * noindex, removed from navigation and the sitemap, and disallowed in
 * robots.txt. No placeholder articles are rendered, and the newsletter form is
 * not shown until a mailing provider and privacy wording are approved.
 */
const Blog = () => (
  <div className="pt-32 pb-20 px-6 max-w-4xl mx-auto">
    <SEO
      title="Egyptian Culture Blog"
      description="Travision Tours essays and archaeological updates are being prepared."
      canonical="/blog"
      noIndex
    />
    <header className="mb-16">
      <span className="text-label mb-4 block">The Scribe's Archive</span>
      <h1 className="text-5xl md:text-7xl font-serif uppercase tracking-tight">Cultural <br /><span className="text-egypt-gold">Insights</span></h1>
    </header>

    <div className="glass rounded-[40px] border border-white/10 p-10 md:p-14">
      <div className="w-16 h-16 rounded-full bg-egypt-gold/10 flex items-center justify-center text-egypt-gold mb-8">
        <BookOpen size={28} />
      </div>
      <h2 className="font-serif text-2xl uppercase text-white mb-4">Articles are being prepared</h2>
      <p className="text-egypt-papyrus/60 font-light leading-relaxed mb-8">
        Our essays on hieroglyphics, pharaonic history, and modern Egyptian culture are still being
        written and reviewed. Rather than publish unfinished drafts, this section stays out of search
        results and navigation until the first articles are ready.
      </p>
      <div className="flex flex-wrap gap-4">
        <Link to="/tours" className="rounded-full bg-egypt-gold px-8 py-4 text-xs font-black uppercase tracking-widest text-egypt-night flex items-center gap-2">
          Browse tours <ArrowRight size={16} />
        </Link>
        <Link to="/contact" className="rounded-full border border-egypt-gold/40 px-8 py-4 text-xs font-black uppercase tracking-widest text-egypt-gold">
          Contact us
        </Link>
      </div>
    </div>
  </div>
);

export default Blog;
