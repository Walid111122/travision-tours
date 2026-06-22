/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Tour {
  id: string;
  title: string;
  description: string;
  price: number;
  duration: string;
  location: string;
  category: 'historical' | 'cultural' | 'adventure' | 'spiritual';
  image: string;
  itinerary: ItineraryItem[];
  rating: number;
  reviewsCount: number;
  featured?: boolean;
  highlights?: string[];
  inclusions?: string[];
  exclusions?: string[];
}

export interface ItineraryActivity {
  title: string;
  description: string;
  icon?: 'dinner' | 'overnight' | 'tour' | 'flight' | 'transfer';
}

export interface ItineraryItem {
  day: number;
  activity?: string;
  description: string;
  historicalSignificance?: string;
  virtualTourUrl?: string;
  title?: string;
  image?: string;
  activities?: ItineraryActivity[];
  meals?: string;
  overnight?: string;
}

export interface Review {
  id: string;
  tourId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
  avatar?: string;
}

export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  date: string;
  image: string;
  tags: string[];
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  preferences: string[];
  savedTours: string[];
  badges: string[];
  points: number;
}
