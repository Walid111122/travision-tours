import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X, Search, Phone, Mail, ChevronDown, Globe } from 'lucide-react';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'bg-egypt-night/95 backdrop-blur-lg border-b border-white/5' : 'bg-transparent'}`}>
      {/* Top Contact Bar */}
      <div className={`border-b border-white/10 transition-all duration-500 ${scrolled ? 'hidden' : 'block'}`}>
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-2 flex justify-between items-center text-[10px] tracking-widest uppercase text-egypt-papyrus/70 font-bold">
          <div className="flex items-center gap-6">
            <a href="tel:+201004051515" className="flex items-center gap-2 hover:text-egypt-gold transition-colors">
              <Phone size={12} className="text-egypt-gold" />
              (+20) 100 405 1515
            </a>
            <a href="mailto:info@travisiontours.com" className="hidden sm:flex items-center gap-2 hover:text-egypt-gold transition-colors">
              <Mail size={12} className="text-egypt-gold" />
              info@travisiontours.com
            </a>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/profile" className="hover:text-egypt-gold transition-colors">Profile</Link>
            <div className="flex items-center gap-1 cursor-pointer hover:text-egypt-gold transition-colors">
              Language: English <ChevronDown size={12} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className={`w-full transition-all duration-500 ${scrolled ? 'py-4' : 'py-6'}`}>
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 flex justify-between items-center relative">
          
          {/* Logo */}
          <Link to="/" className="flex flex-col items-center group z-10 relative">
            <div className="flex items-center text-egypt-papyrus group-hover:text-white transition-colors">
              <span className="font-serif text-3xl md:text-4xl tracking-[0.25em] font-light pl-[0.25em]">TRAVISION</span>
            </div>
            <div className="flex items-center gap-4 mt-[-4px]">
              <div className="h-[1px] w-6 md:w-10 bg-gradient-to-r from-transparent to-egypt-gold/60"></div>
              <div className="text-egypt-gold transform group-hover:rotate-[360deg] transition-transform duration-1000">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z" />
                  <circle cx="12" cy="12" r="4" fill="currentColor" className="opacity-30" />
                  <path d="M12 6v2M12 16v2M6 12h2M16 12h2" />
                  <path d="M12 2v20" className="opacity-20" />
                  <path d="M2 12h20" className="opacity-20" />
                </svg>
              </div>
              <span className="font-serif text-xl md:text-2xl tracking-[0.4em] font-light text-egypt-gold mr-[-0.4em]">TOURS</span>
              <div className="h-[1px] w-6 md:w-10 bg-gradient-to-l from-transparent to-egypt-gold/60"></div>
            </div>
            <div className="flex items-center mt-2">
              <span className="text-egypt-gold/60 text-[8px] tracking-[0.6em] font-medium uppercase leading-none pl-[0.6em]">Since 2010</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center h-full gap-2 xl:gap-8">
            <Link to="/" className="text-[11px] tracking-widest uppercase font-bold text-egypt-papyrus/80 hover:text-egypt-gold transition-colors">
              Home
            </Link>

            <Link to="/tours?type=packages" className="text-[11px] tracking-widest uppercase font-bold text-egypt-papyrus/80 hover:text-egypt-gold transition-colors">
              Travel Packages
            </Link>

            <Link to="/tours?type=daytours" className="text-[11px] tracking-widest uppercase font-bold text-egypt-papyrus/80 hover:text-egypt-gold transition-colors">
              Day Tours
            </Link>

            <Link to="/tours?type=cruises" className="text-[11px] tracking-widest uppercase font-bold text-egypt-papyrus/80 hover:text-egypt-gold transition-colors">
              Nile Cruises
            </Link>

            <Link to="/tours?type=shore" className="text-[11px] tracking-widest uppercase font-bold text-egypt-papyrus/80 hover:text-egypt-gold transition-colors">
              Shore Excursions
            </Link>

            <Link to="/blog" className="text-[11px] tracking-widest uppercase font-bold text-egypt-papyrus/80 hover:text-egypt-gold transition-colors">
              Blog
            </Link>
          </div>

          {/* Right Action Icons & Button */}
          <div className="hidden lg:flex items-center gap-6">
            <div className="flex items-center gap-4">
               {/* ISO fake badge */}
               <div className="flex flex-col items-center justify-center w-10 h-10 text-egypt-gold border border-egypt-gold/50 rounded-full bg-white/5 relative">
                 <Globe size={20} />
                 <span className="text-[7px] font-black absolute bg-egypt-night px-1 -bottom-2 border border-egypt-gold/50 rounded">ISO</span>
               </div>
               <Link to="/tours" aria-label="Search tours" className="text-egypt-papyrus/80 hover:text-egypt-gold p-2 transition-colors">
                 <Search size={20} />
               </Link>
            </div>
            
            <Link 
              to="/planner" 
              className="bg-egypt-gold text-egypt-night px-6 py-3 rounded text-[11px] uppercase tracking-widest font-black hover:bg-white transition-all"
            >
              Tailor-Made Tour
            </Link>
          </div>

          {/* Mobile Toggle */}
          <button 
            className="lg:hidden text-egypt-papyrus"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="absolute top-full left-0 right-0 bg-egypt-night/95 backdrop-blur-xl border-t border-white/10 shadow-2xl lg:hidden overflow-hidden flex flex-col"
          >
            <div className="p-4 flex flex-col gap-2">
              <Link to="/" onClick={() => setIsOpen(false)} className="px-4 py-3 text-xs tracking-widest uppercase font-bold text-egypt-papyrus border-b border-white/10 hover:text-egypt-gold">Home</Link>
              
              <Link to="/tours?type=packages" onClick={() => setIsOpen(false)} className="px-4 py-3 text-xs tracking-widest uppercase font-bold text-egypt-papyrus border-b border-white/10 hover:text-egypt-gold">Travel Packages</Link>
              <Link to="/tours?type=daytours" onClick={() => setIsOpen(false)} className="px-4 py-3 text-xs tracking-widest uppercase font-bold text-egypt-papyrus border-b border-white/10 hover:text-egypt-gold">Day Tours</Link>
              <Link to="/tours?type=cruises" onClick={() => setIsOpen(false)} className="px-4 py-3 text-xs tracking-widest uppercase font-bold text-egypt-papyrus border-b border-white/10 hover:text-egypt-gold">Nile Cruises</Link>

              <Link to="/tours?type=shore" onClick={() => setIsOpen(false)} className="px-4 py-3 text-xs tracking-widest uppercase font-bold text-egypt-papyrus border-b border-white/10 hover:text-egypt-gold">Shore Excursions</Link>
              <Link to="/blog" onClick={() => setIsOpen(false)} className="px-4 py-3 text-xs tracking-widest uppercase font-bold text-egypt-papyrus border-b border-white/10 hover:text-egypt-gold">Blog</Link>
              
              <Link to="/planner" onClick={() => setIsOpen(false)} className="mt-6 bg-egypt-gold text-egypt-night px-6 py-4 rounded text-center text-xs font-black uppercase tracking-widest hover:bg-white transition-colors">
                Tailor-Made Tour
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
