import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, FileText } from 'lucide-react';
import SEO from '../components/SEO';
import { CONTACT_EMAIL, CONTACT_PHONE, CONTACT_PHONE_DISPLAY, EMAIL_PUBLISHED, INQUIRY_POLICY_VERSION, PAYMENT_PARTNER_NAME } from '../config/site';
import { ACCOMMODATION_TIERS, CHILD_POLICY, PARTNER_TERMS, QUOTATION_CONTROLS_NOTE, RESERVATION_FLOW } from '../tourPolicies';

/**
 * Policy content sourced from Egypt Online Tour's published Terms & Conditions
 * and Privacy Policy (see HEAD_COMPANY_SOURCE_MATRIX.md). The partner's terms
 * are presented as *its* standard terms — Travision Tours is the inquiry
 * interface, not the operating or payment-receiving entity.
 *
 * Owner decision: there is no universal child, accommodation, or cancellation
 * policy. General terms below are defaults only — every reservation is
 * governed by the personalized written quotation and policy PDF emailed to
 * the customer before payment (QUOTATION_CONTROLS_NOTE). Nothing the partner
 * does not publish is invented here.
 *
 * Sections render as <details open>: readable by default, collapsible on small
 * screens so mobile visitors can scan headings without losing content.
 */

type PolicySectionProps = {
  title: string;
  children: React.ReactNode;
};

const PolicySection = ({ title, children }: PolicySectionProps) => (
  <details open className="group glass rounded-3xl border border-white/10 p-7">
    <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
      <h2 className="font-serif text-2xl text-egypt-gold">{title}</h2>
      <ChevronRight
        size={18}
        aria-hidden="true"
        className="shrink-0 text-egypt-gold transition-transform group-open:rotate-90"
      />
    </summary>
    <div className="mt-3 space-y-3 text-sm font-light leading-relaxed text-egypt-papyrus/70">
      {children}
    </div>
  </details>
);

/**
 * The owner's required reservation-specific disclaimer, rendered wherever a
 * general/default term could otherwise read as a universal promise.
 */
