import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin } from 'lucide-react';
import { CONTACT_EMAIL, CONTACT_PHONE, CONTACT_PHONE_DISPLAY } from '../config/site';

const Footer = () => {
  return (
    <footer className="bg-egypt-night border-t border-white/5 pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
        <div className="space-y-6">
          <Link to="/" className="font-serif text-2xl tracking-widest uppercase">
            Travision <span className="text-egypt-gold">Tours</span>
          </Link>
          <p className="text-egypt-papyrus/50 text-sm leading-relaxed max-w-xs font-light">
            Preserving the legacy of Ancient Egypt through immersive, historically-accurate tours that connect you to the soul of the Nile.
          </p>
        </div>

        <div>
          <h4 className="font-serif text-sm uppercase tracking-widest text-egypt-gold mb-8">Destinations</h4>
          <ul className="space-y-4">
            {['Great Pyramids of Giza', 'Valley of the Kings', 'Karnak Temples', 'Abu Simbel', 'Ancient Alexandria'].map((item) => (
              <li key={item}>
                <Link to="/tours" className="text-sm text-egypt-papyrus/60 hover:text-egypt-gold transition-colors font-light italic">
                  {item}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-serif text-sm uppercase tracking-widest text-egypt-gold mb-8">Resources</h4>
          <ul className="space-y-4">
            <li><Link to="/guidelines" className="text-sm text-egypt-papyrus/60 hover:text-egypt-gold transition-colors font-light">Cultural Etiquette & Safety</Link></li>
            <li><Link to="/blog" className="text-sm text-egypt-papyrus/60 hover:text-egypt-gold transition-colors font-light">History Blog</Link></li>
            <li><Link to="/planner" className="text-sm text-egypt-papyrus/60 hover:text-egypt-gold transition-colors font-light">Itinerary Planner</Link></li>
            <li><Link to="/policies" className="text-sm text-egypt-papyrus/60 hover:text-egypt-gold transition-colors font-light">Booking & Payment Policies</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-serif text-sm uppercase tracking-widest text-egypt-gold mb-8">Contact</h4>
          <ul className="space-y-6">
            <li className="flex items-start gap-3">
              <MapPin size={18} className="text-egypt-gold shrink-0" />
              <span className="text-sm text-egypt-papyrus/60 font-light leading-snug">
                Cairo, Egypt
              </span>
            </li>
            <li className="flex items-center gap-3">
              <Phone size={18} className="text-egypt-gold shrink-0" />
              <a href={`tel:${CONTACT_PHONE}`} className="text-sm text-egypt-papyrus/60 font-light hover:text-egypt-gold">{CONTACT_PHONE_DISPLAY}</a>
            </li>
            <li className="flex items-center gap-3">
              <Mail size={18} className="text-egypt-gold shrink-0" />
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-sm text-egypt-papyrus/60 font-light hover:text-egypt-gold">{CONTACT_EMAIL}</a>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-20 pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
        <p className="text-[10px] uppercase tracking-widest text-egypt-papyrus/30 font-light">
          © {new Date().getFullYear()} Travision Tours. Built for the preservation of Egyptian Culture.
        </p>
        <Link to="/policies" className="text-[10px] uppercase tracking-widest text-egypt-papyrus/30 hover:text-egypt-gold transition-colors">
          Privacy & terms
        </Link>
      </div>
    </footer>
  );
};

export default Footer;
