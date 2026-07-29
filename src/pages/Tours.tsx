import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Filter, SlidersHorizontal, Star, Calendar, MapPin, X, LayoutGrid, List, ChevronRight } from 'lucide-react';
import { SAMPLE_TOURS } from '../constants';
import { DAY_TOURS, POPULAR_DAY_TOURS, DAY_TOUR_DESTINATIONS } from '../dayTours';
import { Link, useLocation } from 'react-router-dom';
import SEO from '../components/SEO';
import { getTourSummary } from '../utils/tourContent';

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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedDestination, setSelectedDestination] = useState<string>('all');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setSelectedDuration(params.get('duration') || 'all');
    setSelectedType(params.get('type') || 'all');
  }, [location.search]);

  // Reset current page when any filter query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, maxPrice, selectedCity, selectedDuration, selectedType, selectedRegion, selectedDestination]);

  // Reset selected region when type changes
  useEffect(() => {
    setSelectedRegion('all');
  }, [selectedType]);

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

  const shoreRegions = [
    { id: 'all', title: 'All Cities' },
    { id: 'hurghada', title: 'Hurghada' },
    { id: 'sharm', title: 'Sharm El Sheikh' },
    { id: 'marsa', title: 'Marsa Alam' },
    { id: 'gouna', title: 'El Gouna' },
    { id: 'makadi', title: 'Makadi Bay' },
    { id: 'soma', title: 'Soma Bay' },
    { id: 'port ghalib', title: 'Port Ghalib' }
  ];

  const activeTabs = selectedType === 'shore' ? shoreRegions : regions;

  const filteredTours = useMemo(() => {
    const sourceTours = selectedType === 'shore' ? DAY_TOURS : SAMPLE_TOURS;
    return sourceTours.filter(tour => {
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
        matchesType = !isDayTourItem;
      } else if (selectedType === 'cruises') {
        matchesType = tour.title.toLowerCase().includes('cruise');
      } else if (selectedType === 'daytours') {
        matchesType = isDayTourItem;
      } else if (selectedType === 'shore') {
        const isSeaTrip = tour.location.toLowerCase().includes('hurghada') || 
                          tour.location.toLowerCase().includes('sharm') || 
                          tour.location.toLowerCase().includes('marsa') || 
                          tour.location.toLowerCase().includes('gouna') || 
                          tour.location.toLowerCase().includes('makadi') || 
                          tour.location.toLowerCase().includes('soma') || 
                          tour.location.toLowerCase().includes('port ghalib') ||
                          tour.category === 'adventure';
        matchesType = isSeaTrip;
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
      
      if (selectedType === 'shore') {
        return loc.includes(selectedRegion.toLowerCase());
      }
      
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
  }, [filteredTours, selectedRegion, selectedType]);

  const itemsPerPage = 12;
  const totalPages = Math.ceil(regionFilteredTours.length / itemsPerPage);
  const paginatedTours = useMemo(() => {
    const startIdx = (currentPage - 1) * itemsPerPage;
    return regionFilteredTours.slice(startIdx, startIdx + itemsPerPage);
  }, [regionFilteredTours, currentPage]);

  // Day tours special layout data
  const isDayToursPage = selectedType === 'daytours';
  const isShorePage = selectedType === 'shore';

  // Day-tour datasets
  const popularDayTours = useMemo(
    () => POPULAR_DAY_TOURS.map(id => DAY_TOURS.find(t => t.id === id)).filter(Boolean) as typeof DAY_TOURS,
    []
  );

  const dayToursByDestination = useMemo(() => {
    if (selectedDestination === 'all') return DAY_TOURS;
    const dest = DAY_TOUR_DESTINATIONS.find(d => d.id === selectedDestination);
    if (!dest) return DAY_TOURS;
    return DAY_TOURS.filter(t =>
      dest.match.some(m => t.location.toLowerCase().includes(m))
    );
  }, [selectedDestination]);

  return (
    <div className="overflow-hidden bg-egypt-night min-h-screen">
      <SEO 
        title={
          isDayToursPage 
            ? "Egypt Day Tours & Excursions" 
            : isShorePage 
              ? "Egypt Shore Excursions & Sea Trips" 
              : "Bespoke Egyptian Tours"
        } 
        description={
          isDayToursPage 
            ? "Discover Egypt's top attractions with our seamless Egypt day tours and excursions from Cairo, Luxor, and Aswan." 
            : isShorePage 
              ? "Discover the best sea trips, snorkeling, and diving excursions along the beautiful Red Sea coast." 
              : "Browse our curated historical and cultural expeditions across Cairo, Luxor, and Aswan."
        }
        canonical={
          isDayToursPage
            ? '/tours?type=daytours'
            : isShorePage
              ? '/tours?type=shore'
              : selectedType === 'cruises'
                ? '/tours?type=cruises'
                : selectedType === 'packages'
                  ? '/tours?type=packages'
                  : '/tours'
        }
        image="/hero.jpg"
        imageAlt="Egypt tours at the Pyramids of Giza"
      />

      {/* Hero Section */}
      <section className="relative h-[60vh] min-h-[400px] flex items-center pt-20 px-6">
        <div className="absolute inset-0 z-0">
          <img 
            src="/hero.jpg?v=2" 
            alt="Travision Tours Group at Pyramids of Giza"
            className="w-full h-full object-cover opacity-100"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-egypt-night/20 via-egypt-night/60 to-egypt-night" />
        </div>

        <div className="max-w-7xl mx-auto w-full relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <span className="text-label mb-4 block">
              {isDayToursPage ? 'Day Excursions' : isShorePage ? 'Sea Trips & Excursions' : 'Our Expeditions'}
            </span>
            <h1 className="text-5xl md:text-7xl font-serif uppercase text-white leading-tight">
              {isDayToursPage ? (
                <>Egypt <span className="text-egypt-gold italic font-light">Day Tours</span></>
              ) : isShorePage ? (
                <>Shore <span className="text-egypt-gold italic font-light">Excursions</span></>
              ) : (
                <>Discover the <span className="text-egypt-gold italic font-light">Unseen</span></>
              )}
            </h1>
            <p className="text-egypt-papyrus/70 text-sm md:text-base font-light max-w-xl mt-4 leading-relaxed">
              {isDayToursPage
                ? 'Expertly guided single-day excursions from Cairo, Luxor, Aswan, and beyond — tailored for every traveler.'
                : isShorePage
                  ? 'Discover premium snorkeling, diving, and marine adventures along Hurghada, Sharm El Sheikh, and the Red Sea.'
                  : 'Browse our curated historical and cultural expeditions across Cairo, Luxor, and Aswan.'}
            </p>
          </motion.div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 pb-20 mt-12">

        {/* ============================================================
            DAY TOURS SPECIAL LAYOUT
        ============================================================ */}
        {isDayToursPage ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {/* Intro */}
            <div className="max-w-3xl mx-auto text-center mb-16 mt-4">
              <p className="text-egypt-papyrus/60 font-light leading-relaxed text-sm md:text-base">
                Discover Egypt's most iconic sights on our seamless day tours and
                excursions. Departing from any Egyptian city, each journey is led
                by an expert Egyptologist guide for a perfect, hassle-free
                adventure through the cradle of civilization.
              </p>
            </div>

            {/* Day-tour planning banner */}
            <div className="mb-20 relative rounded-[40px] overflow-hidden border border-egypt-gold/20 shadow-[0_0_30px_rgba(207,174,125,0.08)]">
              <img
                src="/hero.jpg?v=2"
                alt="Egypt Day Tours"
                className="w-full h-[160px] md:h-[200px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-egypt-night via-egypt-night/80 to-egypt-night/40 flex items-center justify-between px-8 md:px-16">
                <div className="font-serif max-w-xl">
                  <p className="text-egypt-gold text-2xl md:text-4xl italic">Plan Your</p>
                  <p className="text-white text-2xl md:text-4xl italic font-bold">Egypt Day Tour</p>
                  <p className="mt-3 text-xs md:text-sm text-white/70 font-sans">
                    Compare destinations and request a quotation for your preferred date and group size.
                  </p>
                </div>
              </div>
            </div>

            {/* Most Popular Booking Table */}
            <div className="mb-20">
              <div className="text-center mb-10">
                <span className="text-label mb-3 block">Quick Reference</span>
                <h2 className="text-3xl md:text-4xl font-serif uppercase text-white">
                  Day Tour <span className="text-egypt-gold italic font-light">Comparison</span>
                </h2>
                <p className="text-egypt-papyrus/40 text-xs mt-3 max-w-xl mx-auto">
                  Compare indicative prices and durations, then request current availability and a written quotation.
                </p>
              </div>

              <div className="overflow-x-auto rounded-[24px] border border-white/10 glass">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10 bg-egypt-gold/10">
                      <th className="text-left px-6 py-4 text-[11px] uppercase tracking-widest font-bold text-egypt-gold">Tour Name</th>
                      <th className="text-center px-6 py-4 text-[11px] uppercase tracking-widest font-bold text-egypt-gold">Duration</th>
                      <th className="text-center px-6 py-4 text-[11px] uppercase tracking-widest font-bold text-egypt-gold">Estimate From</th>
                      <th className="text-center px-6 py-4 text-[11px] uppercase tracking-widest font-bold text-egypt-gold">View Tour</th>
                    </tr>
                  </thead>
                  <tbody>
                    {popularDayTours.map((tour, idx) => (
                      <tr
                        key={tour.id}
                        className={`border-b border-white/5 hover:bg-egypt-gold/5 transition-colors ${idx % 2 === 0 ? 'bg-white/[0.02]' : ''}`}
                      >
                        <td className="px-6 py-4">
                          <Link to={`/tours/${tour.id}`} className="text-egypt-papyrus hover:text-egypt-gold transition-colors font-medium text-sm">
                            {tour.title}
                          </Link>
                        </td>
                        <td className="px-6 py-4 text-center text-egypt-papyrus/70 text-sm">{tour.duration}</td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-egypt-gold font-serif text-base">US${tour.price}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <Link
                            to={`/tours/${tour.id}`}
                            className="text-[10px] uppercase tracking-widest font-bold text-egypt-gold hover:text-white border border-egypt-gold/30 hover:border-egypt-gold hover:bg-egypt-gold/10 px-4 py-2 rounded-full transition-all"
                          >
                            View Tour
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Check Your Day Tour by Destination */}
            <div className="mb-24">
              <div className="text-center mb-12">
                <span className="text-label mb-3 block">Pick a City</span>
                <h2 className="text-3xl md:text-4xl font-serif uppercase text-white">
                  Check Your Day Tour <span className="text-egypt-gold italic font-light">by Destination</span>
                </h2>
                <p className="text-egypt-papyrus/40 text-xs mt-3 max-w-xl mx-auto">
                  Select your base city to see the excursions available from there.
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
                <button
                  onClick={() => setSelectedDestination('all')}
                  className={`group relative aspect-square rounded-[24px] overflow-hidden border transition-all ${
                    selectedDestination === 'all'
                      ? 'border-egypt-gold shadow-lg shadow-egypt-gold/10'
                      : 'border-white/5 hover:border-egypt-gold/40'
                  }`}
                >
                  <img
                    src="/hero.jpg?v=2"
                    alt="All Destinations"
                    className="w-full h-full object-cover opacity-40 group-hover:opacity-60 group-hover:scale-110 transition-all duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-egypt-night via-egypt-night/50 to-transparent" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-2 text-center">
                    <MapPin size={20} className="text-egypt-gold mb-2" />
                    <span className="font-serif text-sm md:text-base text-white uppercase tracking-wide leading-tight">All Destinations</span>
                    <span className="text-[9px] text-egypt-papyrus/50 mt-1">{DAY_TOURS.length} tours</span>
                  </div>
                </button>

                {DAY_TOUR_DESTINATIONS.map(dest => {
                  const count = DAY_TOURS.filter(t =>
                    dest.match.some(m => t.location.toLowerCase().includes(m))
                  ).length;
                  return (
                    <button
                      key={dest.id}
                      onClick={() => setSelectedDestination(dest.id)}
                      className={`group relative aspect-square rounded-[24px] overflow-hidden border transition-all ${
                        selectedDestination === dest.id
                          ? 'border-egypt-gold shadow-lg shadow-egypt-gold/10'
                          : 'border-white/5 hover:border-egypt-gold/40'
                      }`}
                    >
                      <img
                        src={dest.image}
                        alt={dest.title}
                        className="w-full h-full object-cover opacity-50 group-hover:opacity-70 group-hover:scale-110 transition-all duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-egypt-night via-egypt-night/50 to-transparent" />
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-2 text-center">
                        <MapPin size={20} className="text-egypt-gold mb-2" />
                        <span className="font-serif text-sm md:text-base text-white uppercase tracking-wide leading-tight">{dest.title}</span>
                        <span className="text-[9px] text-egypt-papyrus/50 mt-1">{count} tour{count !== 1 ? 's' : ''}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Active destination indicator / clear filter */}
              {selectedDestination !== 'all' && (
                <div className="flex justify-center mt-8">
                  <button
                    onClick={() => setSelectedDestination('all')}
                    className="text-[10px] uppercase tracking-widest font-bold text-egypt-gold border border-egypt-gold/30 hover:border-egypt-gold hover:bg-egypt-gold/10 px-5 py-2 rounded-full transition-all flex items-center gap-2"
                  >
                    <X size={12} /> Clear Destination Filter
                  </button>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="flex items-center gap-6 mb-16">
              <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent to-egypt-gold/30" />
              <span className="text-egypt-gold/60 text-[10px] uppercase tracking-[4px] font-bold">All Day Excursions</span>
              <div className="flex-1 h-[1px] bg-gradient-to-l from-transparent to-egypt-gold/30" />
            </div>

            {/* Card Grid */}
            <div className="text-center mb-12">
              <span className="text-label mb-3 block">Choose Your Excursion</span>
              <h2 className="text-3xl md:text-4xl font-serif uppercase text-white">
                {selectedDestination === 'all'
                  ? <>Popular Egypt <span className="text-egypt-gold italic font-light">Day Excursions</span></>
                  : <>{DAY_TOUR_DESTINATIONS.find(d => d.id === selectedDestination)?.title} <span className="text-egypt-gold italic font-light">Day Excursions</span></>
                }
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {dayToursByDestination.map((tour, idx) => (
                <motion.div
                  key={tour.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.06, duration: 0.5 }}
                  className="group bg-egypt-basalt/60 rounded-[28px] border border-white/5 hover:border-egypt-gold/30 overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-egypt-gold/5 flex flex-col"
                >
                  {/* Card Image */}
                  <div className="relative overflow-hidden aspect-[16/10]">
                    <img
                      src={tour.image}
                      alt={tour.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-egypt-night/60 to-transparent" />

                    {/* Price Badge */}
                    <div className="absolute top-4 left-4 bg-egypt-gold text-egypt-night px-3 py-1.5 rounded-full">
                      <span className="text-[9px] uppercase tracking-wider font-bold block leading-none mb-0.5">Estimate</span>
                      <span className="text-sm font-black leading-none">US${tour.price}</span>
                    </div>

                    {/* Category Badge */}
                    <div className="absolute top-4 right-4 glass px-3 py-1 rounded-full border border-white/10">
                      <span className="text-[9px] uppercase tracking-widest font-bold text-white">{tour.category}</span>
                    </div>

                    {/* Availability */}
                    <div className="absolute bottom-4 left-4 flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-egypt-gold" />
                      <span className="text-[9px] uppercase tracking-wider font-bold text-egypt-gold">Availability on request</span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-6 flex flex-col flex-1">
                    <Link to={`/tours/${tour.id}`}>
                      <h3 className="text-lg font-serif text-white group-hover:text-egypt-gold transition-colors leading-snug mb-2">
                        {tour.title}
                      </h3>
                    </Link>

                    <p className="text-egypt-papyrus/50 text-xs font-light leading-relaxed mb-4 line-clamp-2 flex-1">
                      {getTourSummary(tour)}
                    </p>

                    {/* Location */}
                    <div className="flex items-center gap-2 mb-4 text-egypt-papyrus/50 text-[11px] uppercase tracking-wider">
                      <MapPin size={12} className="text-egypt-gold/70 shrink-0" />
                      <span className="line-clamp-1">{tour.location}</span>
                    </div>

                    {/* Tour Meta */}
                    <div className="grid grid-cols-2 gap-3 py-4 border-t border-b border-white/5 mb-5">
                      <div>
                        <span className="text-[9px] uppercase tracking-widest text-egypt-papyrus/30 font-bold block mb-1">Duration</span>
                        <div className="flex items-center gap-1.5">
                          <Calendar size={12} className="text-egypt-gold/70" />
                          <span className="text-xs text-egypt-papyrus/80 font-medium">{tour.duration}</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase tracking-widest text-egypt-papyrus/30 font-bold block mb-1">Tour Type</span>
                        <div className="flex items-center gap-1.5">
                          <Star size={12} className="text-egypt-gold/70" />
                          <span className="text-xs text-egypt-papyrus/80 font-medium">Private</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end">
                      <Link
                        to={`/tours/${tour.id}`}
                        className="bg-egypt-gold text-egypt-night px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-white transition-colors flex items-center gap-1.5"
                      >
                        View Tour
                        <ChevronRight size={12} />
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* No Results */}
            {dayToursByDestination.length === 0 && (
              <div className="py-20 text-center">
                <h3 className="text-2xl font-serif text-egypt-gold mb-4 uppercase">No Day Tours Found</h3>
                <p className="text-egypt-papyrus/40 font-light">Adjust your filters to discover other paths.</p>
              </div>
            )}
          </motion.div>

        ) : (
          /* ============================================================
              STANDARD LAYOUT (Packages / All / Cruises)
          ============================================================ */
          <>
            <header className="mb-16">
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

                {/* View Mode Toggle */}
                <div className="flex items-center bg-white/5 p-1 rounded-full border border-white/10">
                  <button
                    type="button"
                    onClick={() => setViewMode('grid')}
                    className={`p-2.5 rounded-full transition-all cursor-pointer ${
                      viewMode === 'grid' 
                        ? 'bg-egypt-gold text-egypt-night shadow-lg' 
                        : 'text-egypt-papyrus/50 hover:text-white'
                    }`}
                    title="Grid View"
                  >
                    <LayoutGrid size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('list')}
                    className={`p-2.5 rounded-full transition-all cursor-pointer ${
                      viewMode === 'list' 
                        ? 'bg-egypt-gold text-egypt-night shadow-lg' 
                        : 'text-egypt-papyrus/50 hover:text-white'
                    }`}
                    title="List View"
                  >
                    <List size={16} />
                  </button>
                </div>
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
            {activeTabs.map(region => (
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
          {paginatedTours.length > 0 && viewMode === 'grid' && (
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
                         <span className="text-[10px] uppercase tracking-[2px] text-egypt-gold mb-4 font-bold">
                           {tour.duration} · {tour.category}
                         </span>
                         
                         <div className="w-12 h-[1px] bg-egypt-gold/30 mb-6" />
                         
                         <p className="text-[13px] font-light text-egypt-papyrus/80 leading-relaxed italic line-clamp-5">
                           {getTourSummary(tour)}
                         </p>
                       </div>
                    </div>
                    <div className="px-4 flex justify-between items-center">
                       <div className="flex flex-col">
                          <span className="text-2xl font-serif text-egypt-gold">${tour.price} <span className="text-[9px] font-sans uppercase text-egypt-papyrus/40">est.</span></span>
                          <div className="flex items-center gap-2 text-egypt-papyrus/40 text-[10px] uppercase tracking-widest mt-1">
                             <Calendar size={12} />
                             {tour.duration}
                          </div>
                       </div>
                       <div className="bg-white/5 px-4 py-2 rounded-full border border-white/5">
                          <span className="text-[10px] uppercase tracking-wider text-egypt-papyrus/60">Quotation required</span>
                       </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}

          {/* Tours List */}
          {paginatedTours.length > 0 && viewMode === 'list' && (
            <div className="flex flex-col">
              {/* Header Row for Desktop */}
              <div className="hidden md:grid grid-cols-12 gap-6 px-8 py-4 mb-4 text-xs uppercase tracking-widest font-bold text-egypt-gold/70 border-b border-white/10">
                <div className="col-span-5">Expedition</div>
                <div className="col-span-2">Duration</div>
                <div className="col-span-2">Tour Type</div>
                <div className="col-span-2 text-right">Price</div>
                <div className="col-span-1 text-center">Details</div>
              </div>

              <div className="space-y-4">
                {paginatedTours.map((tour, idx) => (
                  <motion.div
                    key={`${tour.id}-${currentPage}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: (idx % 9) * 0.04 }}
                    className="group"
                  >
                    <Link to={`/tours/${tour.id}`}>
                      {/* Desktop Row */}
                      <div className="hidden md:grid grid-cols-12 gap-6 items-center bg-egypt-basalt/40 hover:bg-egypt-basalt/90 p-6 rounded-2xl border border-white/5 hover:border-egypt-gold/30 transition-all duration-300 glass relative overflow-hidden group">
                        {/* Left gold indicator bar on hover */}
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-egypt-gold transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300" />
                        
                        {/* Tour Name & Locations */}
                        <div className="col-span-5 flex items-center gap-4">
                          <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-white/5">
                            <img src={tour.image} alt={tour.title} className="w-full h-full object-cover group-hover:scale-115 transition-transform duration-500" />
                          </div>
                          <div>
                            <h3 className="text-lg font-serif text-white group-hover:text-egypt-gold transition-colors duration-300">{tour.title}</h3>
                            <div className="flex items-center gap-2 mt-1 text-[11px] text-egypt-papyrus/40 uppercase tracking-wider">
                              <MapPin size={12} className="text-egypt-gold/60" />
                              <span>{tour.location}</span>
                            </div>
                          </div>
                        </div>

                        {/* Duration */}
                        <div className="col-span-2 flex items-center gap-2">
                          <Calendar size={14} className="text-egypt-gold/70" />
                          <span className="text-sm font-light text-egypt-papyrus/80">{tour.duration}</span>
                        </div>

                        {/* Tour type */}
                        <div className="col-span-2 flex items-center gap-1.5">
                          <span className="text-sm capitalize text-egypt-papyrus/80">{tour.category}</span>
                        </div>

                        {/* Price */}
                        <div className="col-span-2 text-right">
                          <span className="text-xs text-egypt-papyrus/40 block mb-1 uppercase tracking-widest">Estimate from</span>
                          <span className="text-xl font-serif text-egypt-gold">${tour.price}</span>
                        </div>

                        {/* Action Button */}
                        <div className="col-span-1 flex justify-center">
                          <div className="w-10 h-10 rounded-full bg-white/5 group-hover:bg-egypt-gold text-egypt-papyrus group-hover:text-egypt-night flex items-center justify-center transition-all duration-300">
                            <ChevronRight size={18} />
                          </div>
                        </div>
                      </div>

                      {/* Mobile Card Layout */}
                      <div className="md:hidden flex flex-col bg-egypt-basalt/40 p-6 rounded-3xl border border-white/5 hover:border-egypt-gold/30 transition-all duration-300 glass relative overflow-hidden">
                        <div className="flex gap-4 mb-4">
                          <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 border border-white/5">
                            <img src={tour.image} alt={tour.title} className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <span className="text-[9px] uppercase tracking-widest text-egypt-gold font-bold bg-egypt-gold/10 px-2 py-0.5 rounded-full">{tour.category}</span>
                            <h3 className="text-base font-serif text-white mt-1 leading-tight">{tour.title}</h3>
                            <div className="flex items-center gap-1.5 mt-1 text-[10px] text-egypt-papyrus/50 uppercase tracking-wider">
                              <MapPin size={10} className="text-egypt-gold/50" />
                              <span className="line-clamp-1">{tour.location}</span>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5 text-xs">
                          <div>
                            <span className="text-[9px] text-egypt-papyrus/40 uppercase tracking-wider block mb-1">Duration</span>
                            <div className="flex items-center gap-1.5 text-egypt-papyrus/80">
                              <Calendar size={12} className="text-egypt-gold/70" />
                              <span>{tour.duration}</span>
                            </div>
                          </div>
                          <div>
                            <span className="text-[9px] text-egypt-papyrus/40 uppercase tracking-wider block mb-1">Availability</span>
                            <div className="flex items-center gap-1.5 text-egypt-papyrus/80">
                              <span className="font-medium text-white">On request</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-between items-end pt-4 mt-4 border-t border-white/5">
                          <div>
                            <span className="text-[9px] text-egypt-papyrus/40 uppercase tracking-wider block">Estimate from</span>
                            <span className="text-xl font-serif text-egypt-gold">${tour.price}</span>
                          </div>
                          <div className="bg-egypt-gold text-egypt-night px-4 py-2 rounded-full font-bold uppercase tracking-widest text-[9px] flex items-center gap-1">
                            <span>View Tour</span>
                            <ChevronRight size={12} />
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
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
          </>
        )}
      </div>
    </div>
  );
};

export default Tours;
