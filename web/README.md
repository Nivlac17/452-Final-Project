# PersonaBuilder Web App

This is the Next.js application for PersonaBuilder. The intended deployment path is `/PersonaBuilder`.

## Local setup

1. Install Node.js (18.18+ recommended) and npm.
2. Copy `.env.example` to `.env.local` and fill in the Supabase project URL, public anon key, and OpenAI API key. Keep `.env.local` private; it is ignored by Git.
3. In Supabase, run `supabase/migrations/0001_initial_schema.sql` in the SQL Editor. This enables pgvector, creates the schema and owner policies, and creates private Storage buckets.
4. In Supabase Auth, enable Google as a provider and register the OAuth redirect URL for local development (`http://localhost:3000/PersonaBuilder/auth/callback`) and the production site.
5. From this directory, run `npm run dev` and open `http://localhost:3000/PersonaBuilder`.

The app uses `text-embedding-3-small` by default and expects 1536-dimensional embeddings. Set `OPENAI_CHAT_MODEL` to a text model enabled for your API account if the default is unavailable. Never put the OpenAI API key in a `NEXT_PUBLIC_` variable.

## Current first-release scope

- Google sign-in via Supabase Auth.
- Private persona profiles and pictures.
- `.txt` upload, chunking, embedding, and vector retrieval.
- Persona Q&A with source labels and saved conversation history.

PDFs, scanned pages, audio, voice imitation, and fine-tuning are out of scope for the first release.
