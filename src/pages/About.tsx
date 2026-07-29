import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, FileCheck2, Landmark, Users } from 'lucide-react';
import SEO from '../components/SEO';

const About = () => (
  <div className="min-h-screen bg-egypt-night px-6 pb-24 pt-40 text-egypt-papyrus">
    <SEO
      title="About Travision Tours"
      description="Learn how Travision Tours plans private and tailor-made Egypt itineraries through a clear inquiry, quotation, and confirmation process."
      canonical="/about"
    />
    <main className="mx-auto max-w-6xl">
      <p className="text-label mb-4">About Travision Tours</p>
      <h1 className="max-w-4xl font-serif text-4xl uppercase text-white md:text-7xl">
        Egypt itineraries built around <span className="italic text-egypt-gold">your journey</span>
      </h1>
      <p className="mt-8 max-w-3xl text-lg font-light leading-relaxed text-egypt-papyrus/70">
        Travision Tours helps travelers explore Egypt through private and customizable itinerary
        requests. We begin with your dates, interests, group size, comfort preferences, and budget,
        then prepare a written proposal for review.
      </p>

      <section className="mt-20 grid gap-6 md:grid-cols-2">
        {[
          [Compass, 'Tailor-made planning', 'Routes can be adjusted around your preferred pace, destinations, and priorities.'],
          [Landmark, 'Egypt-focused itineraries', 'Browse ideas covering Cairo, Luxor, Aswan, Abu Simbel, Alexandria, and the Red Sea.'],
          [FileCheck2, 'Written quotation first', 'Services, prices, payment terms, and cancellation conditions are presented before confirmation.'],
          [Users, 'Human communication', 'Questions and requested changes are handled through email, telephone, or WhatsApp.']
        ].map(([Icon, title, text]) => {
          const FeatureIcon = Icon as typeof Compass;
          return (
            <div key={String(title)} className="glass rounded-3xl border border-white/10 p-8">
              <FeatureIcon className="text-egypt-gold" size={28} />
              <h2 className="mt-5 font-serif text-2xl text-white">{String(title)}</h2>
              <p className="mt-3 text-sm font-light leading-relaxed text-egypt-papyrus/65">{String(text)}</p>
            </div>
          );
        })}
      </section>

      <section className="mt-20 rounded-[40px] bg-egypt-gold p-10 text-egypt-night md:p-16">
        <h2 className="font-serif text-3xl uppercase md:text-5xl">How an inquiry works</h2>
        <ol className="mt-8 grid gap-6 md:grid-cols-4">
          {[
            'Send your travel preferences.',
            'Receive availability and a written quotation.',
            'Review the services, policies, and wire-transfer terms.',
            'Receive written confirmation after payment verification.'
          ].map((step, index) => (
            <li key={step}>
              <span className="font-serif text-3xl">{String(index + 1).padStart(2, '0')}</span>
              <p className="mt-2 text-sm leading-relaxed">{step}</p>
            </li>
          ))}
        </ol>
      </section>

      <div className="mt-12 flex flex-wrap gap-4">
        <Link to="/tours" className="rounded-full bg-egypt-gold px-8 py-4 text-xs font-black uppercase tracking-widest text-egypt-night">Browse tours</Link>
        <Link to="/contact" className="rounded-full border border-egypt-gold/40 px-8 py-4 text-xs font-black uppercase tracking-widest text-egypt-gold">Contact us</Link>
      </div>
    </main>
  </div>
);

export default About;
