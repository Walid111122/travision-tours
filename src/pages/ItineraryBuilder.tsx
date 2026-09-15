import React, { useEffect, useRef, useState } from 'react';
import { Reorder } from 'motion/react';
import {
  Plus, GripVertical, Trash2, Map, Share2,
  Save, MapPin, Sparkles, Send, CheckCircle2, X, ChevronUp, ChevronDown
} from 'lucide-react';
import SEO from '../components/SEO';
import Modal from '../components/Modal';
import TurnstileWidget, { isTurnstileEnabled } from '../components/TurnstileWidget';
import { CONTACT_PHONE, PAYMENT_PARTNER_NAME } from '../config/site';
import { createSubmissionKey, submitInquiry } from '../utils/inquiry';
import {
  ITINERARY_STORAGE_KEY,
  PLANNER_REGIONS,
  PLANNER_STOPS,
  findPlannerStop,
  type PlannerRegionId,
  type PlannerStop
} from '../plannerStops';

type RequestState = {
  status: 'idle' | 'submitting' | 'success' | 'error';
  message?: string;
  reference?: string;
};

const today = () => {
  const localDate = new Date();
  localDate.setMinutes(localDate.getMinutes() - localDate.getTimezoneOffset());
  return localDate.toISOString().slice(0, 10);
};

const readSavedIds = (): string[] => {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(ITINERARY_STORAGE_KEY) || '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((value): value is string => typeof value === 'string');
  } catch {
    localStorage.removeItem(ITINERARY_STORAGE_KEY);
    return [];
  }
};

