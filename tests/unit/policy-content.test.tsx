import React from 'react';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { HelmetProvider } from 'react-helmet-async';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Policies from '../../src/pages/Policies';
import TourDetails, { tourStructuredData } from '../../src/pages/TourDetails';
import { SAMPLE_TOURS } from '../../src/constants';
import { DAY_TOURS } from '../../src/dayTours';
import { validateBooking } from '../../worker/booking';
import { PAYMENT_PARTNER_NAME, EMAIL_PUBLISHED } from '../../src/config/business';
import { CONTACT_EMAIL } from '../../src/config/site';
import {
  ACCOMMODATION_PREFERENCES,
  ACCOMMODATION_TIERS,
  CHILD_POLICY,
  PACKAGE_ACCOMMODATION,
  PARTNER_TERMS,
  TOUR_LOGISTICS
} from '../../src/tourPolicies';

/**
 * Policy-content tests for the head-company mapping work.
 *
 * Every fact the site states about deposits, cancellations, child rules,
 * accommodation, or tour logistics must trace to an Egypt Online Tour source
 * page — see HEAD_COMPANY_SOURCE_MATRIX.md. These tests assert the rendered
 * wording, the structured data, and that nothing unsourced (ratings, prices in
 * JSON-LD, confirmed-booking language) leaks into the output.
 */

const ALL_TOURS = [...SAMPLE_TOURS, ...DAY_TOURS];

function renderPolicies(): string {
  return renderToStaticMarkup(
    <HelmetProvider>
      <MemoryRouter initialEntries={['/policies']}>
        <Policies />
      </MemoryRouter>
    </HelmetProvider>
  );
}

function renderTour(tourId: string): { html: string } {
  const html = renderToStaticMarkup(
    <HelmetProvider>
      <MemoryRouter initialEntries={[`/tours/${tourId}`]}>
        <Routes>
          <Route path="/tours/:id" element={<TourDetails />} />
        </Routes>
      </MemoryRouter>
    </HelmetProvider>
  );
  return { html };
}

const baseBooking = {
  tourId: 'cairo-day-tour',
  name: 'Test',
  email: 'test@example.com',
  phone: '+201028838866',
  preferredDate: '2027-06-10',
  adults: 1,
  children: 0,
  travelers: 1,
  partnerPaymentAcknowledged: true
};

const FIXED_NOW = new Date('2026-09-16T00:00:00Z');

describe('partner standard terms', () => {
  it('records the sourced deposit and balance rules', () => {
    expect(PARTNER_TERMS.depositPercent).toBe(40);
    expect(PARTNER_TERMS.balanceDueDaysBeforeDeparture).toBe(30);
    expect(PARTNER_TERMS.alterationFeeUsd).toBe(25);
    expect(PARTNER_TERMS.complaintWindowDays).toBe(15);
    expect(PARTNER_TERMS.responseHours).toBe(48);
  });

  it('keeps the sourced cancellation tiers in order', () => {
    expect(PARTNER_TERMS.cancellationTiers.map(t => t.refund)).toEqual([
      '100% refund of payments made',
      '70% refund of payments made',
      '50% refund of payments made',
      'No refund'
    ]);
  });
});

describe('child policy model', () => {
  it('uses the partner form age bands: adults 12+, children 1–11', () => {
    expect(CHILD_POLICY.adultBand.minAge).toBe(12);
    expect(CHILD_POLICY.childBand.minAge).toBe(1);
    expect(CHILD_POLICY.childBand.maxAge).toBe(11);
  });

  it('does not state a discount percentage — none is published by the head company', () => {
    expect(CHILD_POLICY.pricingNote).not.toMatch(/\d+%|percent|discount of/i);
    expect(CHILD_POLICY.pricingNote).toContain('written quotation');
    expect('discountPercent' in CHILD_POLICY).toBe(false);
  });
});

describe('accommodation model', () => {
  it('offers the partner’s five preference options on the inquiry form', () => {
    expect(ACCOMMODATION_PREFERENCES.map(o => o.value)).toEqual([
      'budget-3-star',
      'standard-4-star',
      'luxury-5-star',
      'mixed',
      'flexible'
    ]);
  });

  it('keeps the form values in sync with the worker whitelist', () => {
    for (const option of ACCOMMODATION_PREFERENCES) {
      expect(
        () => validateBooking({ ...baseBooking, accommodationPreference: option.value }, FIXED_NOW),
        `worker should accept "${option.value}"`
      ).not.toThrow();
    }
  });

  it('lists the four package tiers without promising named properties', () => {
    expect(ACCOMMODATION_TIERS).toEqual(['Standard', 'Premium', 'Luxury', 'High End']);
    for (const entry of Object.values(PACKAGE_ACCOMMODATION)) {
      // Category wording only: no hotel brand names may appear in our copy.
      expect(entry.summary).not.toMatch(/Hilton|Marriott|Movenpick|Steigenberger|Sonesta|Oberoi|Four Seasons|Ritz/i);
    }
  });

  it('only carries accommodation detail for real published packages', () => {
    const published = new Set(ALL_TOURS.map(t => t.id));
    for (const id of Object.keys(PACKAGE_ACCOMMODATION)) {
      expect(published.has(id), `${id} has accommodation data but is not a published tour`).toBe(true);
    }
  });
});

