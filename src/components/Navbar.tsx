import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X, Search, Phone, Mail, ChevronDown, Globe } from 'lucide-react';
import { SAMPLE_TOURS } from '../constants';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Categorize tours for dropdowns
  const dayTours = SAMPLE_TOURS.filter(t => t.duration === '1 Day' || t.title.toLowerCase().includes('day trip') || t.title.toLowerCase().includes('day tour') || t.title.toLowerCase().includes('days trip') || t.title.toLowerCase().includes('days tour') || t.title.toLowerCase().includes('overnight trip'));
  const nileCruises = SAMPLE_TOURS.filter(t => t.title.toLowerCase().includes('cruise'));
  const travelPackages = SAMPLE_TOURS.filter(t => {
    const isDayTourItem = t.duration === '1 Day' || t.title.toLowerCase().includes('day trip') || t.title.toLowerCase().includes('day tour') || t.title.toLowerCase().includes('days trip') || t.title.toLowerCase().includes('days tour') || t.title.toLowerCase().includes('overnight trip');
    return !isDayTourItem && !t.title.toLowerCase().includes('cruise');
  }).slice(0, 8);

  const renderDropdown = (category: string, tours: typeof SAMPLE_TOURS) => {
    return (
      <AnimatePresence>
        {activeDropdown === category && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-[120%] left-0 w-[400px] bg-egypt-night/98 backdrop-blur-xl border-t-2 border-egypt-gold shadow-2xl p-4 z-50 rounded-b-lg border border-white/5"
          >
            <div className="grid grid-cols-1 gap-1">
              {tours.map(tour => (
                <Link
                  key={tour.id}
                  to={`/tours/${tour.id}`}
                  className="px-4 py-3 hover:bg-white/5 text-egypt-papyrus font-medium text-sm tracking-wide border-b border-white/5 last:border-0 transition-colors flex items-center gap-3"
                  onClick={() => setActiveDropdown(null)}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-egypt-gold shrink-0"></span>
                  {tour.title}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  };

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
            <Link to="/login" className="hover:text-egypt-gold transition-colors">Login</Link>
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

            <div 
              className="relative h-full flex items-center py-2 cursor-pointer group"
              onMouseEnter={() => setActiveDropdown('packages')}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <Link to="/tours?type=packages" className="text-[11px] tracking-widest uppercase font-bold text-egypt-papyrus/80 group-hover:text-egypt-gold transition-colors flex items-center gap-1">
                Travel Packages <ChevronDown size={12} />
              </Link>
              {renderDropdown('packages', travelPackages)}
            </div>

            <div 
              className="relative h-full flex items-center py-2 cursor-pointer group"
              onMouseEnter={() => setActiveDropdown('daytours')}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <Link to="/tours?type=daytours" className="text-[11px] tracking-widest uppercase font-bold text-egypt-papyrus/80 group-hover:text-egypt-gold transition-colors flex items-center gap-1">
                Day Tours <ChevronDown size={12} />
              </Link>
              {renderDropdown('daytours', dayTours)}
            </div>

            <div 
              className="relative h-full flex items-center py-2 cursor-pointer group"
              onMouseEnter={() => setActiveDropdown('cruises')}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <Link to="/tours?type=cruises" className="text-[11px] tracking-widest uppercase font-bold text-egypt-papyrus/80 group-hover:text-egypt-gold transition-colors flex items-center gap-1">
                Nile Cruises <ChevronDown size={12} />
              </Link>
              {renderDropdown('cruises', nileCruises)}
            </div>

            <Link to="/tours" className="text-[11px] tracking-widest uppercase font-bold text-egypt-papyrus/80 hover:text-egypt-gold transition-colors">
              Shore Excursions
            </Link>

            <Link to="/blog" className="text-[11px] tracking-widest uppercase font-bold text-egypt-papyrus/80 hover:text-egypt-gold transition-colors">
              Reviews
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
               <button className="text-egypt-papyrus/80 hover:text-egypt-gold p-2 transition-colors">
                 <Search size={20} />
               </button>
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
              
              <div className="px-4 py-3 border-b border-white/10">
                <div className="flex justify-between items-center text-xs tracking-widest uppercase font-bold text-egypt-papyrus hover:text-egypt-gold cursor-pointer" onClick={() => setActiveDropdown(activeDropdown === 'm-packages' ? null : 'm-packages')}>
                  <Link to="/tours?type=packages" onClick={() => setIsOpen(false)}>Travel Packages</Link>
                  <ChevronDown size={14} className={activeDropdown === 'm-packages' ? 'rotate-180 transform' : ''} />
                </div>
                <AnimatePresence>
                {activeDropdown === 'm-packages' && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mt-2 pl-4 flex flex-col gap-2 border-l border-egypt-gold/50 overflow-hidden">
                    {travelPackages.map(tour => (
                      <Link key={tour.id} to={`/tours/${tour.id}`} onClick={() => setIsOpen(false)} className="text-sm font-medium text-egypt-papyrus/80 hover:text-egypt-gold py-1">{tour.title}</Link>
                    ))}
                  </motion.div>
                )}
                </AnimatePresence>
              </div>

              <div className="px-4 py-3 border-b border-white/10">
                <div className="flex justify-between items-center text-xs tracking-widest uppercase font-bold text-egypt-papyrus hover:text-egypt-gold cursor-pointer" onClick={() => setActiveDropdown(activeDropdown === 'm-daytours' ? null : 'm-daytours')}>
                  <Link to="/tours?type=daytours" onClick={() => setIsOpen(false)}>Day Tours</Link>
                  <ChevronDown size={14} className={activeDropdown === 'm-daytours' ? 'rotate-180 transform' : ''} />
                </div>
                <AnimatePresence>
                {activeDropdown === 'm-daytours' && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mt-2 pl-4 flex flex-col gap-2 border-l border-egypt-gold/50 overflow-hidden">
                    {dayTours.map(tour => (
                      <Link key={tour.id} to={`/tours/${tour.id}`} onClick={() => setIsOpen(false)} className="text-sm font-medium text-egypt-papyrus/80 hover:text-egypt-gold py-1">{tour.title}</Link>
                    ))}
                  </motion.div>
                )}
                </AnimatePresence>
              </div>

              <div className="px-4 py-3 border-b border-white/10">
                <div className="flex justify-between items-center text-xs tracking-widest uppercase font-bold text-egypt-papyrus hover:text-egypt-gold cursor-pointer" onClick={() => setActiveDropdown(activeDropdown === 'm-cruises' ? null : 'm-cruises')}>
                  <Link to="/tours?type=cruises" onClick={() => setIsOpen(false)}>Nile Cruises</Link>
                  <ChevronDown size={14} className={activeDropdown === 'm-cruises' ? 'rotate-180 transform' : ''} />
                </div>
                <AnimatePresence>
                {activeDropdown === 'm-cruises' && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mt-2 pl-4 flex flex-col gap-2 border-l border-egypt-gold/50 overflow-hidden">
                    {nileCruises.map(tour => (
                      <Link key={tour.id} to={`/tours/${tour.id}`} onClick={() => setIsOpen(false)} className="text-sm font-medium text-egypt-papyrus/80 hover:text-egypt-gold py-1">{tour.title}</Link>
                    ))}
                  </motion.div>
                )}
                </AnimatePresence>
              </div>

              <Link to="/tours" onClick={() => setIsOpen(false)} className="px-4 py-3 text-xs tracking-widest uppercase font-bold text-egypt-papyrus border-b border-white/10 hover:text-egypt-gold">Shore Excursions</Link>
              <Link to="/blog" onClick={() => setIsOpen(false)} className="px-4 py-3 text-xs tracking-widest uppercase font-bold text-egypt-papyrus border-b border-white/10 hover:text-egypt-gold">Reviews</Link>
              
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
