import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin } from 'lucide-react';

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
          <div className="flex gap-4">
            {[Facebook, Instagram, Twitter].map((Icon, idx) => (
              <a 
                key={idx} 
                href="#" 
                className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-egypt-papyrus/50 hover:border-egypt-gold hover:text-egypt-gold transition-all"
              >
                <Icon size={18} />
              </a>
            ))}
          </div>
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
          </ul>
        </div>

        <div>
          <h4 className="font-serif text-sm uppercase tracking-widest text-egypt-gold mb-8">Contact</h4>
          <ul className="space-y-6">
            <li className="flex items-start gap-3">
              <MapPin size={18} className="text-egypt-gold shrink-0" />
              <span className="text-sm text-egypt-papyrus/60 font-light leading-snug">
                12 Sharia El-Nil, Zamalek,<br />Cairo, Egypt
              </span>
            </li>
            <li className="flex items-center gap-3">
              <Phone size={18} className="text-egypt-gold shrink-0" />
              <span className="text-sm text-egypt-papyrus/60 font-light">+20 123 456 789</span>
            </li>
            <li className="flex items-center gap-3">
              <Mail size={18} className="text-egypt-gold shrink-0" />
              <span className="text-sm text-egypt-papyrus/60 font-light">info@travisiontours.com</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-20 pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
        <p className="text-[10px] uppercase tracking-widest text-egypt-papyrus/30 font-light">
          © 2026 Travision Tours. Built for the preservation of Egyptian Culture.
        </p>
        <div className="flex gap-8">
          <a href="#" className="text-[10px] uppercase tracking-widest text-egypt-papyrus/30 hover:text-egypt-gold transition-colors">Privacy Policy</a>
          <a href="#" className="text-[10px] uppercase tracking-widest text-egypt-papyrus/30 hover:text-egypt-gold transition-colors">Terms of Service</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
