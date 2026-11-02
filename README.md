# Her-Presence

*It's Your Presence*: a small cinematic love letter for Shinu. Next.js 15 · React Three Fiber · Framer Motion · Tailwind 4.

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # static site in out/
```

## Where things live

- `lib/story.ts`: every word, including the final letter. Edit text and pacing here.
- `lib/timeline.ts`: the visual score. Moon position, warmth, sunrise, fireflies and rays as a function of scroll.
- `components/scene/*`: the WebGL sky (stars, moon, clouds, rays, constellation, fireflies, particles).
- `components/*`: chapters, the text reveal, the letter, the sound toggle and the progress line.

Music is generated in the browser (`lib/ambientMusic.ts`) and only plays after the sound button is tapped.
Without WebGL the page falls back to a CSS sky. With reduced motion turned on, animation is minimal.

Every push to `main` deploys to GitHub Pages via `.github/workflows/deploy.yml`.
The song lives at `public/song.mp3`.
