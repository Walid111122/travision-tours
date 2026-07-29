import { Link } from 'react-router-dom';
import SEO from '../components/SEO';

export default function NotFound() {
  return (
    <section className="min-h-[75vh] px-6 pt-40 pb-20 flex items-center justify-center text-center">
      <SEO title="Page Not Found" description="The requested Travision Tours page could not be found." noIndex />
      <div className="max-w-xl">
        <p className="text-label mb-4">404 · Lost in the sands</p>
        <h1 className="text-5xl md:text-7xl uppercase mb-6">This path has faded</h1>
        <p className="text-egypt-papyrus/60 mb-10">
          The page may have moved, or the address may be incorrect.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link to="/" className="bg-egypt-gold text-egypt-night px-7 py-4 rounded font-black uppercase tracking-widest text-xs">
            Return home
          </Link>
          <Link to="/tours" className="border border-white/20 px-7 py-4 rounded font-black uppercase tracking-widest text-xs hover:border-egypt-gold">
            Browse tours
          </Link>
        </div>
      </div>
    </section>
  );
}
