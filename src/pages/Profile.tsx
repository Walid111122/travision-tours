import React from 'react';
import { motion } from 'motion/react';
import { 
  User, Settings, Heart, Map, Trophy, 
  Award, Shield, Bell, LogOut, ChevronRight,
  Sparkles, Zap
} from 'lucide-react';
import SEO from '../components/SEO';

const Profile = () => {
  return (
    <div className="pt-32 pb-20 px-6 max-w-7xl mx-auto">
      <SEO 
        title="Explorer Profile" 
        description="Manage your Egyptian journeys, saved itineraries, and historical achievements."
      />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Sidebar / User Info */}
        <div className="lg:col-span-4 space-y-8">
           <div className="glass p-10 rounded-[60px] border border-egypt-gold/20 text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-egypt-gold/10 to-transparent" />
              <div className="relative">
                 <div className="w-32 h-32 rounded-full border-2 border-egypt-gold p-1 mx-auto mb-6 relative">
                    <img 
                       src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400" 
                       className="w-full h-full object-cover rounded-full" 
                       alt="Profile" 
                    />
                    <div className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-egypt-gold flex items-center justify-center text-egypt-night border-4 border-egypt-night">
                       <Zap size={14} fill="currentColor" />
                    </div>
                 </div>
                 <h2 className="text-3xl font-serif uppercase tracking-tight mb-1">Amun-Ra Explorer</h2>
                 <p className="text-[10px] uppercase font-bold tracking-[3px] text-egypt-gold mb-6">Senior Chronicler • Rank 14</p>
                 
                 <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/5">
                    <div className="text-center">
                       <p className="text-xl font-serif text-white">1,240</p>
                       <p className="text-[9px] uppercase tracking-widest text-white/30 font-bold">Resonance Points</p>
                    </div>
                    <div className="text-center">
                       <p className="text-xl font-serif text-white">4</p>
                       <p className="text-[9px] uppercase tracking-widest text-white/30 font-bold">Journeys Completed</p>
                    </div>
                 </div>
              </div>
           </div>

           <nav className="glass rounded-[40px] border border-white/5 overflow-hidden">
              {[
                { icon: User, label: 'Ritual Settings', path: '#' },
                { icon: Bell, label: 'Announcements', count: 2, path: '#' },
                { icon: Shield, label: 'Safe Pass Guard', path: '#' },
                { icon: Settings, label: 'Preferences', path: '#' },
                { icon: LogOut, label: 'Departure', path: '#', danger: true },
              ].map((item, idx) => (
                <button 
                  key={idx} 
                  className={`w-full flex items-center justify-between p-6 hover:bg-white/5 transition-all group ${idx !== 0 ? 'border-t border-white/5' : ''}`}
                >
                   <div className="flex items-center gap-4">
                      <item.icon size={20} className={item.danger ? 'text-egypt-red/50' : 'text-egypt-gold/70 group-hover:text-egypt-gold'} />
                      <span className={`text-[10px] uppercase tracking-[2px] font-black ${item.danger ? 'text-egypt-red/50' : 'text-white/60 group-hover:text-white'}`}>
                        {item.label}
                      </span>
                   </div>
                   {item.count ? (
                      <span className="bg-egypt-gold text-egypt-night text-[9px] font-black px-2 py-0.5 rounded-full">{item.count}</span>
                   ) : (
                      <ChevronRight size={16} className="text-white/10 group-hover:text-egypt-gold transition-colors" />
                   )}
                </button>
              ))}
           </nav>
        </div>

        {/* Main Content Areas */}
        <div className="lg:col-span-8 space-y-12">
           {/* Gamification / Badges */}
           <section>
              <div className="flex justify-between items-end mb-8">
                 <div>
                    <span className="text-label mb-2 block">Legacy Rewards</span>
                    <h3 className="text-3xl font-serif uppercase tracking-tight">Cultural <span className="text-egypt-gold italic">Badges</span></h3>
                 </div>
                 <button className="text-[10px] uppercase font-bold tracking-widest text-egypt-gold hover:text-white transition-colors">See Ledger</button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                 {[
                    { icon: Trophy, label: 'Giza Pioneer', color: 'bg-egypt-gold/20 text-egypt-gold' },
                    { icon: Map, label: 'Nile Rider', color: 'bg-egypt-gold/10 text-white/40' },
                    { icon: Award, label: 'Scribe First Class', color: 'bg-egypt-gold/20 text-egypt-gold' },
                    { icon: Sparkles, label: 'Desert Ghost', color: 'bg-egypt-gold/10 text-white/40' },
                 ].map((badge, idx) => (
                   <div key={idx} className={`p-8 rounded-[40px] border border-white/5 flex flex-col items-center text-center glass group hover:border-egypt-gold/30 transition-all cursor-pointer`}>
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 border border-white/5 ${badge.color}`}>
                         <badge.icon size={28} />
                      </div>
                      <span className="text-[9px] uppercase tracking-widest font-black leading-tight">{badge.label}</span>
                   </div>
                 ))}
              </div>
           </section>

           {/* Saved Itineraries */}
           <section>
              <div className="flex justify-between items-end mb-8">
                 <h3 className="text-3xl font-serif uppercase tracking-tight">Saved <span className="text-egypt-gold italic">Chronologies</span></h3>
                 <button className="text-[10px] uppercase font-bold tracking-widest text-egypt-gold hover:text-white transition-colors">Manage Maps</button>
              </div>
              <div className="space-y-4">
                 {[
                    { name: 'The Eternal Valley Expedition', date: 'Saved on Oct 24, 2025', count: '12 STOPS' },
                    { name: 'Desert Night Spirits', date: 'Saved on Sep 12, 2025', count: '5 STOPS' },
                 ].map((it, idx) => (
                   <div key={idx} className="glass p-8 rounded-[30px] border border-white/5 flex items-center justify-between group hover:border-egypt-gold/20 transition-all cursor-pointer">
                      <div className="flex items-center gap-6">
                         <div className="w-14 h-14 rounded-2xl bg-egypt-basalt flex items-center justify-center text-egypt-gold/50 group-hover:text-egypt-gold transition-colors">
                            <Map size={24} />
                         </div>
                         <div>
                            <h4 className="font-serif text-lg uppercase group-hover:text-egypt-gold transition-colors">{it.name}</h4>
                            <p className="text-[10px] uppercase text-white/30 tracking-widest mt-1">{it.date}</p>
                         </div>
                      </div>
                      <div className="text-right">
                         <span className="text-[10px] font-mono text-egypt-gold block mb-2">{it.count}</span>
                         <ChevronRight size={18} className="text-white/10 group-hover:text-egypt-gold transition-transform translate-x-2" />
                      </div>
                   </div>
                 ))}

                 <button className="w-full py-8 rounded-[30px] border border-dashed border-white/10 hover:border-egypt-gold/50 hover:bg-egypt-gold/5 transition-all text-white/30 hover:text-egypt-gold text-[10px] uppercase tracking-widest font-black">
                    Forge a New Chronology
                 </button>
              </div>
           </section>

           {/* Preferences */}
           <section className="bg-egypt-basalt p-10 rounded-[40px] border border-white/5">
              <h3 className="text-xs uppercase tracking-[3px] font-black text-egypt-gold mb-8">Explorer Preferences</h3>
              <div className="flex flex-wrap gap-3">
                 {['Hieroglyph Study', 'Night Tours', 'Nubian Cuisine', 'Pharaonic Architecture', 'Esoteric Wisdom', 'Desert Photography'].map((tag) => (
                    <button key={tag} className="px-6 py-3 rounded-full border border-white/10 text-[10px] uppercase tracking-widest hover:border-egypt-gold hover:text-egypt-gold transition-all">
                       {tag}
                    </button>
                 ))}
                 <button className="px-6 py-3 rounded-full bg-egypt-gold/10 text-egypt-gold text-[10px] uppercase tracking-widest font-black">
                    + Add Focus
                 </button>
              </div>
           </section>
        </div>
      </div>
    </div>
  );
};

export default Profile;
