import React from 'react';
import { motion } from 'motion/react';
import { BookOpen, Calendar, User, ArrowRight, Hash } from 'lucide-react';
import { SAMPLE_BLOG_POSTS } from '../constants';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';

const Blog = () => {
  return (
    <div className="pt-32 pb-20 px-6 max-w-7xl mx-auto">
      <SEO 
        title="Egyptian Culture Blog" 
        description="Deep dives into hieroglyphics, pharaonic history, and modern Egyptian culture."
        canonical="/blog"
        image="/hero.jpg"
      />
      <header className="mb-20">
        <span className="text-label mb-4 block">The Scribe's Archive</span>
        <h1 className="text-5xl md:text-7xl font-serif uppercase tracking-tight">Cultural <br /><span className="text-egypt-gold">Insights</span></h1>
        <p className="text-egypt-papyrus/50 mt-6 max-w-2xl font-light leading-relaxed italic">
          A collection of essays, archaeological updates, and local stories curated to deepen your understanding of the Nile's eternal legacy.
        </p>
      </header>

      {/* Featured Post (Hero style) */}
      <section className="mb-24">
         <motion.div 
           initial={{ opacity: 0, y: 20 }}
           whileInView={{ opacity: 1, y: 0 }}
           viewport={{ once: true }}
           className="relative aspect-[21/9] rounded-[60px] overflow-hidden group cursor-pointer"
         >
            <img 
               src="https://images.unsplash.com/photo-1605649440417-513b636030c1?auto=format&fit=crop&q=80&w=2000" 
               className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" 
               alt="Featured Post" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-egypt-night via-egypt-night/40 to-transparent" />
            <div className="absolute bottom-12 left-12 right-12">
               <div className="flex gap-3 mb-6">
                  {['Hieroglyphs', 'Deciphering', 'Ancient Wisdom'].map(tag => (
                    <span key={tag} className="glass px-4 py-1.5 rounded-full text-[9px] uppercase font-bold tracking-widest text-egypt-gold">{tag}</span>
                  ))}
               </div>
               <h2 className="text-4xl md:text-6xl font-serif uppercase max-w-3xl leading-tight mb-8">Decoding the Book of the Dead: A Journey Through the Underworld</h2>
               <div className="flex items-center gap-8 text-white/50 text-[10px] uppercase font-bold tracking-widest">
                  <div className="flex items-center gap-2"><User size={14} className="text-egypt-gold" /> Dr. Sarah Amin</div>
                  <div className="flex items-center gap-2"><Calendar size={14} className="text-egypt-gold" /> March 24, 2026</div>
               </div>
            </div>
         </motion.div>
      </section>

      {/* Blog Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
        {SAMPLE_BLOG_POSTS.map((post, idx) => (
          <motion.article
            key={post.id}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.1 }}
            className="group"
          >
             <div className="aspect-[4/3] rounded-[40px] overflow-hidden mb-8 border border-white/5 relative">
                <img src={post.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={post.title} />
                <div className="absolute inset-0 bg-egypt-night/20 group-hover:bg-transparent transition-colors" />
                <div className="absolute bottom-6 left-6">
                   <div className="flex gap-2">
                      {post.tags.map(tag => (
                         <span key={tag} className="bg-egypt-night/80 backdrop-blur-md px-3 py-1 rounded-full text-[8px] uppercase font-black text-egypt-gold">{tag}</span>
                      ))}
                   </div>
                </div>
             </div>
             <div>
                <h3 className="text-2xl font-serif uppercase mb-4 group-hover:text-egypt-gold transition-colors">{post.title}</h3>
                <p className="text-sm text-egypt-papyrus/40 font-light italic leading-relaxed mb-6">
                   {post.excerpt}
                </p>
                <div className="flex items-center justify-between">
                   <div className="text-[10px] uppercase tracking-widest text-white/20 font-bold">5 Min Read</div>
                   <button className="flex items-center gap-2 text-egypt-gold uppercase text-[10px] tracking-widest font-black hover:translate-x-2 transition-transform">
                      Read Scroll <ArrowRight size={14} />
                   </button>
                </div>
             </div>
          </motion.article>
        ))}
      </div>

      {/* Newsletter / Ritual Subscription */}
      <section className="mt-32 p-12 md:p-24 bg-egypt-basalt rounded-[60px] border border-white/5 relative overflow-hidden">
         <div className="absolute top-0 right-0 w-96 h-96 bg-egypt-gold/5 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2" />
         <div className="max-w-2xl relative z-10">
            <h2 className="text-4xl font-serif uppercase mb-6 leading-tight">The <span className="text-egypt-gold italic">Nile Letter</span></h2>
            <p className="text-egypt-papyrus/50 mb-10 font-light italic text-lg leading-relaxed">
               Bi-weekly dispatches on new archaeological finds, cultural rituals, and exclusive season openings.
            </p>
            <form className="flex flex-col sm:flex-row gap-4">
               <input 
                 type="email" 
                 placeholder="scribe@domain.com" 
                 className="flex-grow bg-egypt-night border border-white/10 rounded-2xl px-6 py-4 text-sm font-light focus:border-egypt-gold outline-none transition-all"
               />
               <button className="bg-egypt-gold text-egypt-night px-10 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-white transition-all shadow-xl shadow-egypt-gold/10">
                  Join the Circle
               </button>
            </form>
         </div>
      </section>
    </div>
  );
};

export default Blog;
