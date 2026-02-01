/**
 * Stripe Utility Functions
 * Handles Stripe SDK initialization and common operations
 */

import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not configured');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-04-10',
  typescript: true,
});

/**
 * Price IDs for different plans
 * Configure these from your Stripe dashboard
 */
export const STRIPE_PRICES = {
  BASIC: process.env.STRIPE_PRICE_ID_BASIC || '',
  PRO: process.env.STRIPE_PRICE_ID_PRO || '',
} as const;

/**
 * Plan type mapping
 */
export type PlanType = 'basic' | 'pro' | 'free';

export const getPriceIdForPlan = (plan: PlanType): string => {
  switch (plan) {
    case 'basic':
      return STRIPE_PRICES.BASIC;
    case 'pro':
      return STRIPE_PRICES.PRO;
    default:
      throw new Error(`Invalid plan type: ${plan}`);
  }
};

export const getPlanFromPriceId = (priceId: string): PlanType => {
  if (priceId === STRIPE_PRICES.BASIC) return 'basic';
  if (priceId === STRIPE_PRICES.PRO) return 'pro';
  throw new Error(`Unknown price ID: ${priceId}`);
};
