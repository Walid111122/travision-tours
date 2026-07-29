/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

const Home = lazy(() => import('./pages/Home'));
const Tours = lazy(() => import('./pages/Tours'));
const TourDetails = lazy(() => import('./pages/TourDetails'));
const Blog = lazy(() => import('./pages/Blog'));
const ItineraryBuilder = lazy(() => import('./pages/ItineraryBuilder'));
const Guidelines = lazy(() => import('./pages/Guidelines'));
const Policies = lazy(() => import('./pages/Policies'));
const NotFound = lazy(() => import('./pages/NotFound'));

export default function App() {
  return (
    <HelmetProvider>
      <Router>
        <div className="min-h-screen flex flex-col bg-egypt-night">
          <Navbar />
          <main className="flex-grow">
            <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-egypt-gold">Loading journey…</div>}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/tours" element={<Tours />} />
                <Route path="/tours/:id" element={<TourDetails />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/planner" element={<ItineraryBuilder />} />
                <Route path="/guidelines" element={<Guidelines />} />
                <Route path="/policies" element={<Policies />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </main>
          <Footer />
        </div>
      </Router>
    </HelmetProvider>
  );
}
