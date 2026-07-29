import React, { useEffect, useState } from 'react';
import { motion, Reorder } from 'motion/react';
import { 
  Plus, GripVertical, Trash2, Map, Share2, 
  Save, Landmark, Camera, Coffee, Info,
  Trophy, Sparkles
} from 'lucide-react';
import SEO from '../components/SEO';

interface Stop {
  id: string;
  title: string;
  location: string;
  type: 'historical' | 'leisure' | 'hidden';
}

const AVAILABLE_STOPS: Stop[] = [
  // Cairo & Giza
  { id: '1', title: 'Pyramids of Giza', location: 'Giza', type: 'historical' },
  { id: '2', title: 'Great Sphinx', location: 'Giza', type: 'historical' },
  { id: '3', title: 'Grand Egyptian Museum', location: 'Giza', type: 'historical' },
  { id: '4', title: 'Egyptian Museum in Tahrir', location: 'Cairo', type: 'historical' },
  { id: '5', title: 'National Museum of Civilization', location: 'Cairo', type: 'historical' },
  { id: '6', title: 'Salah El-Din Citadel', location: 'Cairo', type: 'historical' },
  { id: '7', title: 'Khan el-Khalili Bazaar', location: 'Old Cairo', type: 'leisure' },
  { id: '8', title: 'Al-Muizz Street', location: 'Old Cairo', type: 'historical' },
  { id: '9', title: 'Hanging Church', location: 'Old Cairo', type: 'historical' },
  { id: '10', title: 'Ben Ezra Synagogue', location: 'Old Cairo', type: 'historical' },
  { id: '11', title: 'Cave Church of St. Simon', location: 'Mokattam', type: 'hidden' },
  { id: '12', title: 'Al-Azhar Park', location: 'Cairo', type: 'leisure' },
  { id: '13', title: 'Baron Empain Palace', location: 'Heliopolis', type: 'historical' },
  
  // Luxor
  { id: '14', title: 'Valley of the Kings', location: 'Luxor', type: 'historical' },
  { id: '15', title: 'Karnak Temple Complex', location: 'Luxor', type: 'historical' },
  { id: '16', title: 'Luxor Temple', location: 'Luxor', type: 'historical' },
  { id: '17', title: 'Temple of Hatshepsut', location: 'Luxor', type: 'historical' },
  { id: '18', title: 'Colossi of Memnon', location: 'Luxor', type: 'historical' },
  { id: '19', title: 'Tomb of Nefertari', location: 'Luxor', type: 'historical' },
  { id: '20', title: 'Medinet Habu Temple', location: 'Luxor', type: 'historical' },
  { id: '21', title: 'Luxor Museum', location: 'Luxor', type: 'historical' },

  // Aswan & Nile
  { id: '22', title: 'Abu Simbel Temples', location: 'Abu Simbel', type: 'historical' },
  { id: '23', title: 'Philae Temple Complex', location: 'Aswan', type: 'historical' },
  { id: '24', title: 'Unfinished Obelisk', location: 'Aswan', type: 'historical' },
  { id: '25', title: 'Aswan High Dam', location: 'Aswan', type: 'historical' },
  { id: '26', title: 'Nubian Village Voyage', location: 'Aswan', type: 'leisure' },
  { id: '27', title: 'Temple of Kom Ombo', location: 'Kom Ombo', type: 'historical' },
  { id: '28', title: 'Temple of Edfu', location: 'Edfu', type: 'historical' },

  // Alexandria
  { id: '29', title: 'Bibliotheca Alexandrina', location: 'Alexandria', type: 'historical' },
  { id: '30', title: 'Citadel of Qaitbay', location: 'Alexandria', type: 'historical' },
  { id: '31', title: 'Catacombs of Kom El Shoqafa', location: 'Alexandria', type: 'historical' },
  { id: '32', title: 'Pompey\'s Pillar', location: 'Alexandria', type: 'historical' },
  { id: '33', title: 'Montaza Palace Gardens', location: 'Alexandria', type: 'leisure' },

  // Red Sea & Sinai
  { id: '34', title: 'Giftun Island Snorkeling', location: 'Hurghada', type: 'leisure' },
  { id: '35', title: 'Ras Mohammed Park', location: 'Sharm El Sheikh', type: 'leisure' },
  { id: '36', title: 'St. Catherine\'s Monastery', location: 'Sinai', type: 'historical' },
  { id: '37', title: 'Sataya Dolphin Reef', location: 'Marsa Alam', type: 'leisure' },
  { id: '38', title: 'Dahab Blue Hole', location: 'Dahab', type: 'leisure' }
];

