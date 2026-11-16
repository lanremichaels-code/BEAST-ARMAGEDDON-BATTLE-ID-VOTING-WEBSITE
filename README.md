# AOW3 Battle ID & Voting Website

A small Next.js + Supabase website for players to submit an AOW3 Battle ID and screenshot, while the admin selects submissions and publishes community polls.

## Features

- Public Battle ID + screenshot submission (no player account required).
- Admin-only dashboard protected by a server-side password session.
- Admin selects at least two submissions and creates a poll.
- Public visitors can vote and see live vote totals when the page refreshes.
- Admin can close polls.
- Images are limited to JPG, PNG or WebP and 5MB each.

## 1. Requirements

- Node.js 20.9 or newer
- A Supabase project (the free tier is suitable for a small test, subject to Supabase limits)
- VS Code

## 2. Set up Supabase

1. Open your Supabase project.
2. Go to **SQL Editor**.
3. Open `supabase/schema.sql` from this project, copy all its contents into a new SQL query, and run it.
4. Go to **Project Settings → API**.
5. Copy the Project URL, anon/public key, and service_role key.
6. Keep the service_role key private. Never put it in a `NEXT_PUBLIC_` variable or share it.

The SQL creates separate tables prefixed with `battle_` and a public `battle-images` storage bucket. It does not modify your existing tournament tables.

## 3. Configure the website

1. Open this folder in VS Code.
2. Duplicate `.env.example` and rename the copy to `.env.local`.
3. Fill in:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ADMIN_PASSWORD`
   - `ADMIN_SESSION_SECRET`
4. Choose a strong admin password. Make the session secret a long random string (32+ characters).

## 4. Run locally

Open the VS Code terminal in this folder and run:

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

- Public submission and voting page: `http://localhost:3000`
- Admin dashboard: `http://localhost:3000/admin`

## 5. How to use it

1. Players submit their Battle ID and screenshot on the homepage.
2. Open `/admin` and sign in using `ADMIN_PASSWORD`.
3. Select at least two submitted battles.
4. Give the poll a title and optional description, then publish it.
5. Players vote on the homepage.
6. Close a poll from the admin dashboard when voting is over.

## 6. Deploying

You can deploy this Next.js project to Vercel or another Node-compatible host.

Add the same environment variables from `.env.local` to the hosting provider's environment-variable settings, then deploy. Do not upload `.env.local` to GitHub.

## Important notes

- This starter uses a browser-generated voter key and a unique database constraint to limit one vote per browser identity per poll. It is not strong identity verification: a person can potentially vote again using another browser/device or by clearing site data. For strict one-person-one-vote, add verified sign-in or another identity check.
- Public submissions are accepted without manual approval. Only the admin can create polls, and only selected submissions appear in public polls.
- The admin password is checked on the server and the session cookie is HTTP-only. Use a long unique password and keep the environment variables private.
- Add rate limiting/CAPTCHA before sharing the site widely to reduce spam.
- Poll results are visible to visitors while a poll is active.