const QuotationNote = () => (
  <p className="rounded-2xl border border-egypt-gold/30 bg-egypt-gold/5 p-4 text-[13px] leading-relaxed text-egypt-papyrus/80">
    <FileText size={14} aria-hidden="true" className="mr-2 inline-block -mt-0.5 text-egypt-gold" />
    {QUOTATION_CONTROLS_NOTE}
  </p>
);

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
        These policies explain how website inquiries work and the general terms applied by{' '}
        {PAYMENT_PARTNER_NAME}, the travel and payment partner that operates confirmed bookings and
        receives all customer payments. There is no universal child, hotel, or cancellation policy:
        your personalized written quotation and policy PDF — sent to you before any payment —
        contains the conditions that apply to your reservation.
      </p>
      <div className="mt-6 max-w-3xl">
        <QuotationNote />
      </div>
      <p className="mt-3 text-xs uppercase tracking-widest text-egypt-papyrus/60">
        Last updated: {new Date(`${INQUIRY_POLICY_VERSION}T00:00:00Z`).toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          timeZone: 'UTC'
        })}
      </p>

      <div className="mt-14 space-y-8">
        <PolicySection title="Inquiry and confirmation">
          <p>
            Sending a form does not create a reservation. Every submission is an inquiry that we
            review before anything is confirmed:
          </p>
          <ol className="list-decimal space-y-1.5 pl-5">
            {RESERVATION_FLOW.map(step => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <p>
            A booking is confirmed only after you accept the written quotation and policy document,
            complete the agreed payment with our travel partner, and receive written confirmation
            after the partner verifies that payment. If you have not received a reply within{' '}
            {PARTNER_TERMS.responseHours} hours of sending a booking, modification, or cancellation
            request, contact us again through the form or by phone so nothing is missed.
          </p>
        </PolicySection>

        <PolicySection title="Payment through our travel partner">
          <p>
            This website receives inquiries only and does not collect payments or card details.
            Before any payment is due, you receive the full price and the policies that apply to
            your reservation in the written quotation and policy PDF. Accepted payment methods are
            confirmed in that quotation; {PAYMENT_PARTNER_NAME}, our travel and payment partner,
            then provides a secure payment link or official wire-transfer instructions. Methods
            supported by the partner include Visa, Mastercard, Apple Pay, and bank wire transfer.
            All payments are made directly to{` ${PAYMENT_PARTNER_NAME}`}; Travision Tours does not
            receive customer funds.
          </p>
          <p>
            {PAYMENT_PARTNER_NAME}&apos;s standard terms require a deposit of{' '}
            {PARTNER_TERMS.depositPercent}% of the total tour cost at the time of booking, with the
            balance due {PARTNER_TERMS.balanceDueDaysBeforeDeparture} days before departure. These
            are the partner&apos;s general terms — the deposit amount, balance, and deadlines in
            your written quotation are the ones that apply to your reservation.
          </p>
          <p>
            For a wire transfer, verify that the beneficiary account belongs to
            {` ${PAYMENT_PARTNER_NAME}`} before sending money. For a card or Apple Pay payment, use
            only the partner&apos;s secure checkout link. Contact us through the details published on
            this website if instructions arrive unexpectedly or from an unverified account.
          </p>
          <QuotationNote />
        </PolicySection>

        <PolicySection title="Standard cancellation schedule">
          <p>
            {PAYMENT_PARTNER_NAME} publishes the following as its <em>standard</em> refund schedule.
            Cancellation and refund conditions vary with travel dates, hotels, room types,
            suppliers, seasons, special events, and time remaining before departure — the written
            reservation-specific policy supplied with your quotation before payment controls your
            particular booking, so review it before paying.
          </p>
          <ul className="space-y-2">
            {PARTNER_TERMS.cancellationTiers.map(tier => (
              <li key={tier.daysBeforeDeparture} className="flex gap-3">
                <span className="min-w-40 font-normal text-egypt-papyrus/90">
                  {tier.daysBeforeDeparture} before departure:
                </span>
                <span>{tier.refund}</span>
              </li>
            ))}
          </ul>
          <p>
            Under the partner&apos;s standard terms, travellers who do not show up are charged the
            full amount, and after a trip has started no refund is given for unused services, early
            departure, late arrival, or missed days. For special events and peak periods, hotels and
            Nile cruises may make deposits non-refundable. Cancellation terms for groups of more
            than ten people are handled case by case. Your quotation&apos;s policy PDF states the
            amendment, no-show, and unused-service rules that apply to your reservation.
          </p>
          <QuotationNote />
        </PolicySection>

        <PolicySection title="Changes to your booking">
          <p>
            Itinerary changes requested before booking are handled free of charge. Under{' '}
            {PAYMENT_PARTNER_NAME}&apos;s standard terms, changes made after the deposit is paid
            carry a fee of US${PARTNER_TERMS.alterationFeeUsd} per request, plus any charges imposed
            by third parties such as airlines, cruise operators, or hotels — unless your quotation
            states different amendment conditions, in which case those apply.
          </p>
          <p>
            {PAYMENT_PARTNER_NAME} may substitute hotels, flights, trains, or cruise vessels of a
            comparable standard and may adjust itineraries when operations require it. If the
            partner cancels a tour before it begins, payments made for that tour are refunded in
            full.
          </p>
        </PolicySection>

        <PolicySection title="Children and families">
          <p>
            The partner&apos;s booking forms define travellers as {CHILD_POLICY.adultBand.label}{' '}
            aged {CHILD_POLICY.adultBand.minAge}+ and {CHILD_POLICY.childBand.label} aged{' '}
            {CHILD_POLICY.childBand.minAge}–{CHILD_POLICY.childBand.maxAge}. {CHILD_POLICY.note}
          </p>
          <p>
            {CHILD_POLICY.pricingNote} There is no universal child discount or occupancy rule —
            applicable child prices and the hotel&apos;s child policy depend on children&apos;s
            ages, the selected hotel, room type, and occupancy, and are itemized in your quotation.
            You can request the following when you inquire:
          </p>
          <ul className="list-disc space-y-1 pl-5">
            {CHILD_POLICY.requestable.map(item => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <QuotationNote />
        </PolicySection>

        <PolicySection title="Accommodation">
          <p>
            Multi-day packages are offered in {ACCOMMODATION_TIERS.length} tiers —{' '}
            {ACCOMMODATION_TIERS.join(', ')} — which provide the same experiences at different
            accommodation levels. Named hotels and cruise vessels are not guaranteed in advance;
            your written quotation states the selected hotels or cruise, room type, occupancy, and
            meal basis for your reservation, and a comparable property may be substituted where
            operations require it.
          </p>
          <p>
            Hotel check-in is typically after 2:00 PM and check-out before 12:00 noon; early
            check-in or late check-out can incur a half-day or full-day charge. Single-occupancy
            supplements, room-sharing rules, and child accommodation conditions vary by property
            and are confirmed per reservation in the written quotation.
          </p>
          <QuotationNote />
        </PolicySection>

        <PolicySection title="Travel documents, visas, and insurance">
          <p>
            A valid passport and any required visas or permits are your responsibility. Our team or
            the partner&apos;s travel advisor can assist with documentation questions on request,
            but neither Travision Tours nor {PAYMENT_PARTNER_NAME} is responsible for entry documents
            that cannot be obtained. Many nationalities can obtain an Egypt visa on arrival or an
            e-visa in advance — check the latest official requirements for your nationality before
            booking.
          </p>
          <p>
            Comprehensive travel insurance covering medical care, cancellation, luggage, and planned
            activities is strongly recommended. It is not included unless your quotation lists it.
          </p>
        </PolicySection>

        <PolicySection title="Complaints and claims">
          <p>
            If something is wrong during your trip, tell your travel advisor or the partner&apos;s
            customer-care team immediately so it can be fixed while you travel. Under{' '}
            {PAYMENT_PARTNER_NAME}&apos;s standard terms, a formal claim for compensation must be
            made in writing within {PARTNER_TERMS.complaintWindowDays} days of the end of the tour,
            with receipts and supporting evidence attached; later claims cannot be accepted.
          </p>
        </PolicySection>

        <PolicySection title="Liability and third-party suppliers">
          <p>
            Confirmed services are delivered by {PAYMENT_PARTNER_NAME} together with hotels,
            airlines, cruise operators, transport providers, and guides. The partner is not liable
            for errors in third-party information, and neither company is liable for loss, injury,
            delay, or changes caused by events outside reasonable control — including weather,
            government action, strikes, epidemics, or security incidents (force majeure).
          </p>
          <p>
            Activities such as boarding boats, climbing, and entering tombs or caves are undertaken
            at your own risk; staff will advise you, but you are responsible for your own
            participation decisions and for keeping your valuables secure. The partner may decline
            service to travellers whose behaviour is illegal or abusive toward staff or suppliers.
          </p>
        </PolicySection>

        <PolicySection title="Special requests, accessibility, and health">
          <p>
            Tell us about dietary requirements, mobility considerations, medical conditions, or
            other special requests when you inquire — the partner&apos;s custom-tour process is built
            around them, and feasible arrangements are written into your quotation. Some sites
            involve stairs, uneven ground, heat, or enclosed spaces; where a tour page lists
            physical notes they apply to that itinerary.
          </p>
        </PolicySection>

        <PolicySection title="Privacy">
          <p>
            We use the information submitted through an inquiry to respond, prepare a quotation,
            coordinate requested travel services, and maintain necessary business records. The
            details needed to quote, arrange, and confirm your trip are shared with{' '}
            {PAYMENT_PARTNER_NAME} and with the suppliers needed to deliver your booking (such as
            hotels, airlines, and guides), and as required by law. Do not submit passport copies,
            bank credentials, card details, or other highly sensitive information through the public
            inquiry form.
          </p>
          <p>
            You may ask to access, correct, or delete the personal information connected to your
            inquiry. To ask about your submitted information,{' '}
            {EMAIL_PUBLISHED ? (
              <>
                contact{' '}
                {/* Underlined so the link is distinguishable without relying on colour alone. */}
                <a className="text-egypt-gold underline underline-offset-2 hover:text-white" href={`mailto:${CONTACT_EMAIL}`}>
                  {CONTACT_EMAIL}
                </a>
              </>
            ) : (
              <>
                contact us through the inquiry form or by phone at{' '}
                <a className="text-egypt-gold underline underline-offset-2 hover:text-white" href={`tel:${CONTACT_PHONE}`}>
                  {CONTACT_PHONE_DISPLAY}
                </a>
              </>
            )}
            . For data held by {PAYMENT_PARTNER_NAME} after a booking is confirmed, the
            partner&apos;s privacy contact is published on its website.
          </p>
        </PolicySection>
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