const ItineraryBuilder = () => {
  const [items, setItems] = useState<Stop[]>([]);
  const [showShareModal, setShowShareModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCity, setFilterCity] = useState('all');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    const sharedIds = new URLSearchParams(window.location.search).get('stops')?.split(',').filter(Boolean);
    let savedIds: string[] = [];
    try {
      savedIds = JSON.parse(localStorage.getItem('travision-itinerary') || '[]') as string[];
    } catch {
      localStorage.removeItem('travision-itinerary');
    }
    const ids = sharedIds?.length ? sharedIds : savedIds;
    setItems(ids.map(id => AVAILABLE_STOPS.find(stop => stop.id === id)).filter(Boolean) as Stop[]);
  }, []);

  const saveItinerary = () => {
    localStorage.setItem('travision-itinerary', JSON.stringify(items.map(item => item.id)));
    setNotice(items.length ? 'Itinerary saved on this device.' : 'Empty itinerary saved.');
    window.setTimeout(() => setNotice(''), 3000);
  };

  const shareUrl = `${window.location.origin}/planner?stops=${items.map(item => item.id).join(',')}`;

  const copyShareLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setNotice('Share link copied.');
    setShowShareModal(false);
    window.setTimeout(() => setNotice(''), 3000);
  };

  const addStop = (stop: Stop) => {
    if (!items.find(i => i.id === stop.id)) {
      setItems([...items, stop]);
    }
  };

  const removeStop = (id: string) => {
    setItems(items.filter(i => i.id !== id));
  };

  const filteredStops = AVAILABLE_STOPS.filter(stop => {
    const matchesSearch = stop.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          stop.location.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCity = filterCity === 'all' || 
                        (filterCity === 'cairo-giza' && (stop.location === 'Cairo' || stop.location === 'Giza' || stop.location === 'Old Cairo' || stop.location === 'Mokattam' || stop.location === 'Heliopolis')) ||
                        (filterCity === 'luxor' && stop.location === 'Luxor') ||
                        (filterCity === 'aswan' && (stop.location === 'Aswan' || stop.location === 'Abu Simbel' || stop.location === 'Kom Ombo' || stop.location === 'Edfu')) ||
                        (filterCity === 'alexandria' && stop.location === 'Alexandria') ||
                        (filterCity === 'redsea' && (stop.location === 'Hurghada' || stop.location === 'Sharm El Sheikh' || stop.location === 'Marsa Alam' || stop.location === 'Dahab' || stop.location === 'Sinai'));
    
    return matchesSearch && matchesCity;
  });

  return (
    <div className="pt-32 pb-20 px-6 max-w-7xl mx-auto">
      <SEO
        title="Custom Egypt Itinerary Planner"
        description="Build and save a custom Egypt itinerary with your preferred landmarks and destinations."
        canonical="/planner"
        noIndex
      />
      <header className="mb-16">
        <div className="flex items-center gap-2 text-egypt-gold mb-4">
           <Trophy size={20} />
           <span className="text-[10px] uppercase font-black tracking-widest">Achiever Quest • Rank: Explorer</span>
        </div>
        <h1 className="text-5xl md:text-7xl font-serif uppercase leading-none">Architect your <br /><span className="text-egypt-gold">Legacy</span></h1>
        <p className="text-egypt-papyrus/50 mt-6 max-w-xl font-light italic">
          Forge a unique path through the sands. Customize your sequence of discovery and earn "Cultural Resonance" points.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left: Stop Selection */}
        <div className="lg:col-span-4 space-y-8">
           <div className="glass p-8 rounded-[40px] border border-white/5">
              <h3 className="text-xs uppercase tracking-widest font-black text-egypt-gold mb-6">Points of Resonance</h3>
              
              {/* Search Bar */}
              <div className="relative mb-6">
                <input 
                  type="text" 
                  placeholder="Search landmarks..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-egypt-gold transition-colors text-white"
                />
              </div>

              {/* City Filter Pills */}
              <div className="flex gap-2 overflow-x-auto pb-4 mb-6 no-scrollbar">
                {[
                  { id: 'all', name: 'All' },
                  { id: 'cairo-giza', name: 'Cairo/Giza' },
                  { id: 'luxor', name: 'Luxor' },
                  { id: 'aswan', name: 'Aswan/Abu Simbel' },
                  { id: 'alexandria', name: 'Alexandria' },
                  { id: 'redsea', name: 'Red Sea' }
                ].map(city => (
                  <button
                    key={city.id}
                    onClick={() => setFilterCity(city.id)}
                    className={`px-3 py-1.5 rounded-full text-[9px] uppercase tracking-wider font-bold whitespace-nowrap transition-colors border ${
                      filterCity === city.id 
                        ? 'bg-egypt-gold text-egypt-night border-egypt-gold' 
                        : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
                    }`}
                  >
                    {city.name}
                  </button>
                ))}
              </div>

              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 no-scrollbar">
                 {filteredStops.map(stop => (
                   <div key={stop.id} className="flex justify-between items-center p-4 rounded-2xl bg-white/5 border border-white/5 group hover:border-egypt-gold/50 transition-all">
                      <div>
                         <h4 className="text-sm font-medium text-white group-hover:text-egypt-gold transition-colors">{stop.title}</h4>
                         <span className="text-[9px] uppercase tracking-widest text-white/30">{stop.location}</span>
                      </div>
                      <button 
                        onClick={() => addStop(stop)}
                        className="w-10 h-10 rounded-full bg-egypt-gold/10 flex items-center justify-center text-egypt-gold hover:bg-egypt-gold hover:text-egypt-night transition-all"
                      >
                         <Plus size={18} />
                      </button>
                   </div>
                 ))}
              </div>
           </div>

           <div className="bg-egypt-gold/5 border border-egypt-gold/20 p-8 rounded-[30px] flex gap-6 items-center">
              <div className="w-16 h-16 rounded-full bg-egypt-gold flex items-center justify-center text-egypt-night">
                 <Sparkles size={24} />
              </div>
              <div>
                 <h4 className="text-xs uppercase tracking-widest font-black text-egypt-gold mb-1">Gamification Rank</h4>
                 <p className="text-xs italic font-light text-egypt-papyrus/60">Include 3 historical sites to unlock the <span className="text-egypt-gold">"Chronicler"</span> badge.</p>
              </div>
           </div>
        </div>

        {/* Center: Reorderable List */}
        <div className="lg:col-span-4 space-y-8">
           <div className="glass p-8 rounded-[40px] border border-egypt-gold/20 min-h-[600px] flex flex-col">
              <div className="flex justify-between items-center mb-10">
                 <h3 className="text-xs uppercase tracking-widest font-black text-white">Your Chronology</h3>
                 <span className="text-[10px] font-mono text-egypt-gold">{items.length} STOPS</span>
              </div>

              {items.length === 0 ? (
                <div className="flex-grow flex flex-col items-center justify-center text-center opacity-30 px-10">
                   <div className="w-20 h-20 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center mb-6">
                      <GripVertical size={32} />
                   </div>
                   <p className="text-sm italic font-light leading-relaxed">The sands are empty. Begin adding points to your timeline.</p>
                </div>
              ) : (
                <Reorder.Group axis="y" values={items} onReorder={setItems} className="space-y-4">
                  {items.map((item) => (
                    <Reorder.Item 
                      key={item.id} 
                      value={item}
                      className="p-5 rounded-2xl bg-egypt-night border border-white/10 flex items-center gap-4 cursor-grab active:cursor-grabbing hover:border-egypt-gold/30 transition-all"
                    >
                      <GripVertical className="text-white/20" size={20} />
                      <div className="flex-grow">
                         <h4 className="text-sm font-medium">{item.title}</h4>
                      </div>
                      <button 
                        onClick={() => removeStop(item.id)}
                        className="text-white/20 hover:text-egypt-red transition-colors"
                      >
                         <Trash2 size={16} />
                      </button>
                    </Reorder.Item>
                  ))}
                </Reorder.Group>
              )}

              <div className="mt-auto pt-10">
                 <div className="flex gap-4">
                    <button 
                      onClick={() => setShowShareModal(true)}
                      className="flex-grow py-5 bg-white text-egypt-night rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-egypt-gold transition-all"
                    >
                       Broadcast Legacy
                    </button>
                    <button
                      type="button"
                      onClick={saveItinerary}
                      aria-label="Save itinerary on this device"
                      className="w-16 h-16 rounded-2xl border border-white/10 flex items-center justify-center hover:border-egypt-gold transition-all"
                    >
                       <Save size={20} />
                    </button>
                 </div>
              </div>
           </div>
        </div>

        {/* Right: Interactive Overlay / Map Mockup */}
        <div className="lg:col-span-4 lg:sticky lg:top-32 h-[700px]">
           <div className="w-full h-full glass rounded-[40px] overflow-hidden relative border border-white/10">
              <img 
                src="https://images.unsplash.com/photo-1572252017416-24959dbade7e?auto=format&fit=crop&q=80&w=1200" 
                className="w-full h-full object-cover opacity-20 contrast-125 grayscale" 
                alt="Map Mock"
              />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                 <div className="p-8 text-center bg-egypt-night/80 backdrop-blur-md rounded-3xl border border-white/5">
                    <Map size={48} className="text-egypt-gold mx-auto mb-4" />
                    <h4 className="font-serif text-xl uppercase mb-2">Cartographic Sync</h4>
                    <p className="text-xs text-white/40 font-light">Interactive projection of your path.</p>
                 </div>
              </div>
              
              {/* Fake Map Markers */}
              {items.map((_, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute w-4 h-4 bg-egypt-gold rounded-full shadow-[0_0_20px_#CFAE7D]"
                  style={{ top: `${20 + idx * 15}%`, left: `${30 + idx * 10}%` }}
                >
                   <div className="absolute top-1/2 left-full translate-x-4 -translate-y-1/2 glass px-3 py-1 rounded-full whitespace-nowrap text-[8px] uppercase font-bold tracking-widest">
                      Node 0{idx + 1}
                   </div>
                </motion.div>
              ))}

              <svg className="absolute inset-0 w-full h-full pointer-events-none stroke-egypt-gold/30 stroke-2 fill-none">
                 <path d="M100 100 Q 200 150 400 300" strokeDasharray="10 10" />
              </svg>
           </div>
        </div>
      </div>

      {notice && (
        <div role="status" className="fixed bottom-6 right-6 z-[110] bg-egypt-gold text-egypt-night px-6 py-4 rounded-xl font-bold text-sm shadow-2xl">
          {notice}
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-egypt-night/95 backdrop-blur-xl">
           <motion.div 
             initial={{ scale: 0.9, opacity: 0 }}
             animate={{ scale: 1, opacity: 1 }}
             className="max-w-md w-full glass p-10 rounded-[60px] border border-egypt-gold/30 text-center"
           >
              <div className="w-20 h-20 rounded-full bg-egypt-gold/10 flex items-center justify-center text-egypt-gold mx-auto mb-8">
                 <Share2 size={32} />
              </div>
              <h3 className="text-3xl font-serif uppercase mb-4">Share the <span className="text-egypt-gold">Legacy</span></h3>
              <p className="text-egypt-papyrus/60 font-light mb-10 leading-relaxed italic">
                 Copy this link to share the selected stops and their current order.
              </p>
              <div className="bg-egypt-night p-4 rounded-2xl break-all font-mono text-[10px] text-egypt-gold mb-10 border border-white/5">
                 {shareUrl}
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <button onClick={copyShareLink} className="py-4 bg-white text-egypt-night rounded-2xl font-black uppercase text-[10px] tracking-widest">
                    Copy link
                 </button>
                 <button onClick={() => setShowShareModal(false)} className="py-4 border border-white/10 rounded-2xl font-black uppercase text-[10px] tracking-widest">
                    Close
                 </button>
              </div>
           </motion.div>
        </div>
      )}
    </div>
  );
};

export default ItineraryBuilder;
