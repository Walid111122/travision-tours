import React from 'react';
import { Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import SEO from '../components/SEO';
import { CONTACT_EMAIL, CONTACT_PHONE, CONTACT_PHONE_DISPLAY } from '../config/site';

const whatsappUrl = `https://wa.me/${CONTACT_PHONE.replace(/\D/g, '')}`;

const Contact = () => (
  <div className="min-h-screen bg-egypt-night px-6 pb-24 pt-40 text-egypt-papyrus">
    <SEO
      title="Contact Travision Tours"
      description="Contact Travision Tours by WhatsApp, telephone, or email to discuss a private Egypt itinerary and request a written quotation."
      canonical="/contact"
    />
    <main className="mx-auto max-w-5xl">
      <p className="text-label mb-4">Contact</p>
      <h1 className="font-serif text-4xl uppercase text-white md:text-7xl">
        Start planning your <span className="italic text-egypt-gold">Egypt journey</span>
      </h1>
      <p className="mt-7 max-w-2xl font-light leading-relaxed text-egypt-papyrus/70">
        Tell us your preferred dates, destinations, number of travelers, and accommodation style.
        We will review the request before providing availability and a written quotation.
      </p>

      <div className="mt-14 grid gap-6 md:grid-cols-2">
        <a href={whatsappUrl} target="_blank" rel="noreferrer" className="glass rounded-3xl border border-white/10 p-8 hover:border-egypt-gold/50">
          <MessageCircle className="text-egypt-gold" />
          <h2 className="mt-5 font-serif text-2xl text-white">WhatsApp</h2>
          <p className="mt-2 text-egypt-papyrus/60">{CONTACT_PHONE_DISPLAY}</p>
        </a>
        <a href={`tel:${CONTACT_PHONE}`} className="glass rounded-3xl border border-white/10 p-8 hover:border-egypt-gold/50">
          <Phone className="text-egypt-gold" />
          <h2 className="mt-5 font-serif text-2xl text-white">Telephone</h2>
          <p className="mt-2 text-egypt-papyrus/60">{CONTACT_PHONE_DISPLAY}</p>
        </a>
        <a href={`mailto:${CONTACT_EMAIL}`} className="glass rounded-3xl border border-white/10 p-8 hover:border-egypt-gold/50">
          <Mail className="text-egypt-gold" />
          <h2 className="mt-5 font-serif text-2xl text-white">Email</h2>
          <p className="mt-2 text-egypt-papyrus/60">{CONTACT_EMAIL}</p>
        </a>
        <div className="glass rounded-3xl border border-white/10 p-8">
          <MapPin className="text-egypt-gold" />
          <h2 className="mt-5 font-serif text-2xl text-white">Location</h2>
          <p className="mt-2 text-egypt-papyrus/60">Cairo, Egypt</p>
        </div>
      </div>

      <div className="mt-10 rounded-2xl border border-egypt-gold/20 bg-egypt-gold/5 p-6 text-sm leading-relaxed text-egypt-papyrus/70">
        Do not send passport copies, card information, bank credentials, or payment through a
        public form. Bank-transfer instructions are shared privately only after the quotation is accepted.
      </div>
    </main>
  </div>
);

export default Contact;
