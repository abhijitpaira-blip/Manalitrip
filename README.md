# Himachal Family Trip 2026

A mobile-first shared trip dashboard for the Shimla, Manali, Kasol, and Amritsar family trip.

## Local setup

1. Install Node.js 20 or newer.
2. Run `npm install`.
3. Copy `.env.example` to `.env` and add Supabase values when the backend is configured.
4. Add `VITE_GEMINI_API_KEY` from Google AI Studio for Gemini chat/testing.
5. Add `VITE_GOOGLE_MAPS_API_KEY` from Google Cloud, enable Maps Embed API, and restrict the key to this website's allowed referrers.
6. Apply `supabase/migrations/202609060001_chat_messages.sql` to enable shared family chat and Realtime updates.
7. Apply `supabase/migrations/202609060002_expense_splits.sql` to enable shared expenses, participants, and live budget updates.
8. Apply `supabase/migrations/202609060003_realtime_photos.sql` to enable live gallery updates.
9. Run `npm run dev`.

The guide cards use place-specific public images and include the history already stored in `src/data/guides.ts`. Authorized Google Maps embeds appear when the browser key is configured; otherwise each guide keeps a direct Google Maps link. The chat uses Supabase when configured, so everyone sees messages across devices. Without Supabase credentials, it remains clearly marked as browser-only preview mode.

When Supabase URL and anon key are configured, the header shows `Live sync` after the Realtime channels connect. Chat messages, expenses, and uploaded gallery photos update across open browsers without a manual refresh.

Telegram is sent automatically for new shared expenses and from the group update action after the `notify-group` Edge Function is deployed with `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID`. For a daily automatic countdown, schedule the `daily-countdown` Edge Function with Supabase Cron.

The AI Assist panel can also generate a Telegram-ready message with Gemini and send it through the same Edge Function. Configure both `VITE_GEMINI_API_KEY` and the Telegram Supabase secrets first.
