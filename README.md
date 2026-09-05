# Himachal Family Trip 2026

A mobile-first shared trip dashboard for the Shimla, Manali, Kasol, and Amritsar family trip.

## Local setup

1. Install Node.js 20 or newer.
2. Run `npm install`.
3. Copy `.env.example` to `.env` and add Supabase values when the backend is configured.
4. Run `npm run dev`.

The initial UI uses typed seed data. Supabase migrations, Storage, Realtime, and notification services are the next integration layer; browser-only storage is intentionally not used for shared records.
