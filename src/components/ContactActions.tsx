import React from 'react';
import { MessageCircle, Phone } from 'lucide-react';
import { CONTACT_PHONE } from '../config/site';

const ContactActions = () => {
  const whatsappUrl = `https://wa.me/${CONTACT_PHONE.replace(/\D/g, '')}`;

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col gap-3">
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noreferrer"
        aria-label="Contact Travision Tours on WhatsApp"
        className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-white shadow-xl transition-transform hover:scale-105"
      >
        <MessageCircle size={21} />
      </a>
      <a
        href={`tel:${CONTACT_PHONE}`}
        aria-label="Call Travision Tours"
        className="flex h-12 w-12 items-center justify-center rounded-full bg-egypt-gold text-egypt-night shadow-xl transition-transform hover:scale-105 md:hidden"
      >
        <Phone size={20} />
      </a>
    </div>
  );
};

export default ContactActions;
