import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Star, MapPin, Calendar, Users, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SAMPLE_TOURS } from '../constants';
import SEO from '../components/SEO';
import { CONTACT_EMAIL, CONTACT_PHONE, DEFAULT_SOCIAL_IMAGE, SITE_URL } from '../config/site';

const Home = () => {
  return (
    <div className="overflow-hidden">
      <SEO 
        title="Private Egypt Tours & Tailor-Made Holidays"
        description="Premium, history-focused tours in Egypt. Discover the Giza Pyramids, Luxor, and Aswan with expert Egyptologists."
        canonical="/"
        image={DEFAULT_SOCIAL_IMAGE}
        imageAlt="Travision Tours guests at the Pyramids of Giza"
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'TravelAgency',
          '@id': `${SITE_URL}/#organization`,
          name: 'Travision Tours',
          url: SITE_URL,
          logo: `${SITE_URL}/favicon.svg`,
          image: DEFAULT_SOCIAL_IMAGE,
          description: 'Private Egypt tours, day trips, Nile cruises, and tailor-made holidays with expert Egyptologists.',
          telephone: CONTACT_PHONE,
          email: CONTACT_EMAIL,
          address: {
            '@type': 'PostalAddress',
            addressLocality: 'Cairo',
            addressCountry: 'EG'
          },
          areaServed: {
            '@type': 'Country',
            name: 'Egypt'
          }
        }}
      />
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center pt-32 md:pt-40 px-6">
        <div className="absolute inset-0 z-0">
          <img 
            src="/hero.jpg?v=2" 
            alt="Travision Tours Group at Pyramids of Giza"
            className="w-full h-full object-cover opacity-100"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-egypt-night/20 via-egypt-night/60 to-egypt-night" />
        </div>

        <div className="max-w-7xl mx-auto w-full relative z-10 mt-20 md:mt-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-4xl"
          >
            <span className="text-label mb-6 block">Est. 2026 • The Preservation of History</span>
            <h1 className="text-6xl md:text-[120px] font-serif leading-[0.9] uppercase mb-8">
              Legacy <br />
              <span className="text-egypt-gold italic font-light">Transcending</span> <br />
              Time
            </h1>
            <p className="text-lg md:text-xl text-egypt-papyrus/70 font-light max-w-xl leading-relaxed mb-12">
              Beyond standard tourism. Discover the esoteric wisdom and architectural mastery of Ancient Egypt through specialist-led explorations.
            </p>
            <div className="flex flex-col sm:flex-row gap-6">
              <Link 
                to="/tours" 
                className="bg-egypt-gold text-egypt-night px-10 py-5 rounded-full font-medium flex items-center justify-center gap-3 hover:bg-white transition-all group shadow-xl shadow-egypt-gold/10"
              >
                Explore Destinations
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link 
                to="/planner" 
                className="border border-white/20 hover:border-egypt-gold px-10 py-5 rounded-full font-medium flex items-center justify-center backdrop-blur-sm transition-all"
              >
                Plan Your Journey
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Floating Numbers / Stats */}
        <div className="absolute bottom-12 right-6 hidden lg:flex flex-col items-end gap-2">
          <span className="text-[120px] font-serif leading-none text-white/5 select-none">01</span>
          <span className="text-label text-right">The Pharaoh's Path</span>
        </div>
      </section>

      {/* Featured Tours */}
      <section className="py-32 px-6 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
          <div>
            <span className="text-label mb-4 block italic">Curated Collections</span>
            <h2 className="text-5xl md:text-6xl font-serif uppercase">Signature <br />Voyages</h2>
          </div>
          <Link to="/tours" className="text-egypt-gold uppercase tracking-widest text-sm font-medium border-b border-egypt-gold/30 pb-2 hover:border-egypt-gold transition-all">
            See all experiences
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {SAMPLE_TOURS.filter(t => t.duration !== '1 Day' && !t.title.toLowerCase().includes('day trip') && !t.title.toLowerCase().includes('day tour')).slice(0, 3).map((tour, idx) => (
            <motion.div
              key={tour.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1, duration: 0.6 }}
              className="group cursor-pointer"
            >
              <Link to={`/tours/${tour.id}`}>
                <div className="relative aspect-[4/5] overflow-hidden rounded-t-[40px] rounded-b-[10px] mb-6">
                  <img 
                    src={tour.image} 
                    alt={tour.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-egypt-night/80 via-transparent to-transparent opacity-60" />
                  <div className="absolute top-6 right-6 glass px-3 py-1 rounded-full flex items-center gap-1">
                    <Star size={14} className="text-egypt-gold fill-egypt-gold" />
                    <span className="text-xs font-medium">{tour.rating}</span>
                  </div>
                  <div className="absolute bottom-6 left-6">
                    <span className="text-[10px] uppercase tracking-widest text-white/70 block mb-1">
                      {tour.location}
                    </span>
                    <h3 className="text-xl font-serif text-white">{tour.title}</h3>
                  </div>
                </div>
                <div className="flex justify-between items-center px-2">
                  <span className="text-egypt-gold font-serif text-lg">${tour.price} <span className="text-xs text-egypt-papyrus/40 font-sans uppercase">/ Person</span></span>
                  <div className="flex gap-4 text-egypt-papyrus/50">
                    <div className="flex items-center gap-1">
                      <Calendar size={14} />
                      <span className="text-[10px]">{tour.duration}</span>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Cultural Focus Section */}
      <section className="bg-egypt-basalt py-32 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div className="relative">
            <div className="aspect-square rounded-[60px] overflow-hidden border border-white/5">
              <img 
                src="https://images.unsplash.com/photo-1506466010722-395aa2bef877?auto=format&fit=crop&q=80&w=1200" 
                alt="Egyptian Art"
                className="w-full h-full object-cover"
              />
            </div>
            {/* Overlay badge */}
            <div className="absolute -bottom-10 -right-10 w-48 h-48 rounded-full flex items-center justify-center p-8 bg-egypt-gold text-egypt-night animate-spin-slow">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <path
                  id="circlePath"
                  d="M 50, 50 m -37, 0 a 37,37 0 1,1 74,0 a 37,37 0 1,1 -74,0"
                  fill="none"
                />
                <text className="font-serif uppercase text-[9px] tracking-[2px] font-bold fill-egypt-night">
                  <textPath xlinkHref="#circlePath">
                    Authentic Cultural Immersion • Historical Preservation • Specialist Guides •
                  </textPath>
                </text>
              </svg>
            </div>
          </div>

          <div className="space-y-8">
            <span className="text-label block">Why Travision Tours?</span>
            <h2 className="text-5xl font-serif leading-tight">Beyond Browsing: <br /><span className="text-egypt-gold italic">The Living History</span></h2>
            <p className="text-egypt-papyrus/60 font-light leading-relaxed text-lg">
              Most tours show you the stones. We show you the stories etched into them. Our expeditions are curated by Egyptologists and locals who breathe the legacy of the Nile. No hotels, no filler—just pure, unadulterated history.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-6">
              {[
                { icon: ShieldCheck, title: 'Safety First', desc: 'Secure routes & 24/7 support.' },
                { icon: Users, title: 'Expert Led', desc: 'Masters in Ancient History.' },
                { icon: MapPin, title: 'Local Soul', desc: 'Access to hidden gems.' },
                { icon: Star, title: 'Bespoke', desc: 'Personalized to your interests.' }
              ].map((item, idx) => (
                <div key={idx} className="flex gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center shrink-0 border border-white/10 text-egypt-gold">
                    <item.icon size={20} />
                  </div>
                  <div>
                    <h4 className="font-medium text-egypt-papyrus mb-1">{item.title}</h4>
                    <p className="text-xs text-egypt-papyrus/40 font-light">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <span className="text-label mb-4 block">Guardians of the Experience</span>
            <h2 className="text-5xl font-serif uppercase tracking-tight">Voices of the <span className="text-egypt-gold italic">Enlightened</span></h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { name: 'Julian Thorne', role: 'Architect', text: 'The depth of knowledge brought to the Giza tour was unlike anything I experienced. Truly spiritual.' },
              { name: 'Elena Petrova', role: 'Historian', text: 'A rare bridge between academic rigor and soul-stirring exploration. Travision is in a league of its own.' },
              { name: 'Marcus Chen', role: 'Photographer', text: 'The light, the timing, and the exclusive access made this the trip of a lifetime. Highly recommended.' }
            ].map((test, idx) => (
              <div key={idx} className="glass p-10 rounded-[40px] border border-egypt-gold/10 relative">
                <div className="absolute top-8 right-10 text-6xl font-serif text-egypt-gold/10">"</div>
                <div className="flex gap-1 mb-6">
                  {[...Array(5)].map((_, i) => <Star key={i} size={14} className="text-egypt-gold fill-egypt-gold" />)}
                </div>
                <p className="text-lg italic font-light text-egypt-papyrus/80 mb-8 leading-relaxed">"{test.text}"</p>
                <div>
                  <h4 className="font-serif text-egypt-gold uppercase tracking-widest">{test.name}</h4>
                  <p className="text-[10px] uppercase text-egypt-papyrus/40 tracking-wider font-medium">{test.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto bg-egypt-gold rounded-[60px] p-12 md:p-24 relative overflow-hidden text-center group">
          <div className="absolute inset-0 opacity-10 pointer-events-none">
             <div className="w-full h-full bg-[url('https://www.transparenttextures.com/patterns/hieroglyphs.png')] invert" />
          </div>
          <h2 className="text-4xl md:text-7xl font-serif text-egypt-night uppercase leading-none mb-8 relative z-10">
            Write Your <span className="italic">Own Chapter</span> <br />In history
          </h2>
          <p className="text-egypt-night/70 text-lg max-w-xl mx-auto mb-12 relative z-10">
            Join us on an expedition that refuses to settle for the surface. Secure your spot in our upcoming season.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center relative z-10 transition-transform group-hover:scale-105 duration-500">
            <Link to="/tours" className="bg-egypt-night text-egypt-gold px-12 py-5 rounded-full font-bold uppercase tracking-widest text-sm hover:bg-white transition-colors shadow-2xl">
              Begin Journey
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
