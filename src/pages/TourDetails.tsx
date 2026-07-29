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
import { DAY_TOURS } from '../dayTours';
import ItineraryAccordion from '../components/ItineraryAccordion';
import SEO from '../components/SEO';
import { SITE_URL, absoluteUrl } from '../config/site';

// Combined catalog: packages + day tours. Day tours take precedence on id clash.
const ALL_TOURS = [...SAMPLE_TOURS, ...DAY_TOURS];
const TourDetails = () => {
  const { id } = useParams();
  const tour = ALL_TOURS.find(t => t.id === id);
  const [activeTab, setActiveTab] = useState<string>('itinerary');
  const [requestState, setRequestState] = useState<{
    status: 'idle' | 'submitting' | 'success' | 'error';
    message?: string;
  }>({ status: 'idle' });

  const relatedTours = React.useMemo(() => {
    return ALL_TOURS
      .filter(t => t.id !== tour?.id)
      .slice(0, 3);
  }, [tour?.id]);

  const tourItinerary = React.useMemo(() => {
    if (tour?.itinerary && tour.itinerary.length > 0) return tour.itinerary;
    if (!tour) return [];
    
    return [
      {
        day: 1,
        title: `Full Day Experience: ${tour.title}`,
        description: tour.description,
        activities: (tour.highlights || []).map((highlight) => ({
          title: highlight,
          description: `Guided exploration and detailed sightseeing of the iconic ${highlight} with your private Egyptologist.`,
          icon: 'tour' as const
        })),
        meals: 'Bottled Water',
        overnight: 'Return to Hotel'
      }
    ];
  }, [tour]);

  const handleBookingRequest = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!tour) return;

    const form = event.currentTarget;
    const data = new FormData(form);
    setRequestState({ status: 'submitting' });

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tourId: tour.id,
          tourTitle: tour.title,
          name: data.get('name'),
          email: data.get('email'),
          phone: data.get('phone'),
          country: data.get('country'),
          preferredDate: data.get('date'),
          travelers: Number(data.get('travelers')),
          requirements: data.get('requirements'),
          wireTransferAcknowledged: data.get('wireTransferAcknowledged') === 'on'
        })
      });

      const payload: unknown = await response.json();
      if (!response.ok) {
        const message =
          payload &&
          typeof payload === 'object' &&
          'error' in payload &&
          payload.error &&
          typeof payload.error === 'object' &&
          'message' in payload.error &&
          typeof payload.error.message === 'string'
            ? payload.error.message
            : 'Your request could not be submitted. Please try again.';
        throw new Error(message);
      }

      const reference =
        payload &&
        typeof payload === 'object' &&
        'booking' in payload &&
        payload.booking &&
        typeof payload.booking === 'object' &&
        'reference' in payload.booking &&
        typeof payload.booking.reference === 'string'
          ? payload.booking.reference
          : '';

      form.reset();
      setRequestState({
        status: 'success',
        message: `Request received${reference ? ` — reference ${reference}` : ''}. We will review availability and contact you with a quotation.`
      });
    } catch (error) {
      setRequestState({
        status: 'error',
        message: error instanceof Error ? error.message : 'Your request could not be submitted.'
      });
    }
  };

  if (!tour) return <div className="pt-40 text-center text-white">Journey not found.</div>;

  return (
    <div className="bg-egypt-night min-h-screen">
      <SEO
        title={`${tour.title} – From $${tour.price}`}
        description={tour.description.slice(0, 155)}
        canonical={`/tours/${tour.id}`}
        type="product"
        image={tour.gallery?.[0] || tour.image}
        imageAlt={`${tour.title} in ${tour.location}, Egypt`}
        structuredData={[
          {
            '@context': 'https://schema.org',
            '@type': 'Product',
            '@id': `${SITE_URL}/tours/${tour.id}#tour`,
            name: tour.title,
            description: tour.description,
            image: (tour.gallery?.length ? tour.gallery : [tour.image]).map(absoluteUrl),
            category: 'Egypt Tour',
            brand: {
              '@type': 'Brand',
              name: 'Travision Tours'
            },
            offers: {
              '@type': 'Offer',
              url: `${SITE_URL}/tours/${tour.id}`,
              priceCurrency: 'USD',
              price: tour.price,
              availability: 'https://schema.org/InStock'
            }
          },
          {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: 'Home',
                item: SITE_URL
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: 'Egypt Tours',
                item: `${SITE_URL}/tours`
              },
              {
                '@type': 'ListItem',
                position: 3,
                name: tour.title,
                item: `${SITE_URL}/tours/${tour.id}`
              }
            ]
          }
        ]}
      />
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
                className={`w-full flex items-center gap-3 px-5 py-4 text-[13px] font-bold transition-all border-b border-white/10 last:border-0 ${activeTab === tab.id ? 'bg-[#c63d2e] text-white' : 'text-white hover:bg-white/10'
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
                <a
                  href={`https://wa.me/201004051515?text=${encodeURIComponent(`Hello, I am interested in ${tour.title}.`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-grow bg-[#c63d2e] text-white py-3 rounded font-bold text-[13px] tracking-wide hover:bg-red-800 transition-colors text-center"
                >
                  Click to Whatsapp
                </a>
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

            <form className="space-y-4" onSubmit={handleBookingRequest}>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-white/60 mb-2">Full Name</label>
                <input required name="name" autoComplete="name" type="text" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-egypt-gold transition-colors text-white" placeholder="John Doe" />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-white/60 mb-2">Email Address</label>
                <input required name="email" autoComplete="email" type="email" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-egypt-gold transition-colors text-white" placeholder="john@example.com" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-white/60 mb-2">Phone</label>
                  <input name="phone" autoComplete="tel" type="tel" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-egypt-gold transition-colors text-white" placeholder="+1 555 000 0000" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-white/60 mb-2">Country</label>
                  <input name="country" autoComplete="country-name" type="text" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-egypt-gold transition-colors text-white" placeholder="Country" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-white/60 mb-2">Date</label>
                  <input required name="date" type="date" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-egypt-gold transition-colors text-white" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-white/60 mb-2">Travelers</label>
                  <select name="travelers" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-egypt-gold transition-colors text-white appearance-none">
                    {[1, 2, 3, 4, 5, 6, 7, 8, "9+"].map(n => <option key={n} value={n} className="bg-egypt-night text-white">{n} {n === 1 ? 'Person' : 'People'}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-white/60 mb-2">Special Requirements</label>
                <textarea name="requirements" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-egypt-gold transition-colors text-white h-24 resize-none" placeholder="Any special requests?"></textarea>
              </div>
              <label className="flex items-start gap-3 text-[11px] leading-relaxed text-white/60">
                <input required name="wireTransferAcknowledged" type="checkbox" className="mt-1 accent-egypt-gold" />
                <span>
                  I understand this is a booking request, not a confirmed reservation. If approved, payment instructions will be sent privately and payment will be made by bank wire transfer.
                </span>
              </label>

              <button disabled={requestState.status === 'submitting'} type="submit" className="w-full bg-egypt-gold disabled:opacity-50 disabled:cursor-wait text-egypt-night mt-4 py-4 rounded-xl font-black uppercase tracking-[2px] text-xs hover:bg-white transition-all shadow-xl shadow-egypt-gold/20 flex items-center justify-center gap-2">
                <span>{requestState.status === 'submitting' ? 'Sending…' : 'Send Request'}</span>
                <ChevronRight size={16} />
              </button>
              {requestState.status === 'success' && (
                <p role="status" className="text-xs text-emerald-400 text-center leading-relaxed">
                  {requestState.message}
                </p>
              )}
              {requestState.status === 'error' && (
                <p role="alert" className="text-xs text-red-400 text-center leading-relaxed">
                  {requestState.message}
                </p>
              )}
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
                {tourItinerary.map((item, idx) => (
                  <ItineraryAccordion key={idx} item={item} defaultOpen={idx === 0} noAccordion={tourItinerary.length === 1} />
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
                  {(tour.reviewsList && tour.reviewsList.length > 0 ? tour.reviewsList : [
                    { author: "Rebecca Miller", text: "Our family booking with Travision Tours was absolutely spectacular. Everything from our private transfers to our Egyptologist guide at the Giza Pyramids and Egyptian Museum was handled flawlessly. Highly recommended!", rating: 5, date: "12 May, 2026" },
                    { author: "Thomas Vance", text: "The Nile Cruise and the tour of Karnak Temple were highlights of our lifetime. Travision Tours made sure every detail was perfect. The itinerary was well balanced and we felt incredibly safe and cared for.", rating: 5, date: "28 April, 2026" }
                  ]).map((rev, idx) => (
                    <div key={idx} className="border-b border-white/5 pb-8 last:border-0">
                      <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-egypt-gold/20 flex items-center justify-center text-egypt-gold font-serif">
                            {rev.author.charAt(0)}
                          </div>
                          <div>
                            <h5 className="font-serif text-sm uppercase tracking-wider text-egypt-gold">{rev.author}</h5>
                            <p className="text-[10px] text-white/30 uppercase tracking-widest">{rev.date}</p>
                          </div>
                        </div>
                        <div className="flex gap-0.5">
                          {[...Array(rev.rating)].map((_, i) => <Star key={i} size={12} className="text-egypt-gold fill-egypt-gold" />)}
                        </div>
                      </div>
                      <p className="text-sm italic font-light text-egypt-papyrus/70 leading-relaxed">
                        "{rev.text}"
                      </p>
                    </div>
                  ))}
                </div>
              </div>
              <button className="w-full py-5 rounded-2xl border border-egypt-gold/30 hover:border-egypt-gold transition-colors text-[10px] uppercase tracking-widest font-bold">
                Join the Dialogue — Leave a Review
              </button>
            </div>

            {/* Gallery Section */}
            <div id="virtual" className="space-y-8 scroll-mt-32 pt-8 border-t border-white/10">
              <h3 className="text-2xl font-serif text-egypt-gold uppercase tracking-widest pl-4 border-l-2 border-egypt-gold mb-10">Gallery</h3>
              {tour.gallery && tour.gallery.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {tour.gallery.map((imgSrc, idx) => (
                    <div key={idx} className="relative aspect-[4/3] rounded-2xl overflow-hidden group cursor-pointer border border-white/10 shadow-lg">
                      <img src={imgSrc} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt={`${tour.title} Gallery ${idx + 1}`} />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                        <span className="text-xs text-white tracking-wider font-light uppercase">View Sights</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
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
              )}
            </div>

            {/* Tour Map Section */}
            {tour.mapUrl && (
              <div id="map" className="space-y-8 scroll-mt-32 pt-8 border-t border-white/10">
                <h3 className="text-2xl font-serif text-egypt-gold uppercase tracking-widest pl-4 border-l-2 border-egypt-gold mb-10">Tour Map</h3>
                <div className="rounded-[30px] overflow-hidden border border-egypt-gold/20 shadow-2xl">
                  <iframe 
                    title={`Map route for ${tour.title}`}
                    src={tour.mapUrl} 
                    width="100%" 
                    height="450" 
                    style={{ border: 0 }} 
                    allowFullScreen={true}
                    loading="lazy" 
                    referrerPolicy="no-referrer-when-downgrade"
                    className="w-full h-[450px]"
                  ></iframe>
                </div>
              </div>
            )}

            {/* Essential Trip Information Section */}
            <div id="info" className="space-y-8 scroll-mt-32 pt-8 border-t border-white/10">
              <h3 className="text-2xl font-serif text-egypt-gold uppercase tracking-widest pl-4 border-l-2 border-egypt-gold mb-10">Essential Trip Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-egypt-basalt/20 p-6 rounded-2xl border border-white/5 space-y-3">
                  <h4 className="font-serif text-egypt-gold text-[15px] uppercase tracking-wider">Passport & Entry Visas</h4>
                  <p className="text-xs font-light text-egypt-papyrus/70 leading-relaxed">
                    Passports must be valid for at least 6 months beyond travel dates. Most tourists can obtain a 30-day single-entry Visa on Arrival for $25 USD at Cairo International Airport bank kiosks (cash only) or pre-arrange an official eVisa online prior to departure.
                  </p>
                </div>
                <div className="bg-egypt-basalt/20 p-6 rounded-2xl border border-white/5 space-y-3">
                  <h4 className="font-serif text-egypt-gold text-[15px] uppercase tracking-wider">Travel Insurance Policy</h4>
                  <p className="text-xs font-light text-egypt-papyrus/70 leading-relaxed">
                    Comprehensive travel insurance covering medical emergencies, trip cancellations, luggage, and activities is highly recommended for all guests traveling with Travision Tours.
                  </p>
                </div>
                <div className="bg-egypt-basalt/20 p-6 rounded-2xl border border-white/5 space-y-3">
                  <h4 className="font-serif text-egypt-gold text-[15px] uppercase tracking-wider">Tipping Guide & Currency</h4>
                  <p className="text-xs font-light text-egypt-papyrus/70 leading-relaxed">
                    Tipping (called baksheesh) is a customary part of Egyptian tourism culture. Small amounts are given to hotel staff, drivers, and restaurant servers. Typical recommendations are $10–$15 per day for your private guide and $5–$8 for drivers. Local currency is the Egyptian Pound (EGP).
                  </p>
                </div>
                <div className="bg-egypt-basalt/20 p-6 rounded-2xl border border-white/5 space-y-3">
                  <h4 className="font-serif text-egypt-gold text-[15px] uppercase tracking-wider">Emergency Support & Health</h4>
                  <p className="text-xs font-light text-egypt-papyrus/70 leading-relaxed">
                    Our team provides 24/7 client coordination and emergency hotlines. Bottled water is provided during sightseeing. Avoid tap water, and apply sun protection for temple visits.
                  </p>
                </div>
              </div>
            </div>

            {/* Related Tours Section */}
            <div id="related" className="space-y-8 scroll-mt-32 pt-8 border-t border-white/10">
              <h3 className="text-2xl font-serif text-egypt-gold uppercase tracking-widest pl-4 border-l-2 border-egypt-gold mb-10">Related Tours</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {relatedTours.map((relTour) => (
                  <Link 
                    key={relTour.id} 
                    to={`/tours/${relTour.id}`}
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    className="glass border border-white/5 rounded-[24px] overflow-hidden group hover:border-egypt-gold/30 transition-all flex flex-col h-full shadow-lg hover:shadow-2xl"
                  >
                    <div className="h-40 overflow-hidden relative">
                      <img src={relTour.image} alt={relTour.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      <div className="absolute top-3 left-3 bg-[#c63d2e] text-white text-[9px] uppercase tracking-widest font-black px-3 py-1.5 rounded-full">
                        {relTour.duration}
                      </div>
                    </div>
                    <div className="p-5 flex flex-col flex-grow justify-between space-y-4">
                      <div>
                        <h4 className="font-serif text-[15px] uppercase text-white tracking-wide leading-snug line-clamp-2 group-hover:text-egypt-gold transition-colors">{relTour.title}</h4>
                        <p className="text-[11px] text-white/40 uppercase tracking-widest mt-1">{relTour.location}</p>
                      </div>
                      <div className="flex justify-between items-center pt-3 border-t border-white/5">
                        <span className="text-[16px] font-serif text-egypt-gold">${relTour.price}</span>
                        <div className="flex items-center gap-1 text-[11px] font-bold text-egypt-gold">
                          <Star size={12} className="fill-egypt-gold" />
                          <span>{relTour.rating}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Read Before You Go Section */}
            <div id="read" className="space-y-8 scroll-mt-32 pt-8 border-t border-white/10">
              <h3 className="text-2xl font-serif text-egypt-gold uppercase tracking-widest pl-4 border-l-2 border-egypt-gold mb-10">Read Before You Go</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass border border-white/5 p-6 rounded-2xl space-y-3">
                  <h4 className="font-serif text-white text-[15px] uppercase tracking-wider">What to Wear</h4>
                  <p className="text-xs font-light text-egypt-papyrus/70 leading-relaxed">
                    Light, loose-fitting cotton clothing is ideal for hot days. Dress respectfully when visiting religious sites (shoulders and knees covered). Comfortable walking shoes are a must for walking over sandy and uneven tomb floor paths.
                  </p>
                </div>
                <div className="glass border border-white/5 p-6 rounded-2xl space-y-3">
                  <h4 className="font-serif text-white text-[15px] uppercase tracking-wider">Safety & Scams</h4>
                  <p className="text-xs font-light text-egypt-papyrus/70 leading-relaxed">
                    Egypt is generally a very safe destination for international travelers. Stay with your licensed guide, use official transport, and politely decline aggressive street vendors by saying "La, Shukran" (No, thank you).
                  </p>
                </div>
                <div className="glass border border-white/5 p-6 rounded-2xl space-y-3">
                  <h4 className="font-serif text-white text-[15px] uppercase tracking-wider">Food & Drink Precautions</h4>
                  <p className="text-xs font-light text-egypt-papyrus/70 leading-relaxed">
                    Always drink bottled water and use it to brush teeth. Try popular traditional dishes like Koshary, Ful Medames, and fresh flatbreads at trusted local restaurants recommended by your guide.
                  </p>
                </div>
                <div className="glass border border-white/5 p-6 rounded-2xl space-y-3">
                  <h4 className="font-serif text-white text-[15px] uppercase tracking-wider">Local Photography Rules</h4>
                  <p className="text-xs font-light text-egypt-papyrus/70 leading-relaxed">
                    Photography is allowed at most ancient archaeological temples and tomb complexes. Some indoor tomb chambers require a paid ticket or prohibit flash photography to preserve the ancient pigments.
                  </p>
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
