# Resume x JD Analyzer (Next.js)

ATS keyword match scoring + AI-powered resume optimization using OpenRouter and Supabase.

## Project Structure

```
resume_optimizer-main/
|- pages/
|  |- index.js
|  |- history.js
|  |- resumes.js
|  \- api/
|     |- _callOR.js
|     |- apply-mode.js
|     |- apply-strategy.js
|     |- config.js
|     |- jd-intake.js
|     |- learning-loop.js
|     |- proxy.js
|     |- proxy-raw.js
|     |- proxy-optimized-resume.js
|     \- resume-memory.js
|- public/
|  \- legacy/
|     |- index.html
|     |- history.html
|     |- resumes.html
|     |- index.public.html
|     \- history.public.html
|- .env
|- .gitignore
|- package.json
|- supabase_schema.sql
|- supabase_schema_v2.sql
\- README.md
```

## Environment Variables

Set these in `.env.local` (or Vercel project settings):

- `SUPABASE_URL`
- `SUPABASE_KEY`
- `OPENROUTER_API_KEY`

## Local Development

```bash
npm install
npm run dev
```

App: `http://localhost:3000`

## Production

```bash
npm run build
npm run start
```

## Notes

- This repo now uses Next.js routing (`pages/*`) and Next API routes (`pages/api/*`).
- The existing frontend UI is kept under `public/legacy/*` and the Next pages redirect to those files.
