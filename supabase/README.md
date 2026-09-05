# Supabase setup

Run the migration and seed through the Supabase CLI after linking a project:

```sh
supabase db push
supabase db seed
```

Create a Storage bucket named `trip-photos` before enabling gallery uploads. Keep the service-role key server-side only; the frontend should use the publishable anon key with RLS enabled.

## Telegram or WhatsApp notifications

Deploy the notification function:

```sh
supabase functions deploy notify-group
supabase secrets set TELEGRAM_BOT_TOKEN=... TELEGRAM_CHAT_ID=...
```

For an automatic morning countdown, deploy `daily-countdown` and schedule it once daily with Supabase Cron or an external scheduler:

```sh
supabase functions deploy daily-countdown
```

Call `https://<project-ref>.supabase.co/functions/v1/daily-countdown` at the chosen morning time with the project anon key or a protected scheduler secret. The function calculates days remaining, selects the next itinerary plan and places, and sends the Telegram message without requiring a browser tab to be open.

For WhatsApp Business Cloud API, set `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, and `WHATSAPP_RECIPIENT_NUMBER` instead. These are Edge Function secrets, not `VITE_` variables. The app's notification selector supports mock, Telegram, and WhatsApp modes.
