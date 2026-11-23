# PersonaBuilder web app

The deployed frontend lives in the `vite-calvinmerrell.com` folder of the `Nivlac17/calvinmerrell.com` website repository because the site is hosted as a static GitHub Pages app. It is available at `/PersonaBuilder/`. This `web/` folder contains the earlier Next.js implementation and the Supabase schema and Edge Functions used by the static app.

## Supabase setup

1. Create a Supabase project.
2. Apply `supabase/migrations/0001_initial_schema.sql` in the Supabase SQL Editor. This enables pgvector, creates the persona/document/conversation tables, owner-only row-level security policies, and private Storage buckets.
3. In **Authentication → Providers**, enable Email. Supabase Auth manages email/password accounts and stores password hashes; PersonaBuilder does not write passwords into application tables. Google sign-in can be configured later if needed.
4. In **Authentication → URL Configuration**, set the site URL to `https://calvinmerrell.com/PersonaBuilder/` and add these allowed redirect URLs:
   - `https://calvinmerrell.com/PersonaBuilder/`
   - `http://localhost:5173/PersonaBuilder/`
5. Google OAuth is optional for now. If you enable it later, add your domain and `http://localhost:5173` as authorized JavaScript origins, then add the Supabase callback URL shown in the Google provider settings as an authorized redirect URI.
6. From this `web/` folder, use the Supabase CLI to link the project and deploy both functions:

   ```sh
   supabase login
   supabase link --project-ref YOUR_PROJECT_REF
   supabase functions deploy process-document
   supabase functions deploy ask-persona
   ```

7. Add `OPENAI_API_KEY` under **Project Settings → Edge Functions → Secrets** (or the Supabase secrets settings shown for your project). The Edge Functions use this server-side key for embeddings and answer generation. Never add it to the static website, GitHub Pages build variables, or any `VITE_`/`NEXT_PUBLIC_` browser variable.
8. In the website repository’s **Settings → Secrets and variables → Actions**, add `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` so GitHub Actions can build the public frontend. The publishable key is intended for browser use and is protected by the database’s row-level security policies.

For local use of the deployed Vite app, the website repository’s ignored `.env.local` file accepts `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`; then run `npm run dev` in `vite-calvinmerrell.com` and open `http://localhost:5173/PersonaBuilder/`.

## Server-side AI behavior

- `supabase/functions/process-document` reads an authenticated user’s private text file, splits it into overlapping chunks, requests 1536-dimensional embeddings from `text-embedding-3-small`, and saves those chunks under the user’s account.
- `supabase/functions/ask-persona` retrieves the closest passages, asks the configured chat model for a source-grounded answer, and returns citation data.
- Defaults are `text-embedding-3-small` and `gpt-4.1-mini`. Optional Edge Function secrets `OPENAI_EMBEDDING_MODEL` and `OPENAI_CHAT_MODEL` can override the defaults.

The UI supports `.txt` files up to 10 MB; the indexing function limits extracted text to 500,000 characters per file. PDFs, OCR, audio, voice cloning, and model fine-tuning are outside the first release.
