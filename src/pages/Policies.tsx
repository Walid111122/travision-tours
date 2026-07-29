import React from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import { CONTACT_EMAIL } from '../config/site';

const Policies = () => (
  <div className="min-h-screen bg-egypt-night px-6 pb-24 pt-40 text-egypt-papyrus">
    <SEO
      title="Privacy, Booking & Payment Policies"
      description="How Travision Tours handles inquiries, personal information, quotations, confirmations, cancellations, and wire-transfer payments."
      canonical="/policies"
    />

    <article className="mx-auto max-w-4xl">
      <p className="text-label mb-4">Before You Request a Tour</p>
      <h1 className="font-serif text-4xl uppercase text-white md:text-6xl">
        Privacy, Booking <span className="italic text-egypt-gold">& Payment</span>
      </h1>
      <p className="mt-6 max-w-3xl font-light leading-relaxed text-egypt-papyrus/70">
        These policies explain how website inquiries work. Your final written quotation may contain
        additional itinerary-specific terms that you should review before confirming.
      </p>

      <div className="mt-14 space-y-8">
        <section className="glass rounded-3xl border border-white/10 p-7">
          <h2 className="font-serif text-2xl text-egypt-gold">Inquiry and confirmation</h2>
          <p className="mt-3 text-sm font-light leading-relaxed text-egypt-papyrus/70">
            Sending a form does not create a reservation. We first review your requested dates,
            group size, itinerary, and supplier availability. A booking is confirmed only after you
            accept the written quotation, complete the agreed payment, and receive written
            confirmation from Travision Tours.
          </p>
        </section>

        <section className="glass rounded-3xl border border-white/10 p-7">
          <h2 className="font-serif text-2xl text-egypt-gold">Payment by bank wire transfer</h2>
          <p className="mt-3 text-sm font-light leading-relaxed text-egypt-papyrus/70">
            This website does not collect payments or card details. If your request is approved,
            bank-transfer instructions will be provided privately through an agreed communication
            channel. Verify the recipient name and bank details with us before transferring money.
            Do not send funds when payment instructions arrive unexpectedly or from a different
            contact address.
          </p>
        </section>

        <section className="glass rounded-3xl border border-white/10 p-7">
          <h2 className="font-serif text-2xl text-egypt-gold">Changes and cancellations</h2>
          <p className="mt-3 text-sm font-light leading-relaxed text-egypt-papyrus/70">
            Cancellation deadlines, change fees, refund eligibility, and supplier charges depend on
            the services included in your quotation. These terms will be stated in writing before
            payment. Do not transfer funds until you understand and accept those terms.
          </p>
        </section>

        <section className="glass rounded-3xl border border-white/10 p-7">
          <h2 className="font-serif text-2xl text-egypt-gold">Privacy</h2>
          <p className="mt-3 text-sm font-light leading-relaxed text-egypt-papyrus/70">
            We use the information submitted through an inquiry to respond, prepare a quotation,
            coordinate requested travel services, and maintain necessary business records. Do not
            submit passport copies, bank credentials, card details, or other highly sensitive
            information through the public inquiry form.
          </p>
          <p className="mt-3 text-sm font-light leading-relaxed text-egypt-papyrus/70">
            To ask about your submitted information, contact{' '}
            <a className="text-egypt-gold hover:text-white" href={`mailto:${CONTACT_EMAIL}`}>
              {CONTACT_EMAIL}
            </a>.
          </p>
        </section>
      </div>

      <div className="mt-10">
        <Link to="/tours" className="text-sm font-bold uppercase tracking-widest text-egypt-gold hover:text-white">
          Browse tours
        </Link>
      </div>
    </article>
  </div>
);

export default Policies;
