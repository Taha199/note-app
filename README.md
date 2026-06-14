# Hospital Notes

A complete notes web app built with Next.js, TypeScript, and Tailwind CSS. The app opens with a shared password gate and stores notes privately in the browser, so it does not require users to create accounts.

## Features

- Password-only app access
- Local browser note storage
- Protected dashboard route
- Create, list, edit, and delete notes
- Favorites and archive views
- Rich note editor with colors, font, size, bold, italic, underline, and alignment
- Responsive UI with loading and error states
- Vercel-ready deployment

## Local Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Optional: copy the environment example if you want to override the default password:

   ```bash
   cp .env.example .env.local
   ```

3. Optional: set a different app password in `.env.local`:

   ```bash
   APP_PASSWORD=8826017
   ```

4. Run the development server:

   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000).

## Deploy To Vercel

1. Push this project to GitHub.
2. Import the repository in [Vercel](https://vercel.com/).
3. Deploy. No environment variables are required unless you want to override `APP_PASSWORD`.

Vercel will run `npm run build` automatically.

## Scripts

```bash
npm run dev
npm run lint
npm run build
npm run start
```
