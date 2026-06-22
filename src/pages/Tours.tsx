import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Filter, SlidersHorizontal, Star, Calendar, MapPin, X } from 'lucide-react';
import { SAMPLE_TOURS } from '../constants';
import { Link, useLocation } from 'react-router-dom';
import SEO from '../components/SEO';

const Tours = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialDuration = searchParams.get('duration') || 'all';
  const initialType = searchParams.get('type') || 'all';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [maxPrice, setMaxPrice] = useState<number>(5000);
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [selectedDuration, setSelectedDuration] = useState<string>(initialDuration);
  const [selectedType, setSelectedType] = useState<string>(initialType);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setSelectedDuration(params.get('duration') || 'all');
    setSelectedType(params.get('type') || 'all');
  }, [location.search]);

  // Reset current page when any filter query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, maxPrice, selectedCity, selectedDuration, selectedType, selectedRegion]);

  const categories = ['all', 'historical', 'cultural', 'adventure', 'spiritual'];
  const cities = ['all', 'Cairo', 'Luxor', 'Aswan', 'Alexandria', 'Hurghada', 'Sharm El Sheikh'];
  const durations = ['all', '1 Day', '2-4 Days', '5+ Days'];

  const regions = [
    { id: 'all', title: 'All Regions' },
    { id: 'cairo', title: 'Cairo & Giza' },
    { id: 'luxor', title: 'Luxor & Valley' },
    { id: 'aswan', title: 'Aswan & Abu Simbel' },
    { id: 'redsea', title: 'Red Sea Coast' },
    { id: 'alexandria', title: 'Alexandria' },
    { id: 'cruises', title: 'Nile Cruises' }
  ];

  const filteredTours = useMemo(() => {
    return SAMPLE_TOURS.filter(tour => {
      const matchesSearch = tour.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            tour.location.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || tour.category === selectedCategory;
      const matchesPrice = tour.price <= maxPrice;
      const matchesCity = selectedCity === 'all' || tour.location.toLowerCase().includes(selectedCity.toLowerCase());
      
      let matchesDuration = true;
      if (selectedDuration !== 'all') {
        const daysMatch = tour.duration.match(/\d+/);
        const days = daysMatch ? parseInt(daysMatch[0]) : 0;
        if (selectedDuration === '1 Day') matchesDuration = days === 1;
        else if (selectedDuration === '2-4 Days') matchesDuration = days >= 2 && days <= 4;
        else if (selectedDuration === '5+ Days') matchesDuration = days >= 5;
      }

      let matchesType = true;
      const isDayTourItem = tour.duration === '1 Day' || tour.title.toLowerCase().includes('day trip') || tour.title.toLowerCase().includes('day tour') || tour.title.toLowerCase().includes('days trip') || tour.title.toLowerCase().includes('days tour') || tour.title.toLowerCase().includes('overnight trip');

      if (selectedType === 'packages') {
        matchesType = !isDayTourItem && !tour.title.toLowerCase().includes('cruise');
      } else if (selectedType === 'cruises') {
        matchesType = tour.title.toLowerCase().includes('cruise');
      } else if (selectedType === 'daytours') {
        matchesType = isDayTourItem;
      }
      
      return matchesSearch && matchesCategory && matchesPrice && matchesCity && matchesDuration && matchesType;
    });
  }, [searchQuery, selectedCategory, maxPrice, selectedCity, selectedDuration, selectedType]);

  const regionFilteredTours = useMemo(() => {
    return filteredTours.filter(tour => {
      if (selectedRegion === 'all') return true;
      const loc = tour.location.toLowerCase();
      const title = tour.title.toLowerCase();
      const desc = tour.description.toLowerCase();
      
      if (selectedRegion === 'cruises') {
        return title.includes('cruise') || desc.includes('cruise');
      }
      if (selectedRegion === 'cairo') {
        return loc.includes('cairo') || loc.includes('giza');
      }
      if (selectedRegion === 'luxor') {
        return loc.includes('luxor');
      }
      if (selectedRegion === 'aswan') {
        return loc.includes('aswan') || loc.includes('abu simbel');
      }
      if (selectedRegion === 'redsea') {
        return loc.includes('hurghada') || loc.includes('sharm') || loc.includes('marsa') || loc.includes('gouna');
      }
      if (selectedRegion === 'alexandria') {
        return loc.includes('alexandria') || loc.includes('alex');
      }
      return true;
    });
  }, [filteredTours, selectedRegion]);

  const itemsPerPage = 9;
  const totalPages = Math.ceil(regionFilteredTours.length / itemsPerPage);
  const paginatedTours = useMemo(() => {
    const startIdx = (currentPage - 1) * itemsPerPage;
    return regionFilteredTours.slice(startIdx, startIdx + itemsPerPage);
  }, [regionFilteredTours, currentPage]);

  return (
    <div className="pt-32 pb-20 px-6 max-w-7xl mx-auto">
      <SEO 
        title="Bespoke Egyptian Tours" 
        description="Browse our curated historical and cultural expeditions across Cairo, Luxor, and Aswan."
      />
      <header className="mb-16">

        <span className="text-label mb-4 block">Our Expeditions</span>
        <h1 className="text-5xl md:text-7xl font-serif uppercase mb-6">Discover the <span className="text-egypt-gold">Unseen</span></h1>
        
        {/* Search & Filter Bar */}
        <div className="flex flex-col md:flex-row gap-6 mt-12 bg-egypt-basalt p-4 rounded-[30px] border border-white/5 glass">
          <div className="flex-grow relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-egypt-gold/50" size={20} />
            <input 
              type="text" 
              placeholder="Search by city or landmark..." 
              className="w-full bg-transparent border-none focus:ring-0 pl-12 h-14 text-egypt-papyrus placeholder:text-egypt-papyrus/20"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="flex items-center gap-2 px-6 h-14 rounded-full border border-white/10 hover:border-egypt-gold transition-all text-sm uppercase tracking-widest font-medium"
            >
              <SlidersHorizontal size={18} className="text-egypt-gold" />
              Filters
            </button>
            <div className="hidden lg:flex items-center gap-2">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-6 h-14 rounded-full text-[10px] uppercase tracking-widest font-bold transition-all ${
                    selectedCategory === cat ? 'bg-egypt-gold text-egypt-night' : 'bg-white/5 hover:bg-white/10 text-egypt-papyrus/60'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Filter Drawer (Mobile/Detailed) */}
        <AnimatePresence>
          {isFilterOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mt-6"
            >
              <div className="bg-egypt-basalt rounded-[30px] p-8 border border-white/5 glass grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-10">
                <div>
                  <h4 className="text-xs uppercase tracking-widest text-egypt-gold font-bold mb-6">Price Range</h4>
                  <input 
                    type="range" 
                    min="0" 
                    max="5000" 
                    step="50"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(parseInt(e.target.value))}
                    className="w-full h-2 bg-egypt-night rounded-lg appearance-none cursor-pointer accent-egypt-gold"
                  />
                  <div className="flex justify-between mt-4 text-xs font-mono text-egypt-papyrus/40">
                    <span>$0</span>
                    <span className="text-egypt-gold font-bold uppercase tracking-widest">Under ${maxPrice}</span>
                    <span>$5000</span>
                  </div>
                </div>

                <div className="lg:hidden">
                  <h4 className="text-xs uppercase tracking-widest text-egypt-gold font-bold mb-6">Category</h4>
                  <div className="flex flex-wrap gap-2">
                    {categories.map(cat => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-4 py-2 rounded-full text-[10px] uppercase tracking-widest font-bold transition-all ${
                          selectedCategory === cat ? 'bg-egypt-gold text-egypt-night' : 'border border-white/10 text-egypt-papyrus/60'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                   <h4 className="text-xs uppercase tracking-widest text-egypt-gold font-bold mb-6">City</h4>
                   <div className="flex flex-wrap gap-2">
                      {cities.map(city => (
                        <button 
                          key={city}
                          onClick={() => setSelectedCity(city)}
                          className={`px-4 py-2 rounded-full text-[10px] uppercase tracking-widest font-bold transition-all ${
                            selectedCity === city ? 'bg-egypt-gold text-egypt-night' : 'border border-white/10 text-egypt-papyrus/60'
                          }`}
                        >
                          {city}
                        </button>
                      ))}
                   </div>
                </div>

                <div>
                   <h4 className="text-xs uppercase tracking-widest text-egypt-gold font-bold mb-6">Duration</h4>
                   <div className="flex flex-wrap gap-2">
                      {durations.map(duration => (
                        <button 
                          key={duration}
                          onClick={() => setSelectedDuration(duration)}
                          className={`px-4 py-2 rounded-full text-[10px] uppercase tracking-widest font-bold transition-all ${
                            selectedDuration === duration ? 'bg-egypt-gold text-egypt-night' : 'border border-white/10 text-egypt-papyrus/60'
                          }`}
                        >
                          {duration}
                        </button>
                      ))}
                   </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Region Navigation Tabs */}
      <div className="sticky top-24 z-30 mb-16 bg-egypt-night/85 backdrop-blur-md py-4 border-y border-white/5 flex gap-3 overflow-x-auto no-scrollbar justify-start md:justify-center">
        {regions.map(region => (
          <button
            key={region.id}
            onClick={() => setSelectedRegion(region.id)}
            className={`px-5 py-2.5 rounded-full border text-[10px] uppercase tracking-wider font-bold transition-all whitespace-nowrap ${
              selectedRegion === region.id
                ? 'bg-egypt-gold text-egypt-night border-egypt-gold'
                : 'border-white/5 bg-white/5 hover:bg-egypt-gold/10 hover:border-egypt-gold/30 text-egypt-papyrus'
            }`}
          >
            {region.title}
          </button>
        ))}
      </div>

      {/* Tours Grid */}
      {paginatedTours.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
          {paginatedTours.map((tour, idx) => (
            <motion.div
              key={`${tour.id}-${currentPage}`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: (idx % 9) * 0.05 }}
              className="group"
            >
              <Link to={`/tours/${tour.id}`}>
                <div className="relative aspect-[4/5] rounded-[40px] overflow-hidden mb-6 border border-white/5">
                   <img src={tour.image} alt={tour.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                   <div className="absolute inset-0 bg-gradient-to-t from-egypt-night via-transparent to-transparent opacity-80" />
                   
                   <div className="absolute top-6 left-6 flex gap-2 z-10 transition-opacity duration-300 group-hover:opacity-0">
                      {tour.featured && (
                        <span className="bg-egypt-gold text-egypt-night text-[8px] font-black uppercase tracking-tighter px-3 py-1 rounded-full">Featured</span>
                      )}
                      <span className="glass px-3 py-1 rounded-full text-[8px] uppercase font-bold tracking-widest">{tour.category}</span>
                   </div>

                   <div className="absolute bottom-10 left-10 right-10 z-10 transition-opacity duration-300 group-hover:opacity-0">
                      <div className="flex items-center gap-2 mb-2 text-egypt-gold/80">
                        <MapPin size={14} />
                        <span className="text-[10px] uppercase font-bold tracking-widest">{tour.location}</span>
                      </div>
                      <h3 className="text-3xl font-serif text-white leading-tight">{tour.title}</h3>
                   </div>

                   <div className="absolute inset-0 bg-egypt-night/90 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-center items-center text-center p-8 z-20 translate-y-4 group-hover:translate-y-0">
                     <div className="flex gap-1 mb-2">
                       {[...Array(5)].map((_, i) => (
                         <Star key={i} size={16} className={`text-egypt-gold ${i < Math.floor(tour.rating) ? 'fill-egypt-gold' : ''}`} />
                       ))}
                     </div>
                     <span className="text-2xl font-serif text-white mb-1">{tour.rating}</span>
                     <span className="text-[10px] uppercase tracking-[2px] text-egypt-gold mb-6 font-bold">{tour.reviewsCount} Reviews</span>
                     
                     <div className="w-12 h-[1px] bg-egypt-gold/30 mb-6" />
                     
                     <p className="text-[13px] font-light text-egypt-papyrus/80 leading-relaxed italic line-clamp-5">
                       "{tour.description}"
                     </p>
                   </div>
                </div>
                <div className="px-4 flex justify-between items-center">
                   <div className="flex flex-col">
                      <span className="text-2xl font-serif text-egypt-gold">${tour.price}</span>
                      <div className="flex items-center gap-2 text-egypt-papyrus/40 text-[10px] uppercase tracking-widest mt-1">
                         <Calendar size={12} />
                         {tour.duration}
                      </div>
                   </div>
                   <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/5">
                      <Star size={14} className="text-egypt-gold fill-egypt-gold" />
                      <span className="text-xs font-bold">{tour.rating}</span>
                      <span className="text-[10px] text-egypt-papyrus/30">({tour.reviewsCount})</span>
                   </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-3 mt-24">
          <button
            disabled={currentPage === 1}
            onClick={() => {
              setCurrentPage(prev => Math.max(prev - 1, 1));
              window.scrollTo({ top: 300, behavior: 'smooth' });
            }}
            className="w-12 h-12 rounded-full border border-white/10 hover:border-egypt-gold transition-all flex items-center justify-center disabled:opacity-30 disabled:hover:border-white/10 text-egypt-papyrus"
          >
            &larr;
          </button>
          
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(pageNum => pageNum === 1 || pageNum === totalPages || Math.abs(pageNum - currentPage) <= 1)
            .map((pageNum, idx, arr) => {
              const prevPage = arr[idx - 1];
              const showEllipsis = prevPage && pageNum - prevPage > 1;
              return (
                <React.Fragment key={pageNum}>
                  {showEllipsis && <span className="text-egypt-papyrus/30 px-1 font-bold">...</span>}
                  <button
                    onClick={() => {
                      setCurrentPage(pageNum);
                      window.scrollTo({ top: 300, behavior: 'smooth' });
                    }}
                    className={`w-12 h-12 rounded-full font-bold text-xs tracking-wider transition-all border ${
                      currentPage === pageNum
                        ? 'bg-egypt-gold text-egypt-night border-egypt-gold'
                        : 'border-white/10 hover:border-egypt-gold text-egypt-papyrus/80'
                    }`}
                  >
                    {pageNum}
                  </button>
                </React.Fragment>
              );
            })}
          
          <button
            disabled={currentPage === totalPages}
            onClick={() => {
              setCurrentPage(prev => Math.min(prev + 1, totalPages));
              window.scrollTo({ top: 300, behavior: 'smooth' });
            }}
            className="w-12 h-12 rounded-full border border-white/10 hover:border-egypt-gold transition-all flex items-center justify-center disabled:opacity-30 disabled:hover:border-white/10 text-egypt-papyrus"
          >
            &rarr;
          </button>
        </div>
      )}

      {(filteredTours.length === 0 || regionFilteredTours.length === 0) && (
        <div className="py-20 text-center">
          <h3 className="text-2xl font-serif text-egypt-gold mb-4 uppercase">No Journeys Found</h3>
          <p className="text-egypt-papyrus/40 font-light">Adjust your filters to discover other paths.</p>
          <button 
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
              setSelectedCity('all');
              setSelectedDuration('all');
              setSelectedType('all');
              setSelectedRegion('all');
              setMaxPrice(5000);
            }}
            className="mt-8 text-egypt-gold uppercase tracking-[3px] text-xs font-bold border-b border-egypt-gold/30 pb-2"
          >
            Reset Explorations
          </button>
        </div>
      )}
    </div>
  );
};

export default Tours;
