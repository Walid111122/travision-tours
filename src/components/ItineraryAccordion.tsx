import React, { useState } from 'react';
import { ChevronDown, Utensils, Bed, Plane, Car, MapPin } from 'lucide-react';
import { ItineraryItem } from '../types';
import ResponsiveImage from './ResponsiveImage';

interface Props {
  item: ItineraryItem;
  defaultOpen?: boolean;
  noAccordion?: boolean;
}

const getActivityIcon = (iconName?: string) => {
  switch (iconName) {
    case 'dinner': return <Utensils size={20} />;
    case 'overnight': return <Bed size={20} />;
    case 'flight': return <Plane size={20} />;
    case 'transfer': return <Car size={20} />;
    case 'tour': return <MapPin size={20} />;
    default: return <MapPin size={20} />;
  }
};

const ItineraryAccordion: React.FC<Props> = ({ item, defaultOpen = false, noAccordion = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  /**
   * Ids are derived from the item's own data rather than from useId().
   *
   * useId() is only stable while the tree shape is unchanged, and the panel
   * here is mounted conditionally. A panel that mounts *after* hydration was
   * reproducibly observed to receive a different id from the one its own button
   * had already rendered with — the button kept aria-controls="_R_a9tm_-panel"
   * while the panel mounted as id="_R_kjr_-panel", an id that existed nowhere in
   * the document. The result was a dangling aria-controls and a region with no
   * accessible name, which is invisible to source-level checks because the
   * markup is correct; only the hydrated DOM shows the split.
   *
   * The day number is stable data and identical in both passes, so the button
   * and its panel always agree. The suite asserts no duplicate ids across every
   * prerendered document, so a collision here would be caught.
   */
  const headerId = `itinerary-day-${item.day}`;
  const panelId = `${headerId}-panel`;

  const words = ['One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen', 'Twenty', 'Twenty-One'];
  const dayStr = item.day <= words.length ? words[item.day - 1] : item.day.toString();
  const headerTitle = item.title || `Day ${dayStr}: ${item.activity}`;

  return (
    <div className="mb-4 bg-egypt-basalt/40 backdrop-blur-sm border border-egypt-gold/20 shadow-xl overflow-hidden group rounded-[20px]">
      {noAccordion ? (
        <div className="w-full p-5 bg-egypt-gold/10 border-b border-egypt-gold/10 flex justify-between items-center">
          <span id={headerId} className="text-[17px] font-serif tracking-wide text-egypt-gold uppercase">{headerTitle}</span>
        </div>
      ) : (
        <button
          type="button"
          id={headerId}
          aria-expanded={isOpen}
          aria-controls={panelId}
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full flex justify-between items-center p-5 transition-all duration-300 ${
            isOpen ? 'bg-egypt-gold/10' : 'hover:bg-egypt-gold/5'
          }`}
        >
          <span className="text-[17px] font-serif tracking-wide text-egypt-gold uppercase">{headerTitle}</span>
          <ChevronDown
            aria-hidden="true"
            size={20}
            className={`text-egypt-gold transform transition-transform duration-500 ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>
      )}

      {(noAccordion || isOpen) && (
        <div
          id={panelId}
          role="region"
          aria-labelledby={headerId}
          className="mt-0 p-0 overflow-hidden border-t border-egypt-gold/10"
        >
          {item.image && (
            <div className="w-full h-[300px] relative overflow-hidden">
              <ResponsiveImage
                src={item.image}
                alt={headerTitle}
                sizes="(min-width: 768px) 800px, 92vw"
                className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-egypt-night via-transparent to-transparent opacity-60"></div>
            </div>
          )}
          
          <div className="p-8 md:p-10">
            <p className="text-egypt-papyrus/80 font-light text-[15px] leading-relaxed mb-10 italic">
              {item.description}
            </p>

            {item.activities && item.activities.length > 0 && (
              <div className="space-y-10 relative pl-12 before:absolute before:inset-y-0 before:left-[21px] before:w-[1px] before:bg-gradient-to-b before:from-egypt-gold/50 before:via-egypt-gold/20 before:to-egypt-gold/50">
                {item.activities.map((act, idx) => (
                  <div key={idx} className="relative group/item">
                    <div className="absolute -left-[56px] top-0 w-11 h-11 rounded-full bg-egypt-night border border-egypt-gold/30 flex items-center justify-center text-egypt-gold z-10 shadow-lg group-hover/item:border-egypt-gold transition-colors duration-300">
                      {getActivityIcon(act.icon)}
                    </div>
                    <div>
                      <h5 className="font-serif text-[18px] text-white tracking-wide mb-2 group-hover/item:text-egypt-gold transition-colors duration-300">{act.title}</h5>
                      <p className="text-egypt-papyrus/60 text-[14px] font-light leading-relaxed">
                        {act.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {(item.meals || item.overnight) && (
              <div className="mt-10 pt-8 border-t border-egypt-gold/10 flex flex-wrap gap-8 text-[14px] text-egypt-papyrus/70">
                {item.meals && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-egypt-gold/5 border border-egypt-gold/10 flex items-center justify-center">
                      <Utensils size={16} className="text-egypt-gold" />
                    </div>
                    <span><strong className="text-egypt-gold font-medium uppercase tracking-wider text-[11px]">Meals:</strong> {item.meals}</span>
                  </div>
                )}
                {item.overnight && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-egypt-gold/5 border border-egypt-gold/10 flex items-center justify-center">
                      <Bed size={16} className="text-egypt-gold" />
                    </div>
                    <span><strong className="text-egypt-gold font-medium uppercase tracking-wider text-[11px]">Overnight:</strong> {item.overnight}</span>
                  </div>
                )}
              </div>
            )}

            {item.historicalSignificance && (
               <div className="mt-10 bg-egypt-gold/5 p-6 border-l-2 border-egypt-gold relative overflow-hidden rounded-r-xl">
                  <div className="absolute top-0 right-0 p-2 opacity-10">
                    <MapPin size={40} className="text-egypt-gold" />
                  </div>
                  <h6 className="font-serif text-[12px] uppercase text-egypt-gold tracking-[0.2em] mb-3">Historical Heritage</h6>
                  <p className="text-[14px] text-egypt-papyrus/80 italic leading-relaxed">{item.historicalSignificance}</p>
               </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ItineraryAccordion;
