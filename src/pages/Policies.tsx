import React from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import { CONTACT_EMAIL, INQUIRY_POLICY_VERSION, PAYMENT_PARTNER_NAME } from '../config/site';

const Policies = () => (
  <div className="min-h-screen bg-egypt-night px-6 pb-24 pt-40 text-egypt-papyrus">
    <SEO
      title="Privacy, Booking & Payment Policies"
      description="How Travision Tours handles inquiries, personal information, quotations, confirmations, cancellations, and payments made directly to our travel partner."
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
      <p className="mt-3 text-xs uppercase tracking-widest text-egypt-papyrus/45">
        Last updated: {new Date(`${INQUIRY_POLICY_VERSION}T00:00:00Z`).toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          timeZone: 'UTC'
        })}
      </p>

      <div className="mt-14 space-y-8">
        <section className="glass rounded-3xl border border-white/10 p-7">
          <h2 className="font-serif text-2xl text-egypt-gold">Inquiry and confirmation</h2>
          <p className="mt-3 text-sm font-light leading-relaxed text-egypt-papyrus/70">
            Sending a form does not create a reservation. We first review your requested dates,
            group size, itinerary, and supplier availability. A booking is confirmed only after you
            accept the written quotation, complete the agreed payment with our travel partner, and
            receive written confirmation after the partner verifies that payment.
          </p>
        </section>

        <section className="glass rounded-3xl border border-white/10 p-7">
          <h2 className="font-serif text-2xl text-egypt-gold">Payment through our travel partner</h2>
          <p className="mt-3 text-sm font-light leading-relaxed text-egypt-papyrus/70">
            This website does not collect payments or card details. After you accept your written
            quotation, {PAYMENT_PARTNER_NAME}, our travel and payment partner, will provide a secure
            payment link or official wire-transfer instructions. Accepted methods are Visa,
            Mastercard, Apple Pay, and bank wire transfer. All payments are made directly to
            {` ${PAYMENT_PARTNER_NAME}`}; Travision Tours does not receive customer funds.
          </p>
          <p className="mt-3 text-sm font-light leading-relaxed text-egypt-papyrus/70">
            For a wire transfer, verify that the beneficiary account belongs to
            {` ${PAYMENT_PARTNER_NAME}`} before sending money. For a card or Apple Pay payment, use
            only the partner's secure checkout link. Contact us through the details published on
            this website if instructions arrive unexpectedly or from an unverified account.
          </p>
        </section>

        <section className="glass rounded-3xl border border-white/10 p-7">
          <h2 className="font-serif text-2xl text-egypt-gold">Changes and cancellations</h2>
          <p className="mt-3 text-sm font-light leading-relaxed text-egypt-papyrus/70">
            Cancellation deadlines, change fees, refund eligibility, and supplier charges depend on
            the services included in your quotation. These terms will be stated in writing before
            payment. Do not make a payment until you understand and accept those terms.
          </p>
        </section>

        <section className="glass rounded-3xl border border-white/10 p-7">
          <h2 className="font-serif text-2xl text-egypt-gold">Privacy</h2>
          <p className="mt-3 text-sm font-light leading-relaxed text-egypt-papyrus/70">
            We use the information submitted through an inquiry to respond, prepare a quotation,
            coordinate requested travel services, and maintain necessary business records. The
            details needed to quote, arrange, and confirm your trip may be shared with our travel
            partner. Do not submit passport copies, bank credentials, card details, or other highly
            sensitive information through the public inquiry form.
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
