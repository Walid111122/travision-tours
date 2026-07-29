import React from 'react';
import { Shield, Lightbulb, Users, Clock, Globe, CameraOff } from 'lucide-react';
import SEO from '../components/SEO';

const Guidelines = () => {
  const sections = [
    {
      title: 'Sacred Etiquette',
      icon: Users,
      tips: [
        'Dress modestly when visiting active religious sites and ancient temples.',
        'Always ask for permission before photographing local people.',
        'Respect the silence of tombs—they are resting places, not just monuments.'
      ]
    },
    {
      title: 'Safety & Guard',
      icon: Shield,
      tips: [
        'Stay hydrated; the Egyptian sun is potent even in winter.',
        'Use only verified Travision Tours transportation for inter-city travel.',
        'Keep your digital "Legacy Pass" (on the app) accessible at all times.'
      ]
    },
    {
      title: 'Local Customs',
      icon: Globe,
      tips: [
        'Tipping (Baksheesh) is a standard part of the social fabric—carry small change.',
        'Friday is a spiritual day; some local shops may have varied hours.',
        'Learning basic Arabic greetings like "As-salamu alaykum" goes a long way.'
      ]
    }
  ];

  return (
    <div className="pt-32 pb-20 px-6 max-w-5xl mx-auto">
      <SEO title="Egypt Travel Safety & Customs" description="Essential guidelines for a respectful and safe journey through Egypt." canonical="/guidelines" image="/hero.jpg" />
      
      <header className="mb-20 text-center">
        <span className="text-label mb-4 block">Guardian Protocols</span>
        <h1 className="text-5xl md:text-6xl font-serif uppercase leading-tight">Safety & <span className="text-egypt-gold italic">Soul</span></h1>
        <p className="text-egypt-papyrus/50 mt-6 max-w-xl mx-auto font-light italic text-lg">
          Travel with honor and awareness. Our guidelines ensure a respectful connection with both the ancient past and the living present.
        </p>
      </header>

      <div className="space-y-12">
        {sections.map((section, idx) => (
          <div key={idx} className="glass p-10 md:p-16 rounded-[60px] border border-white/5 relative overflow-hidden group">
             <div className="absolute -top-10 -right-10 w-40 h-40 bg-egypt-gold/5 rounded-full blur-3xl group-hover:bg-egypt-gold/10 transition-colors" />
             
             <div className="flex flex-col md:flex-row gap-12 items-start shrink-0">
                <div className="w-16 h-16 rounded-full bg-egypt-gold/10 flex items-center justify-center text-egypt-gold">
                   <section.icon size={32} />
                </div>
                <div className="space-y-8 flex-grow">
                   <h2 className="text-3xl font-serif uppercase text-egypt-gold">{section.title}</h2>
                   <ul className="space-y-6">
                      {section.tips.map((tip, i) => (
                        <li key={i} className="flex gap-4 text-egypt-papyrus/70 font-light leading-relaxed">
                           <div className="w-1.5 h-1.5 rounded-full bg-egypt-gold/40 mt-2 shrink-0" />
                           {tip}
                        </li>
                      ))}
                   </ul>
                </div>
             </div>
          </div>
        ))}

        <div className="bg-egypt-gold p-10 md:p-16 rounded-[40px] text-egypt-night text-center">
           <CameraOff size={48} className="mx-auto mb-6 opacity-30" />
           <h3 className="text-2xl font-serif uppercase mb-4">A Note on Photography</h3>
           <p className="text-sm font-medium max-w-xl mx-auto leading-relaxed">
              While we encourage capturing memories, some tombs strictly forbid flash or all photography to preserve ancient pigments. Always observe site-specific signage.
           </p>
        </div>
      </div>
    </div>
  );
};

export default Guidelines;
