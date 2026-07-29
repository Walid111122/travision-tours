import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Calendar, MapPin, Clock, Users, Star,
  ArrowLeft, Share2, Heart, Shield,
  Info, ChevronRight, CheckCircle2,
  FileText, DollarSign, Image as ImageIcon, MessageCircle
} from 'lucide-react';
import { SAMPLE_TOURS } from '../constants';
import { DAY_TOURS } from '../dayTours';
import ItineraryAccordion from '../components/ItineraryAccordion';
import SEO from '../components/SEO';
import { CONTACT_PHONE, CONTACT_PHONE_DISPLAY, SITE_URL, absoluteUrl } from '../config/site';
import { getActivitySummary, getDaySummary, getTourSummary } from '../utils/tourContent';

// Combined catalog: packages + day tours. Day tours take precedence on id clash.
const ALL_TOURS = [...SAMPLE_TOURS, ...DAY_TOURS];
const TourDetails = () => {
  const { id } = useParams();
  const tour = ALL_TOURS.find(t => t.id === id);
  const tourSummary = tour ? getTourSummary(tour) : '';
  const safeGallery = tour?.gallery ?? [];
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
    if (tour?.itinerary && tour.itinerary.length > 0) {
      return tour.itinerary.map(day => ({
        ...day,
        description: getDaySummary(day.title || `Day ${day.day}`, tour.title),
        activities: (day.activities ?? []).map(activity => ({
          ...activity,
          description: getActivitySummary(activity.title)
        }))
      }));
    }
    if (!tour) return [];
    
    return [
      {
        day: 1,
        title: `Full Day Experience: ${tour.title}`,
        description: tourSummary,
        activities: (tour.highlights || []).map((highlight) => ({
          title: highlight,
          description: getActivitySummary(highlight),
          icon: 'tour' as const
        })),
        meals: 'As stated in the final quotation',
        overnight: 'Return arrangements to be confirmed'
      }
    ];
  }, [tour, tourSummary]);

  const handleBookingRequest = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!tour) return;

    const form = event.currentTarget;
    const data = new FormData(form);
    const adults = Number(data.get('adults'));
    const children = Number(data.get('children'));
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
          departureDate: data.get('departureDate'),
          travelers: adults + children,
          adults,
          children,
          childAges: data.get('childAges'),
          accommodationPreference: data.get('accommodationPreference'),
          contactPreference: data.get('contactPreference'),
          budgetRange: data.get('budgetRange'),
          referralSource: data.get('referralSource'),
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

  const handleShare = async () => {
    const shareData = {
      title: tour?.title || 'Travision Tours',
      text: tour ? `Take a look at ${tour.title} from Travision Tours.` : 'Explore Travision Tours.',
      url: window.location.href
    };

    if (navigator.share) {
      await navigator.share(shareData);
      return;
    }

    await navigator.clipboard.writeText(window.location.href);
    setRequestState({ status: 'success', message: 'Tour link copied to your clipboard.' });
  };

  const tourFaqs = [
    {
      question: 'Is submitting this form a confirmed booking?',
      answer: 'No. It is a request for availability and a quotation. Your reservation is confirmed only after Travision Tours sends written confirmation.'
    },
    {
      question: 'How do I pay for this tour?',
      answer: 'Approved bookings are paid by bank wire transfer. Official transfer instructions are shared privately after your itinerary, dates, and quotation are agreed.'
    },
    {
      question: 'Can this itinerary be customized?',
      answer: 'Yes. Tell us your preferred pace, interests, accommodation needs, and any places you would like to add or remove when submitting your request.'
    },
    {
      question: 'What should I check before traveling to Egypt?',
      answer: 'Check current passport, visa, health, insurance, and entry requirements with official authorities before departure because requirements depend on nationality and can change.'
    }
  ];

  if (!tour) return <div className="pt-40 text-center text-white">Journey not found.</div>;

  return (
    <div className="bg-egypt-night min-h-screen">
      <SEO
        title={`${tour.title} – Request a Quote`}
        description={tourSummary.slice(0, 155)}
        canonical={`/tours/${tour.id}`}
        type="website"
        image={safeGallery[0] || tour.image}
        imageAlt={`${tour.title} in ${tour.location}, Egypt`}
        structuredData={[
          {
            '@context': 'https://schema.org',
            '@type': 'TouristTrip',
            '@id': `${SITE_URL}/tours/${tour.id}#tour`,
            name: tour.title,
            description: tourSummary,
            image: (safeGallery.length ? safeGallery : [tour.image]).map(absoluteUrl),
            touristType: 'Private and tailor-made travel',
            provider: {
              '@type': 'TravelAgency',
              name: 'Travision Tours'
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
          },
          {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: tourFaqs.map(item => ({
              '@type': 'Question',
              name: item.question,
              acceptedAnswer: {
                '@type': 'Answer',
                text: item.answer
              }
            }))
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
              Estimate from: ${tour.price}
            </div>
            <button onClick={handleShare} className="bg-[#24587c] text-white px-5 py-3 rounded text-[13px] font-bold hover:bg-[#1f4a6b] transition-colors">
              Send To a Friend
            </button>
            <button onClick={() => document.getElementById('booking-form')?.scrollIntoView({ behavior: 'smooth' })} className="bg-[#1f4a6b] text-white px-5 py-3 rounded text-[13px] font-bold hover:bg-blue-900 transition-colors">
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
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/45 to-black/70 flex items-center px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full">
              {[
                { label: 'Duration', value: tour.duration },
                { label: 'Destination', value: tour.location },
                { label: 'Tour style', value: tour.category },
                { label: 'Availability', value: 'On request' }
              ].map(fact => (
                <div key={fact.label}>
                  <p className="text-[9px] uppercase tracking-[0.2em] text-egypt-gold mb-1">{fact.label}</p>
                  <p className="text-sm md:text-base font-serif text-white capitalize">{fact.value}</p>
                </div>
              ))}
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
              { id: 'prices', label: 'Price & Quote', icon: <DollarSign size={18} /> },
              { id: 'virtual', label: 'Gallery', icon: <ImageIcon size={18} /> },
              { id: 'booking', label: 'How Booking Works', icon: <Shield size={18} /> },
              { id: 'faq', label: 'Good to Know', icon: <Info size={18} /> },
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
                  setActiveTab(tab.id);
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
                  href={`https://wa.me/${CONTACT_PHONE.replace(/\D/g, '')}?text=${encodeURIComponent(`Hello, I am interested in ${tour.title}.`)}`}
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
              <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold mb-1">Indicative estimate from</p>
              <div className="flex items-end gap-2">
                <span className="text-[40px] font-serif leading-none text-egypt-gold">${tour.price}</span>
                <span className="text-xs text-white/40 uppercase tracking-widest pb-1 mb-1 border-b border-white/10">Per person</span>
              </div>
            </div>
            <p className="mb-5 text-[11px] leading-relaxed text-white/50">
              This amount is for early planning only. Dates, group size, accommodation, transport, admissions, and supplier availability determine the written quotation.
            </p>

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
                  <input required name="phone" autoComplete="tel" type="tel" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-egypt-gold transition-colors text-white" placeholder="Phone / WhatsApp" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-white/60 mb-2">Country</label>
                  <input name="country" autoComplete="country-name" type="text" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-egypt-gold transition-colors text-white" placeholder="Country" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-white/60 mb-2">Arrival Date</label>
                  <input required name="date" min={new Date().toISOString().slice(0, 10)} type="date" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-egypt-gold transition-colors text-white" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-white/60 mb-2">Departure Date</label>
                  <input name="departureDate" min={new Date().toISOString().slice(0, 10)} type="date" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-egypt-gold transition-colors text-white" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-white/60 mb-2">Adults</label>
                  <input required name="adults" min="1" max="50" defaultValue="1" type="number" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-egypt-gold transition-colors text-white" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-white/60 mb-2">Children</label>
                  <input required name="children" min="0" max="20" defaultValue="0" type="number" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-egypt-gold transition-colors text-white" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-white/60 mb-2">Children’s Ages</label>
                <input name="childAges" type="text" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-egypt-gold transition-colors text-white" placeholder="Example: 6, 10" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-white/60 mb-2">Accommodation</label>
                  <select name="accommodationPreference" defaultValue="" className="w-full bg-egypt-night border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-egypt-gold text-white">
                    <option value="">No preference</option>
                    <option value="comfortable">Comfortable</option>
                    <option value="premium">Premium</option>
                    <option value="luxury">Luxury</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-white/60 mb-2">Preferred Contact</label>
                  <select name="contactPreference" defaultValue="whatsapp" className="w-full bg-egypt-night border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-egypt-gold text-white">
                    <option value="whatsapp">WhatsApp</option>
                    <option value="email">Email</option>
                    <option value="phone">Phone call</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-white/60 mb-2">Budget Range</label>
                  <select name="budgetRange" defaultValue="" className="w-full bg-egypt-night border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-egypt-gold text-white">
                    <option value="">Not decided</option>
                    <option value="under-1000">Under US$1,000 / person</option>
                    <option value="1000-2000">US$1,000–2,000 / person</option>
                    <option value="2000-4000">US$2,000–4,000 / person</option>
                    <option value="4000-plus">US$4,000+ / person</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-white/60 mb-2">How You Found Us</label>
                  <select name="referralSource" defaultValue="" className="w-full bg-egypt-night border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-egypt-gold text-white">
                    <option value="">Prefer not to say</option>
                    <option value="google">Google</option>
                    <option value="social">Social media</option>
                    <option value="friend">Friend or family</option>
                    <option value="other">Other</option>
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
                  I understand this is a booking request, not a confirmed reservation. If approved, payment instructions will be sent privately and payment will be made by bank wire transfer. I have read the{' '}
                  <Link to="/policies" className="text-egypt-gold hover:text-white">privacy, booking, and payment policies</Link>.
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
              No payment is collected on this website.
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
                <a href={`tel:${CONTACT_PHONE}`} className="text-egypt-gold hover:text-white transition-colors">{CONTACT_PHONE_DISPLAY}</a>
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
                {tourSummary}
              </p>
            </div>

            {/* Inclusions Section */}
            <div id="inclusions" className="grid grid-cols-1 md:grid-cols-2 gap-10 scroll-mt-32 pt-8 border-t border-white/10">
              <div className="space-y-6">
                <h3 className="text-2xl font-serif text-white uppercase tracking-widest pl-4 border-l-2 border-emerald-500">Inclusions</h3>
                <ul className="space-y-3">
                  {(tour.inclusions || [
                    'Services itemized as included in your written quotation.',
                    'Transport, meals, guides, and admission tickets only when specifically listed.',
                    'Applicable taxes or service charges only when stated in the accepted quotation.'
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
                    'International flights, visas, travel insurance, and personal expenses unless specifically listed.',
                    'Optional activities, gratuities, and services not identified as included.',
                    'Bank fees or currency-conversion charges associated with the wire transfer.'
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
                  `Planned sightseeing in ${tour.location}`,
                  'Itinerary timing adapted to current site access',
                  'Options confirmed in the written quotation'
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
              <h3 className="text-2xl font-serif text-egypt-gold uppercase tracking-widest pl-4 border-l-2 border-egypt-gold">Price & Quotation</h3>
              <div className="glass rounded-[30px] border border-egypt-gold/20 p-8 md:p-10 grid md:grid-cols-[0.8fr_1.2fr] gap-8 items-center">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 mb-2">Indicative starting price</p>
                  <p className="text-5xl font-serif text-egypt-gold">${tour.price}</p>
                  <p className="text-xs text-white/40 mt-2">per person, subject to your final quotation</p>
                </div>
                <div className="space-y-4 text-sm text-egypt-papyrus/70 leading-relaxed">
                  <p>Your final price depends on travel dates, group size, accommodation, requested changes, and supplier availability.</p>
                  <p>Submit an inquiry for a written itinerary and itemized quotation. No payment is requested through this website.</p>
                  <button onClick={() => document.getElementById('booking-form')?.scrollIntoView({ behavior: 'smooth' })} className="bg-egypt-gold text-egypt-night px-6 py-3 rounded-xl text-[10px] uppercase tracking-widest font-black">
                    Request your quotation
                  </button>
                </div>
              </div>
            </div>

            {/* Booking Process */}
            <div id="booking" className="space-y-8 scroll-mt-32 pt-8 border-t border-white/10">
              <h3 className="text-2xl font-serif text-egypt-gold uppercase tracking-widest pl-4 border-l-2 border-egypt-gold">How Booking Works</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                  ['01', 'Send your request', 'Share your dates, group size, and preferences.'],
                  ['02', 'Review your quote', 'We confirm availability and send a written proposal.'],
                  ['03', 'Arrange wire transfer', 'Official bank details are shared privately after approval.'],
                  ['04', 'Receive confirmation', 'Your booking is confirmed in writing after payment verification.']
                ].map(([number, title, description]) => (
                  <div key={number} className="glass rounded-2xl border border-white/5 p-6">
                    <span className="text-3xl font-serif text-egypt-gold/40">{number}</span>
                    <h4 className="text-base uppercase mt-5 mb-3">{title}</h4>
                    <p className="text-xs leading-relaxed text-egypt-papyrus/60">{description}</p>
                  </div>
                ))}
              </div>
              <div className="bg-egypt-red/10 border border-egypt-red/30 rounded-2xl p-6 text-sm text-egypt-papyrus/70">
                For your security, never send funds using bank details published on a webpage or supplied by an unverified account. Confirm transfer instructions through official Travision Tours contact details.
              </div>
            </div>

            {/* Gallery Section */}
            <div id="virtual" className="space-y-8 scroll-mt-32 pt-8 border-t border-white/10">
              <h3 className="text-2xl font-serif text-egypt-gold uppercase tracking-widest pl-4 border-l-2 border-egypt-gold mb-10">Gallery</h3>
              {safeGallery.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {safeGallery.map((imgSrc, idx) => (
                    <div key={idx} className="relative aspect-[4/3] rounded-2xl overflow-hidden group cursor-pointer border border-white/10 shadow-lg">
                      <img src={imgSrc} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt={`${tour.title} Gallery ${idx + 1}`} />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                        <span className="text-xs text-white tracking-wider font-light uppercase">View Sights</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="relative aspect-video rounded-[40px] overflow-hidden">
                  <img src={tour.image} className="w-full h-full object-cover opacity-70" alt={`${tour.title} preview`} />
                  <div className="absolute bottom-10 left-10 text-white">
                    <h4 className="text-2xl font-serif uppercase mb-2">Tour Preview</h4>
                    <p className="text-sm text-white/70 font-light">Representative image for this itinerary.</p>
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
                    Entry requirements depend on nationality and can change. Check passport-validity and visa rules with Egypt's official authorities or the nearest Egyptian consulate before booking travel.
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
                    Tipping, often called baksheesh, is customary but discretionary. Your travel specialist can provide current guidance before departure. The local currency is the Egyptian Pound (EGP).
                  </p>
                </div>
                <div className="bg-egypt-basalt/20 p-6 rounded-2xl border border-white/5 space-y-3">
                  <h4 className="font-serif text-egypt-gold text-[15px] uppercase tracking-wider">Health & On-Trip Support</h4>
                  <p className="text-xs font-light text-egypt-papyrus/70 leading-relaxed">
                    Support arrangements and emergency contacts are provided with your confirmed travel documents. Bring required medication, use sun protection, and follow current professional health advice.
                  </p>
                </div>
              </div>
            </div>

            {/* Frequently Asked Questions */}
            <div id="faq" className="space-y-8 scroll-mt-32 pt-8 border-t border-white/10">
              <h3 className="text-2xl font-serif text-egypt-gold uppercase tracking-widest pl-4 border-l-2 border-egypt-gold">Good to Know</h3>
              <div className="space-y-4">
                {tourFaqs.map(item => (
                  <details key={item.question} className="glass rounded-2xl border border-white/5 p-6 group">
                    <summary className="cursor-pointer list-none flex justify-between gap-6 font-serif text-base text-white">
                      {item.question}
                      <ChevronRight size={18} className="text-egypt-gold shrink-0 transition-transform group-open:rotate-90" />
                    </summary>
                    <p className="pt-4 mt-4 border-t border-white/5 text-sm leading-relaxed text-egypt-papyrus/65">
                      {item.answer}
                    </p>
                  </details>
                ))}
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
                        <span className="text-[10px] uppercase tracking-widest text-white/40">{relTour.duration}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Read Before You Go Section */}
            <div id="read" className="space-y-8 scroll-mt-32 pt-8 border-t border-white/10">
              <h3 className="text-2xl font-serif text-egypt-gold uppercase tracking-widest pl-4 border-l-2 border-egypt-gold mb-10">Packing & Practical Notes</h3>
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
                    Follow current government travel advice and the guidance provided with your confirmed itinerary. Use arranged transport, keep valuables secure, and politely decline unwanted offers.
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