describe('tour logistics data', () => {
  it('is keyed only by published tours and cites an egyptonlinetour.com source', () => {
    const published = new Set(ALL_TOURS.map(t => t.id));
    for (const [id, entry] of Object.entries(TOUR_LOGISTICS)) {
      expect(published.has(id), `${id} has logistics data but is not a published tour`).toBe(true);
      expect(entry.sourceUrl).toMatch(/^https:\/\/egyptonlinetour\.com\/tours\//);
      expect(['exact', 'partial', 'category']).toContain(entry.match);
    }
  });

  it('carries sourced inclusions on every exact match', () => {
    for (const [id, entry] of Object.entries(TOUR_LOGISTICS)) {
      if (entry.match === 'exact') {
        expect(entry.inclusions?.length ?? 0, `${id} is an exact match but lists no inclusions`).toBeGreaterThan(0);
      }
    }
  });
});

describe('dead review fields', () => {
  it('publishes no rating, review count, or review list on any tour', () => {
    for (const tour of ALL_TOURS) {
      expect(tour).not.toHaveProperty('rating');
      expect(tour).not.toHaveProperty('reviewsCount');
      expect(tour).not.toHaveProperty('reviewsList');
    }
  });
});

describe('policies page', () => {
  const html = renderPolicies();

  it('states the payment recipient and all four accepted methods', () => {
    expect(html).toContain(PAYMENT_PARTNER_NAME);
    expect(html).toContain('does not collect payments or card details');
    expect(html).toMatch(/Visa/);
    expect(html).toMatch(/Mastercard/);
    expect(html).toMatch(/Apple Pay/);
    expect(html).toMatch(/wire transfer/i);
    expect(html).toContain('does not receive customer funds');
  });

  it('states the deposit, balance, and cancellation schedule as partner terms', () => {
    expect(html).toContain('40% of the total tour cost');
    expect(html).toContain('30 days before departure');
    expect(html).toContain('100% refund');
    expect(html).toContain('70% refund');
    expect(html).toContain('50% refund');
    expect(html).toContain('No refund');
  });

  it('keeps inquiry-not-booking language', () => {
    expect(html).toContain('does not create a reservation');
    expect(html).toContain('written quotation');
    expect(html).not.toMatch(/instant confirmation|book now|booking confirmed instantly/i);
  });

  it('renders collapsible sections that are open by default', () => {
    expect(html).toContain('<details');
    expect(html).toContain('<summary');
    expect(html).toMatch(/<details[^>]*open/);
  });

  it('does not publish an email address while it is unconfigured', () => {
    if (!EMAIL_PUBLISHED) {
      expect(html).not.toContain(CONTACT_EMAIL);
      expect(html).not.toContain('mailto:');
    }
  });
});

describe('tour page policy and logistics rendering', () => {
  it('renders sourced pickup and availability for an exact-match day tour', () => {
    const { html } = renderTour('abu-simbel-day-tour');
    expect(html).toContain('Pickup');
    expect(html).toContain('Aswan hotel');
    expect(html).toContain('Daily');
    expect(html).toContain('Entry tickets');
  });

  it('renders the quotation fallback for a tour with no source match', () => {
    const { html } = renderTour('hurghada-day-tour');
    expect(html).toContain('Pickup &amp; Logistics');
    expect(html).toContain('confirmed in your written quotation');
  });

  it('renders sourced accommodation for a matched package', () => {
    const { html } = renderTour('6-days-cairo-luxor-aswan');
    expect(html).toContain('Five-star');
    expect(html).toContain('Nile dinner cruise');
    expect(html).toContain('2 nights');
  });

  it('distinguishes general policy from tour-specific conditions', () => {
    const { html } = renderTour('hurghada-day-tour');
    expect(html).toContain('written quotation');
    const policies = renderPolicies();
    expect(policies).toContain('standard terms applied by');
  });

  it('emits no prices, ratings, reviews, or offers in JSON-LD', () => {
    for (const tour of ALL_TOURS) {
      const ldJson = JSON.stringify(tourStructuredData(tour, 'summary', [tour.image]));
      expect(ldJson, `${tour.id} JSON-LD must be a TouristTrip`).toContain('TouristTrip');
      expect(ldJson, `${tour.id} JSON-LD must not claim prices, ratings, reviews, or offers`).not.toMatch(
        /aggregateRating|reviewCount|"rating"|"reviews"|"offers"|"price"/i
      );
    }
  });

  it('keeps the payment acknowledgement as an inquiry, not a confirmed booking', () => {
    const { html } = renderTour('cairo-day-tour');
    expect(html).toContain('booking request, not a confirmed reservation');
    expect(html).toContain(`payment will be made directly to ${PAYMENT_PARTNER_NAME}`);
    expect(html).toContain('/policies');
  });
});