const ItineraryBuilder = () => {
  const [items, setItems] = useState<PlannerStop[]>([]);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRegion, setFilterRegion] = useState<'all' | PlannerRegionId>('all');
  const [notice, setNotice] = useState('');
  const [requestState, setRequestState] = useState<RequestState>({ status: 'idle' });
  const [turnstileToken, setTurnstileToken] = useState('');
  const [turnstileReset, setTurnstileReset] = useState(0);

  /**
   * One submission key per intentional inquiry, kept across failures so a retry
   * replays the original booking instead of creating a duplicate.
   */
  const submissionKeyRef = useRef(createSubmissionKey());

  /** The confirmation panel, focused once the request succeeds. */
  const successRef = useRef<HTMLDivElement>(null);

  /** The form-level error summary, focused when the server rejects a request. */
  const errorRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const sharedIds = new URLSearchParams(window.location.search).get('stops')?.split(',').filter(Boolean);
    const ids = sharedIds?.length ? sharedIds : readSavedIds();
    setItems(ids.map(id => findPlannerStop(id)).filter(Boolean) as PlannerStop[]);
  }, []);

  /**
   * The confirmation replaces the form, which unmounts the focused submit
   * button. Focus moves to the confirmation so a screen reader announces it and
   * the next Tab press stays inside the dialog.
   */
  useEffect(() => {
    if (requestState.status === 'success') successRef.current?.focus();
  }, [requestState.status]);

  /**
   * A rejection is reported as one message rather than per field, so it is
   * presented as an error summary and focused. `role="alert"` announces it; the
   * focus move also guarantees the visitor lands on it rather than being left to
   * hunt for what changed.
   */
  useEffect(() => {
    if (requestState.status === 'error') errorRef.current?.focus();
  }, [requestState.status]);

  const saveItinerary = () => {
    localStorage.setItem(ITINERARY_STORAGE_KEY, JSON.stringify(items.map(item => item.id)));
    setNotice(items.length ? 'Itinerary saved on this device.' : 'Empty itinerary saved.');
    window.setTimeout(() => setNotice(''), 3000);
  };

  // `window` does not exist while the page is being prerendered. The share
  // modal is closed on first paint, so the relative fallback is never shown to
  // a crawler — it only matters that the render does not throw.
  const shareOrigin = typeof window === 'undefined' ? '' : window.location.origin;
  const shareUrl = `${shareOrigin}/planner?stops=${items.map(item => item.id).join(',')}`;

  const copyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setNotice('Share link copied.');
    } catch {
      setNotice('Copy the link manually — clipboard access was blocked.');
    }
    setShowShareModal(false);
    window.setTimeout(() => setNotice(''), 3000);
  };

  const addStop = (stop: PlannerStop) => {
    if (!items.find(i => i.id === stop.id)) {
      setItems([...items, stop]);
    }
  };

  const removeStop = (id: string) => {
    setItems(items.filter(i => i.id !== id));
  };

  /**
   * Keyboard-accessible reordering. The list can be dragged with a pointer, but
   * dragging is unavailable to keyboard and switch users, so the same operation
   * is exposed as explicit move-up / move-down controls.
   */
  const moveStop = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    setItems(next);
  };

  const submitRequest = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // Guards against a double submit that slipped past the disabled button.
    if (requestState.status === 'submitting') return;

    const data = new FormData(event.currentTarget);
    const adults = Number(data.get('adults') ?? 1);
    const children = Number(data.get('children') ?? 0);

    setRequestState({ status: 'submitting' });

    const outcome = await submitInquiry(
      {
        source: 'planner',
        itineraryStopIds: items.map(item => item.id),
        name: data.get('name'),
        email: data.get('email'),
        phone: data.get('phone'),
        country: data.get('country') || undefined,
        preferredDate: data.get('preferredDate'),
        adults,
        children,
        travelers: adults + children,
        childAges: data.get('childAges') || undefined,
        requirements: data.get('requirements') || undefined,
        companyWebsite: data.get('companyWebsite') || undefined,
        turnstileToken: turnstileToken || undefined,
        partnerPaymentAcknowledged: data.get('partnerPaymentAcknowledged') === 'on'
      },
      submissionKeyRef.current
    );

    if (!outcome.ok) {
      // The submission key is intentionally kept so a retry is idempotent.
      setRequestState({ status: 'error', message: outcome.message });
      return;
    }

    // Only now is a fresh key issued: the next inquiry is a new submission.
    submissionKeyRef.current = createSubmissionKey();
    if (isTurnstileEnabled) setTurnstileReset(value => value + 1);
    setTurnstileToken('');
    setRequestState({ status: 'success', reference: outcome.reference });
  };

  const filteredStops = PLANNER_STOPS.filter(stop => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = stop.title.toLowerCase().includes(query) || stop.location.toLowerCase().includes(query);
    const matchesRegion = filterRegion === 'all' || stop.region === filterRegion;
    return matchesSearch && matchesRegion;
  });

  const whatsappUrl = `https://wa.me/${CONTACT_PHONE.replace(/\D/g, '')}?text=${encodeURIComponent(
    `Hello, I would like to follow up on my itinerary request ${requestState.reference ?? ''}.`
  )}`;

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
           <MapPin size={20} />
           <span className="text-[10px] uppercase font-black tracking-widest">Custom itinerary planner</span>
        </div>
        <h1 className="text-5xl md:text-7xl font-serif uppercase leading-none">Architect your <br /><span className="text-egypt-gold">Legacy</span></h1>
        <p className="text-egypt-papyrus/50 mt-6 max-w-xl font-light italic">
          Forge a unique path through the sands. Choose the landmarks you want to visit, then send your itinerary as a request for a written quotation.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left: Stop Selection */}
        <div className="lg:col-span-4 space-y-8">
           <div className="glass p-8 rounded-[40px] border border-white/5">
              <h2 className="text-xs uppercase tracking-widest font-black text-egypt-gold mb-6">Available landmarks</h2>

              {/* Search Bar */}
              <div className="relative mb-6">
                <label htmlFor="planner-stop-search" className="sr-only">Search landmarks</label>
                <input
                  id="planner-stop-search"
                  type="text"
                  placeholder="Search landmarks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-egypt-gold transition-colors text-white"
                />
              </div>

              {/* Region Filter Pills */}
              <div
                role="group"
                aria-label="Filter landmarks by region"
                className="flex gap-2 overflow-x-auto pb-4 mb-6 no-scrollbar"
              >
                {PLANNER_REGIONS.map(region => (
                  <button
                    key={region.id}
                    type="button"
                    onClick={() => setFilterRegion(region.id)}
                    aria-pressed={filterRegion === region.id}
                    className={`px-3 py-1.5 rounded-full text-[9px] uppercase tracking-wider font-bold whitespace-nowrap transition-colors border ${
                      filterRegion === region.id
                        ? 'bg-egypt-gold text-egypt-night border-egypt-gold'
                        : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
                    }`}
                  >
                    {region.name}
                  </button>
                ))}
              </div>

              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 no-scrollbar">
                 {filteredStops.map(stop => (
                   <div key={stop.id} className="flex justify-between items-center p-4 rounded-2xl bg-white/5 border border-white/5 group hover:border-egypt-gold/50 transition-all">
                      <div>
                         <h3 className="text-sm font-medium text-white group-hover:text-egypt-gold transition-colors">{stop.title}</h3>
                         <span className="text-[9px] uppercase tracking-widest text-white/60">{stop.location}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => addStop(stop)}
                        aria-label={`Add ${stop.title} to your itinerary`}
                        className="w-10 h-10 rounded-full bg-egypt-gold/10 flex items-center justify-center text-egypt-gold hover:bg-egypt-gold hover:text-egypt-night transition-all"
                      >
                         <Plus size={18} />
                      </button>
                   </div>
                 ))}
                 {filteredStops.length === 0 && (
                   <p className="text-sm italic font-light text-egypt-papyrus/60 px-2">
                     No landmarks match that search.
                   </p>
                 )}
              </div>
           </div>

           <div className="bg-egypt-gold/5 border border-egypt-gold/20 p-8 rounded-[30px] flex gap-6 items-center">
              <div className="w-16 h-16 rounded-full bg-egypt-gold flex items-center justify-center text-egypt-night">
                 <Sparkles size={24} />
              </div>
              <div>
                 <h3 className="text-xs uppercase tracking-widest font-black text-egypt-gold mb-1">How this works</h3>
                 <p className="text-xs italic font-light text-egypt-papyrus/60">Add your stops, then send the list as a request. We reply with availability and a written quotation.</p>
              </div>
           </div>
        </div>

        {/* Center: Reorderable List */}
        <div className="lg:col-span-4 space-y-8">
           <div className="glass p-8 rounded-[40px] border border-egypt-gold/20 min-h-[600px] flex flex-col">
              <div className="flex justify-between items-center mb-10">
                 <h2 className="text-xs uppercase tracking-widest font-black text-white">Your itinerary</h2>
                 <span className="text-[10px] font-mono text-egypt-gold">{items.length} STOPS</span>
              </div>

              {items.length === 0 ? (
                /* The muted "empty" look comes from the text colour rather than a
                   container-level `opacity-30`: the latter dimmed the paragraph to
                   roughly 2.5:1 against the panel, which is unreadable. */
                <div className="flex-grow flex flex-col items-center justify-center text-center px-10">
                   <div className="w-20 h-20 rounded-full border-2 border-dashed border-white/25 flex items-center justify-center mb-6 text-egypt-papyrus/60">
                      <GripVertical size={32} aria-hidden="true" />
                   </div>
                   <p className="text-sm italic font-light leading-relaxed text-egypt-papyrus/60">The sands are empty. Begin adding points to your timeline.</p>
                </div>
              ) : (
                <Reorder.Group axis="y" values={items} onReorder={setItems} className="space-y-4">
                  {items.map((item, index) => (
                    <Reorder.Item
                      key={item.id}
                      value={item}
                      className="p-5 rounded-2xl bg-egypt-night border border-white/10 flex items-center gap-3 cursor-grab active:cursor-grabbing hover:border-egypt-gold/30 transition-all"
                    >
                      {/* Decorative only — reordering is exposed to assistive
                          technology through the move buttons below. */}
                      <GripVertical aria-hidden="true" className="text-white/20 shrink-0" size={20} />
                      <div className="flex-grow min-w-0">
                         <h3 className="text-sm font-medium">{item.title}</h3>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => moveStop(index, -1)}
                          disabled={index === 0}
                          aria-label={`Move ${item.title} earlier in your itinerary`}
                          className="w-9 h-9 rounded-lg flex items-center justify-center text-white/60 hover:text-egypt-gold hover:bg-white/5 transition-colors disabled:opacity-25 disabled:cursor-not-allowed"
                        >
                          <ChevronUp size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveStop(index, 1)}
                          disabled={index === items.length - 1}
                          aria-label={`Move ${item.title} later in your itinerary`}
                          className="w-9 h-9 rounded-lg flex items-center justify-center text-white/60 hover:text-egypt-gold hover:bg-white/5 transition-colors disabled:opacity-25 disabled:cursor-not-allowed"
                        >
                          <ChevronDown size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeStop(item.id)}
                          aria-label={`Remove ${item.title} from your itinerary`}
                          className="w-9 h-9 rounded-lg flex items-center justify-center text-white/20 hover:text-egypt-red hover:bg-white/5 transition-colors"
                        >
                           <Trash2 size={16} />
                        </button>
                      </div>
                    </Reorder.Item>
                  ))}
                </Reorder.Group>
              )}

              <div className="mt-auto pt-10 space-y-4">
                 <button
                   type="button"
                   onClick={() => { setRequestState({ status: 'idle' }); setShowRequestModal(true); }}
                   disabled={items.length === 0}
                   className="w-full py-5 bg-egypt-gold text-egypt-night rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                 >
                    Request this itinerary
                 </button>
                 <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setShowShareModal(true)}
                      className="flex-grow py-5 bg-white text-egypt-night rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-egypt-gold transition-all"
                    >
                       Share itinerary
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

        {/* Right: Written itinerary preview */}
        <div className="lg:col-span-4 lg:sticky lg:top-32 h-[700px]">
           <div className="w-full h-full glass rounded-[40px] overflow-hidden border border-white/10 flex flex-col">
              <div className="p-8 border-b border-white/10">
                 <div className="flex items-center gap-3 text-egypt-gold mb-3">
                    <Map size={20} />
                    <span className="text-[10px] uppercase font-black tracking-widest">Itinerary preview</span>
                 </div>
                 <p className="text-xs text-white/60 font-light leading-relaxed">
                    Your selected stops, in the order you arranged them. This is a written summary, not a live map.
                 </p>
              </div>

              <div className="flex-grow overflow-y-auto p-8 no-scrollbar">
                 {items.length === 0 ? (
                    <p className="text-sm italic font-light text-egypt-papyrus/60">
                       Add landmarks to see your itinerary preview.
                    </p>
                 ) : (
                    <ol className="space-y-6">
                       {items.map((item, idx) => (
                          <li key={item.id} className="flex gap-4">
                             <span className="font-mono text-[10px] text-egypt-gold pt-1">{String(idx + 1).padStart(2, '0')}</span>
                             <div>
                                <h3 className="text-sm font-medium text-white">{item.title}</h3>
                                <span className="text-[9px] uppercase tracking-widest text-white/60">{item.location}</span>
                             </div>
                          </li>
                       ))}
                    </ol>
                 )}
              </div>

              <div className="p-8 border-t border-white/10">
                 <p className="text-[10px] uppercase tracking-widest text-white/60">
                    {items.length} {items.length === 1 ? 'stop' : 'stops'} selected
                 </p>
              </div>
           </div>
        </div>
      </div>

      {notice && (
        <div role="status" className="fixed bottom-6 right-6 z-[110] bg-egypt-gold text-egypt-night px-6 py-4 rounded-xl font-bold text-sm shadow-2xl">
          {notice}
        </div>
      )}

      {/* Share Modal */}
      <Modal
        open={showShareModal}
        onClose={() => setShowShareModal(false)}
        titleId="share-itinerary-title"
        className="max-w-md w-full glass p-10 rounded-[60px] border border-egypt-gold/30 text-center"
      >
        <div className="w-20 h-20 rounded-full bg-egypt-gold/10 flex items-center justify-center text-egypt-gold mx-auto mb-8">
           <Share2 size={32} aria-hidden="true" />
        </div>
        <h2 id="share-itinerary-title" className="text-3xl font-serif uppercase mb-4">Share your <span className="text-egypt-gold">itinerary</span></h2>
        <p className="text-egypt-papyrus/60 font-light mb-10 leading-relaxed italic">
           Copy this link to share the selected stops and their current order.
        </p>
        <div className="bg-egypt-night p-4 rounded-2xl break-all font-mono text-[10px] text-egypt-gold mb-10 border border-white/5">
           {shareUrl}
        </div>
        <div className="grid grid-cols-2 gap-4">
           <button type="button" onClick={copyShareLink} className="py-4 bg-white text-egypt-night rounded-2xl font-black uppercase text-[10px] tracking-widest">
              Copy link
           </button>
           <button type="button" onClick={() => setShowShareModal(false)} className="py-4 border border-white/10 rounded-2xl font-black uppercase text-[10px] tracking-widest">
              Close
           </button>
        </div>
      </Modal>

      {/* Request Modal.
          The confirmation and form branches are mutually exclusive, so they can
          safely share the id that names the dialog. */}
      <Modal
        open={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        titleId="request-itinerary-title"
        className="max-w-2xl w-full glass p-8 md:p-12 rounded-[50px] border border-egypt-gold/30 my-8"
        backdropClassName="overflow-y-auto"
      >
        {requestState.status === 'success' ? (
          <div ref={successRef} tabIndex={-1} role="status" className="text-center">
            <div className="w-20 h-20 rounded-full bg-egypt-gold/10 flex items-center justify-center text-egypt-gold mx-auto mb-8">
              <CheckCircle2 size={36} aria-hidden="true" />
            </div>
            <h2 id="request-itinerary-title" className="text-3xl font-serif uppercase mb-4">Request <span className="text-egypt-gold">received</span></h2>
            <p className="text-egypt-papyrus/60 font-light leading-relaxed mb-4">
              This is a request, not a confirmed reservation. Travision Tours will review your itinerary and reply with availability and a written quotation.
            </p>
            <p className="text-egypt-papyrus/50 font-light leading-relaxed mb-6 text-sm">
              If you accept the quotation, payment instructions arrive separately, and payment is made directly to {PAYMENT_PARTNER_NAME}. Travision Tours never collects payment.
            </p>
            <div className="bg-egypt-night p-4 rounded-2xl font-mono text-sm text-egypt-gold mb-8 border border-white/5">
              {requestState.reference}
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="py-4 bg-white text-egypt-night rounded-2xl font-black uppercase text-[10px] tracking-widest text-center"
              >
                Follow up on WhatsApp
              </a>
              <button
                type="button"
                onClick={() => { setShowRequestModal(false); setRequestState({ status: 'idle' }); }}
                className="py-4 border border-white/10 rounded-2xl font-black uppercase text-[10px] tracking-widest"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between mb-8">
              <div>
                <h2 id="request-itinerary-title" className="text-3xl font-serif uppercase">Request this <span className="text-egypt-gold">itinerary</span></h2>
                <p className="text-xs text-white/60 font-light mt-2">{items.length} stops selected. Sending this is a request, not a reservation.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowRequestModal(false)}
                aria-label="Close request form"
                className="text-white/60 hover:text-white transition-colors p-2 -m-2"
              >
                <X size={22} aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={submitRequest} className="space-y-5">
              <div className="hidden" aria-hidden="true">
                <label htmlFor="planner-companyWebsite">Company website</label>
                <input id="planner-companyWebsite" name="companyWebsite" type="text" tabIndex={-1} autoComplete="off" />
              </div>

              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="planner-name" className="block text-[10px] uppercase tracking-widest text-white/60 mb-2">Name</label>
                  <input id="planner-name" name="name" required autoComplete="name" type="text" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-egypt-gold transition-colors text-white" />
                </div>
                <div>
                  <label htmlFor="planner-email" className="block text-[10px] uppercase tracking-widest text-white/60 mb-2">Email</label>
                  <input id="planner-email" name="email" required autoComplete="email" type="email" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-egypt-gold transition-colors text-white" />
                </div>
                <div>
                  <label htmlFor="planner-phone" className="block text-[10px] uppercase tracking-widest text-white/60 mb-2">Phone / WhatsApp</label>
                  <input id="planner-phone" name="phone" required autoComplete="tel" type="tel" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-egypt-gold transition-colors text-white" />
                </div>
                <div>
                  <label htmlFor="planner-country" className="block text-[10px] uppercase tracking-widest text-white/60 mb-2">Country</label>
                  <input id="planner-country" name="country" autoComplete="country-name" type="text" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-egypt-gold transition-colors text-white" />
                </div>
                <div>
                  <label htmlFor="planner-date" className="block text-[10px] uppercase tracking-widest text-white/60 mb-2">Preferred arrival date</label>
                  <input id="planner-date" name="preferredDate" required type="date" min={today()} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-egypt-gold transition-colors text-white" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="planner-adults" className="block text-[10px] uppercase tracking-widest text-white/60 mb-2">Adults</label>
                    <input id="planner-adults" name="adults" type="number" min="1" max="50" defaultValue="2" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-egypt-gold transition-colors text-white" />
                  </div>
                  <div>
                    <label htmlFor="planner-children" className="block text-[10px] uppercase tracking-widest text-white/60 mb-2">Children</label>
                    <input id="planner-children" name="children" type="number" min="0" max="20" defaultValue="0" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-egypt-gold transition-colors text-white" />
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="planner-child-ages" className="block text-[10px] uppercase tracking-widest text-white/60 mb-2">Ages of children (if any)</label>
                <input id="planner-child-ages" name="childAges" type="text" placeholder="Example: 6, 10" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-egypt-gold transition-colors text-white" />
              </div>

              <div>
                <label htmlFor="planner-requirements" className="block text-[10px] uppercase tracking-widest text-white/60 mb-2">Notes or special requirements</label>
                <textarea id="planner-requirements" name="requirements" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-egypt-gold transition-colors text-white h-24 resize-none"></textarea>
              </div>

              <label className="flex items-start gap-3 text-xs text-egypt-papyrus/60 font-light leading-relaxed">
                <input required name="partnerPaymentAcknowledged" type="checkbox" className="mt-1 accent-egypt-gold" />
                <span>I understand this is a request, not a confirmed reservation, and that payment instructions are sent separately by the travel partner.</span>
              </label>

              {requestState.status === 'error' && (
                <p
                  ref={errorRef}
                  id="planner-request-error"
                  role="alert"
                  tabIndex={-1}
                  className="text-xs text-egypt-red bg-egypt-red/10 border border-egypt-red/30 rounded-xl px-4 py-3"
                >
                  {requestState.message}
                </p>
              )}

              <TurnstileWidget onToken={setTurnstileToken} resetSignal={turnstileReset} className="flex justify-center" />

              <div className="flex gap-4 pt-2">
                <button
                  type="submit"
                  disabled={requestState.status === 'submitting'}
                  aria-busy={requestState.status === 'submitting'}
                  className="flex-grow py-4 bg-egypt-gold text-egypt-night rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-white transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Send size={16} aria-hidden="true" />
                  {requestState.status === 'submitting' ? 'Sending…' : 'Send request'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="px-8 py-4 border border-white/10 rounded-2xl font-black uppercase text-[10px] tracking-widest"
                >
                  Cancel
                </button>
              </div>
            </form>
          </>
        )}
      </Modal>
    </div>
  );
};

export default ItineraryBuilder;
