/**
 * The single money formatter for the whole site.
 *
 * Every published figure is an indicative per-person estimate in US dollars.
 * `US$` is used rather than bare `$` so the currency is unambiguous to an
 * international audience — Egypt's local currency is the Egyptian pound and a
 * bare `$` could be misread. Centralizing it means a future currency decision
 * is one edit here instead of a search across every page.
 */
export const formatUsd = (amount: number): string => `US$${amount.toLocaleString('en-US')}`;
