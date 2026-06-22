import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  Calendar, MapPin, Clock, Users, Star, 
  ArrowLeft, Share2, Heart, Shield, 
  Info, ChevronRight, Play, CheckCircle2,
  FileText, DollarSign, Image as ImageIcon, MessageCircle
} from 'lucide-react';
import { SAMPLE_TOURS } from '../constants';
import ItineraryAccordion from '../components/ItineraryAccordion';

const TourDetails = () => {
  const { id } = useParams();
  const tour = SAMPLE_TOURS.find(t => t.id === id);
  const [activeTab, setActiveTab] = useState<'itinerary' | 'reviews' | 'virtual'>('itinerary');

  if (!tour) return <div className="pt-40 text-center">Journey not found.</div>;

  return (
    <div className="bg-egypt-night min-h-screen">
      <div className="pt-32 pb-8 px-6 max-w-[1400px] mx-auto">
        <Link to="/tours" className="flex items-center gap-2 text-white/50 hover:text-white transition-colors text-xs uppercase tracking-[2px] font-bold mb-6">
          <ArrowLeft size={16} />
          Back to Journeys
        </Link>
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
           <div>
             <h1 className="text-3xl md:text-5xl font-serif text-white font-bold">{tour.title}</h1>
           </div>
           
           <div className="flex flex-wrap gap-3">
             <div className="bg-[#24587c] text-white px-5 py-3 rounded text-[13px] font-bold">
               From: {tour.price} $
             </div>
             <button className="bg-[#24587c] text-white px-5 py-3 rounded text-[13px] font-bold hover:bg-[#1f4a6b] transition-colors">
               Send To a Friend
             </button>
             <button className="bg-[#1f4a6b] text-white px-5 py-3 rounded text-[13px] font-bold hover:bg-blue-900 transition-colors">
               Send an Inquiry
             </button>
           </div>
        </div>

        {/* Hero Photo Banner */}
        <div className="w-full h-[200px] md:h-[120px] lg:h-[150px] relative rounded-lg overflow-hidden border border-[#c63d2e]/40 shadow-[0_0_15px_rgba(198,61,46,0.2)]">
           <img 
             src={tour.image} 
             alt={tour.title} 
             className="w-full h-full object-cover"
           />
           <div className="absolute inset-0 bg-black/40 flex items-center justify-between px-8">
              <div className="text-center font-serif">
                <p className="text-white text-lg lg:text-3xl italic">Awards &</p>
                <p className="text-white text-lg lg:text-3xl italic font-bold">Recognitions</p>
              </div>
              <div className="flex items-center gap-6">
                {/* Simulated badges */}
                <div className="w-16 h-16 md:w-20 md:h-20 bg-egypt-gold/80 rounded-full border-2 border-white flex items-center justify-center transform -rotate-12 shadow-xl">
                  <Star size={24} className="text-white" />
                </div>
                <div className="w-16 h-16 md:w-20 md:h-20 bg-[#c63d2e]/90 rounded-full border-2 border-white flex flex-col items-center justify-center shadow-xl">
                  <span className="text-[10px] font-bold uppercase text-white leading-tight">ISO</span>
                  <span className="text-[10px] text-white">Certified</span>
                </div>
              </div>
           </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="max-w-[1400px] mx-auto px-6 py-20 grid grid-cols-1 lg:grid-cols-4 gap-8">

        {/* Left Navigation Sidebar */}
        <aside className="hidden lg:block lg:col-span-1 lg:sticky lg:top-32 h-fit z-20">
          <div className="bg-[#1f4a6b] rounded-md overflow-hidden flex flex-col shadow-lg shadow-black/20">
            {[
              { id: 'overview', label: 'Tour Details', icon: <FileText size={18} /> },
              { id: 'inclusions', label: 'Inclusions/Exclusions', icon: <CheckCircle2 size={18} /> },
              { id: 'highlights', label: 'Tour Highlights', icon: <Star size={18} /> },
              { id: 'itinerary', label: 'Itinerary', icon: <MapPin size={18} /> },
              { id: 'prices', label: 'Tour Prices', icon: <DollarSign size={18} /> },
              { id: 'virtual', label: 'Gallery', icon: <ImageIcon size={18} /> },
              { id: 'reviews', label: 'Tour Reviews', icon: <Star size={18} /> },
              { id: 'map', label: 'Tour Map', icon: <MapPin size={18} /> },
              { id: 'info', label: 'Essential Trip Information', icon: <FileText size={18} /> },
              { id: 'related', label: 'Related Tours', icon: <Share2 size={18} /> },
              { id: 'read', label: 'Read Before You Go', icon: <Info size={18} /> },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  const el = document.getElementById(tab.id);
                  if (el) {
                    const y = el.getBoundingClientRect().top + window.scrollY - 100;
                    window.scrollTo({ top: y, behavior: 'smooth' });
                  }
                  setActiveTab(tab.id as any);
                }}
                className={`w-full flex items-center gap-3 px-5 py-4 text-[13px] font-bold transition-all border-b border-white/10 last:border-0 ${
                  activeTab === tab.id ? 'bg-[#c63d2e] text-white' : 'text-white hover:bg-white/10'
                }`}
              >
                <div className="text-white/80">{tab.icon}</div>
                <span className="tracking-wide">{tab.label}</span>
              </button>
            ))}
            
            <div className="p-4 space-y-3 mt-4">
              <button 
                className="w-full bg-[#c63d2e] text-white py-3 rounded text-[13px] font-bold tracking-wide hover:bg-red-800 transition-colors"
                onClick={() => {
                  const el = document.getElementById('booking-form');
                  if (el) {
                    const y = el.getBoundingClientRect().top + window.scrollY - 100;
                    window.scrollTo({ top: y, behavior: 'smooth' });
                  }
                }}
              >
                Send A Request For This Tour
              </button>
              
              <div className="flex gap-2">
                <button className="flex-shrink-0 bg-[#166ba1] text-white px-4 py-3 rounded flex items-center justify-center gap-2 font-bold text-[13px] hover:bg-blue-800 transition-colors">
                  <div className="border border-white rounded-full w-4 h-4 flex items-center justify-center text-[10px]">?</div>
                  Help
                </button>
                <button className="flex-grow bg-[#c63d2e] text-white py-3 rounded font-bold text-[13px] tracking-wide hover:bg-red-800 transition-colors">
                  Click to Whatsapp
                </button>
              </div>
              
              <p className="text-center text-[11px] font-bold text-white pt-2">
                Or email: info@travisiontours.com
              </p>
            </div>
          </div>
        </aside>
        
        {/* Right Sidebar / Booking */}
        <aside className="order-3 lg:col-span-1 lg:sticky lg:top-32 h-fit space-y-10" id="booking-form">
          <div className="glass p-8 rounded-[30px] border border-egypt-gold/20 shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-egypt-gold via-white to-egypt-gold"></div>
             
             <div className="mb-6">
                <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold mb-1">Starting from</p>
                <div className="flex items-end gap-2">
                  <span className="text-[40px] font-serif leading-none text-egypt-gold">${tour.price}</span>
                  <span className="text-xs text-white/40 uppercase tracking-widest pb-1 mb-1 border-b border-white/10">Per Person</span>
                </div>
             </div>

             <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
               <div>
                 <label className="block text-[10px] uppercase tracking-widest text-white/60 mb-2">Full Name</label>
                 <input type="text" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-egypt-gold transition-colors text-white" placeholder="John Doe" />
               </div>
               <div>
                 <label className="block text-[10px] uppercase tracking-widest text-white/60 mb-2">Email Address</label>
                 <input type="email" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-egypt-gold transition-colors text-white" placeholder="john@example.com" />
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="block text-[10px] uppercase tracking-widest text-white/60 mb-2">Date</label>
                   <input type="date" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-egypt-gold transition-colors text-white" />
                 </div>
                 <div>
                   <label className="block text-[10px] uppercase tracking-widest text-white/60 mb-2">Travelers</label>
                   <select className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-egypt-gold transition-colors text-white appearance-none">
                     {[1,2,3,4,5,6,7,8,"9+"].map(n => <option key={n} value={n} className="bg-egypt-night text-white">{n} {n === 1 ? 'Person' : 'People'}</option>)}
                   </select>
                 </div>
               </div>
               <div>
                 <label className="block text-[10px] uppercase tracking-widest text-white/60 mb-2">Special Requirements</label>
                 <textarea className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-egypt-gold transition-colors text-white h-24 resize-none" placeholder="Any special requests?"></textarea>
               </div>
               
               <button type="submit" className="w-full bg-egypt-gold text-egypt-night mt-4 py-4 rounded-xl font-black uppercase tracking-[2px] text-xs hover:bg-white transition-all shadow-xl shadow-egypt-gold/20 flex items-center justify-center gap-2">
                 <span>Send Request</span>
                 <ChevronRight size={16} />
               </button>
             </form>
             
             <p className="text-center text-[10px] text-white/40 mt-6 flex items-center justify-center gap-2">
               <Shield size={12} className="text-emerald-500" />
               No hidden costs. Secure payment.
             </p>
          </div>

          <div className="glass p-8 rounded-[30px] border border-white/5">
             <h4 className="text-xs uppercase tracking-[2px] font-black mb-6 text-egypt-gold/70">Need Help?</h4>
             <div className="space-y-4 text-sm font-light text-egypt-papyrus/70">
                <p>Speak to our specialists to customize this tour to your exact needs.</p>
                <div className="pt-4 border-t border-white/5">
                  <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Email Us</p>
                  <a href="mailto:info@travisiontours.com" className="text-egypt-gold hover:text-white transition-colors">info@travisiontours.com</a>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Call Us</p>
                  <a href="tel:+20123456789" className="text-egypt-gold hover:text-white transition-colors">+20 12 345 6789</a>
                </div>
             </div>
          </div>
        </aside>

        <div className="order-1 lg:order-2 lg:col-span-2 space-y-16 pb-20">
          
          {/* Main Content Sections */}
          <div className="min-h-[400px] space-y-12">
            
            {/* Tour Details Section */}
            <div id="overview" className="space-y-6 scroll-mt-32">
               <h2 className="text-3xl font-serif mb-8 uppercase tracking-tight">The <span className="text-egypt-gold italic">Essence</span> of the Journey</h2>
               <p className="text-xl text-egypt-papyrus/70 leading-relaxed font-light first-letter:text-5xl first-letter:font-serif first-letter:mr-3 first-letter:float-left first-letter:leading-none">
                 {tour.description}
               </p>
            </div>

            {/* Inclusions Section */}
            <div id="inclusions" className="grid grid-cols-1 md:grid-cols-2 gap-10 scroll-mt-32 pt-8 border-t border-white/10">
              <div className="space-y-6">
                <h3 className="text-2xl font-serif text-white uppercase tracking-widest pl-4 border-l-2 border-emerald-500">Inclusions</h3>
                <ul className="space-y-3">
                  {(tour.inclusions || [
                    'Pick up services from your hotel & return',
                    'All transfers by a private air-conditioned vehicle',
                    'Private English-speaking Egyptologist guide',
                    'Entrance fees to all the mentioned sites',
                    'Bottled water on board the vehicle during the tour',
                    'All taxes & service charge'
                  ]).map((inc, idx) => (
                    <li key={idx} className="flex gap-3 items-start text-sm font-light text-egypt-papyrus/70">
                      <CheckCircle2 size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                      <span>{inc}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="space-y-6">
                <h3 className="text-2xl font-serif text-white uppercase tracking-widest pl-4 border-l-2 border-egypt-red">Exclusions</h3>
                <ul className="space-y-3">
                  {(tour.exclusions || [
                    'Any extras not mentioned in the itinerary',
                    'Tipping (recommended but not mandatory)',
                    'Entrance inside the Pyramids (optional)',
                    'Personal expenses'
                  ]).map((exc, idx) => (
                    <li key={idx} className="flex gap-3 items-start text-sm font-light text-egypt-papyrus/60">
                      <Shield size={16} className="text-egypt-red mt-0.5 shrink-0" />
                      <span>{exc}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Tour Highlights Section */}
            <div id="highlights" className="space-y-6 scroll-mt-32 pt-8 border-t border-white/10">
              <h3 className="text-2xl font-serif text-egypt-gold uppercase tracking-widest pl-4 border-l-2 border-egypt-gold">Tour Highlights</h3>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(tour.highlights || [
                  'Private guided tour for a personalized experience',
                  'Visit the iconic Pyramids of Giza and the Sphinx',
                  'Explore the ancient artifacts at the Egyptian Museum',
                  'Comfortable transportation in an air-conditioned vehicle',
                  'Entrance fees to the main historical sites included',
                  'Free bottled water during the tour'
                ]).map((highlight, idx) => (
                  <li key={idx} className="flex gap-4 items-start bg-white/5 p-4 rounded-2xl border border-white/5">
                    <Star size={16} className="text-egypt-gold mt-1 shrink-0" />
                    <span className="text-sm font-light text-egypt-papyrus/80 leading-relaxed">{highlight}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Itinerary Section */}
            <div id="itinerary" className="scroll-mt-32 pt-8 border-t border-white/10">
              <h3 className="text-2xl font-serif text-egypt-gold uppercase tracking-widest pl-4 border-l-2 border-egypt-gold mb-10">Tour Itinerary</h3>
              <div className="space-y-4">
                {tour.itinerary.map((item, idx) => (
                  <ItineraryAccordion key={idx} item={item} defaultOpen={idx === 0} />
                ))}
              </div>
              
              <div className="mt-8 bg-egypt-gold/5 border-l-4 border-egypt-gold p-6 rounded-r-2xl relative shadow-inner overflow-hidden">
                <div className="absolute top-0 right-0 p-3 opacity-5">
                  <MessageCircle size={40} className="text-egypt-gold" />
                </div>
                <p className="text-egypt-papyrus/90 text-[14px] font-light leading-relaxed">
                  <span className="font-serif text-egypt-gold uppercase tracking-widest text-[11px] mr-3">Traveler Note:</span>
                  You can share your thoughts about adding or removing any tours from your tour itinerary to be able to accommodate your requirements and fulfill your needs.
                </p>
              </div>
            </div>
            
            {/* Prices Section */}
            <div id="prices" className="space-y-12 scroll-mt-32 pt-8 border-t border-white/10">
               <h3 className="text-2xl font-serif text-egypt-gold uppercase tracking-widest pl-4 border-l-2 border-egypt-gold mb-10">Tour Prices</h3>
               <div className="overflow-x-auto">
                 <table className="w-full text-left border-collapse">
                   <thead>
                     <tr className="border-b border-white/20">
                       <th className="py-4 px-6 text-xs uppercase tracking-widest text-egypt-gold">Season</th>
                       <th className="py-4 px-6 text-xs uppercase tracking-widest text-egypt-gold">Price Per Person (1)</th>
                       <th className="py-4 px-6 text-xs uppercase tracking-widest text-egypt-gold">Price Per Person (2-3)</th>
                       <th className="py-4 px-6 text-xs uppercase tracking-widest text-egypt-gold">Price Per Person (4-6)</th>
                     </tr>
                   </thead>
                   <tbody>
                     <tr className="border-b border-white/5 bg-white/5">
                       <td className="py-4 px-6 text-sm text-egypt-papyrus">Summer (May - Sep)</td>
                       <td className="py-4 px-6 text-sm font-bold">${tour.price + 50}</td>
                       <td className="py-4 px-6 text-sm font-bold">${tour.price}</td>
                       <td className="py-4 px-6 text-sm font-bold">${Math.round(tour.price * 0.85)}</td>
                     </tr>
                     <tr className="border-b border-white/5">
                       <td className="py-4 px-6 text-sm text-egypt-papyrus">Winter (Oct - Apr)</td>
                       <td className="py-4 px-6 text-sm font-bold">${tour.price + 80}</td>
                       <td className="py-4 px-6 text-sm font-bold">${tour.price + 20}</td>
                       <td className="py-4 px-6 text-sm font-bold">${Math.round(tour.price * 0.9)}</td>
                     </tr>
                   </tbody>
                 </table>
               </div>
            </div>

            {/* Reviews Section */}
            <div id="reviews" className="space-y-10 scroll-mt-32 pt-8 border-t border-white/10">
              <h3 className="text-2xl font-serif text-egypt-gold uppercase tracking-widest pl-4 border-l-2 border-egypt-gold mb-10">Tour Reviews</h3>
              <div className="flex flex-col md:flex-row gap-10 items-start">
                 <div className="text-center p-8 glass rounded-[30px] border border-white/10 shrink-0 w-full md:w-48">
                    <div className="text-5xl font-serif mb-2">{tour.rating}</div>
                    <div className="flex justify-center gap-1 mb-4">
                       {[...Array(5)].map((_, i) => <Star key={i} size={14} className="text-egypt-gold fill-egypt-gold" />)}
                    </div>
                    <p className="text-[9px] uppercase tracking-widest text-white/40">Global Rating</p>
                 </div>
                 <div className="flex-grow space-y-8">
                    {[1, 2].map(i => (
                      <div key={i} className="border-b border-white/5 pb-8 last:border-0">
                         <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-3">
                               <div className="w-10 h-10 rounded-full bg-egypt-gold/20 flex items-center justify-center text-egypt-gold font-serif">A</div>
                               <div>
                                  <h5 className="font-serif text-sm uppercase tracking-wider text-egypt-gold">Traveler {i}</h5>
                                  <p className="text-[10px] text-white/30 uppercase tracking-widest">Recent Guest</p>
                               </div>
                            </div>
                            <div className="flex gap-0.5">
                               {[...Array(5)].map((_, idx) => <Star key={idx} size={12} className="text-egypt-gold fill-egypt-gold" />)}
                            </div>
                         </div>
                         <p className="text-sm italic font-light text-egypt-papyrus/70 leading-relaxed">
                           "The guide was exceptionally well-versed in the history of the pyramids. Very well organized tour and absolute value for money."
                         </p>
                      </div>
                    ))}
                 </div>
              </div>
              <button className="w-full py-5 rounded-2xl border border-egypt-gold/30 hover:border-egypt-gold transition-colors text-[10px] uppercase tracking-widest font-bold">
                Join the Dialogue — Leave a Review
              </button>
            </div>

            {/* Virtual Preview Section */}
            <div id="virtual" className="space-y-8 scroll-mt-32 pt-8 border-t border-white/10">
              <h3 className="text-2xl font-serif text-egypt-gold uppercase tracking-widest pl-4 border-l-2 border-egypt-gold mb-10">Gallery</h3>
              <div className="relative aspect-video rounded-[40px] overflow-hidden group cursor-pointer">
                <img src="https://images.unsplash.com/photo-1549495094-152cc98398e0?auto=format&fit=crop&q=80&w=1200" className="w-full h-full object-cover opacity-50 group-hover:scale-105 transition-transform duration-700" alt="Virtual Preview" />
                <div className="absolute inset-0 flex items-center justify-center">
                   <div className="w-20 h-20 rounded-full bg-egypt-gold flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
                      <Play size={32} className="text-egypt-night ml-2" />
                   </div>
                </div>
                <div className="absolute bottom-10 left-10 text-white">
                  <h4 className="text-2xl font-serif uppercase mb-2">360° Portal</h4>
                  <p className="text-sm text-white/70 font-light">Experience the sights before you arrive.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default TourDetails;
