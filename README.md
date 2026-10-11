# Hem Kaur — Marketing & Creative Portfolio

A responsive, static portfolio site for showcasing Hem Kaur's short-form video projects and marketing work.

## Files
- `index.html` — page structure
- `styles.css` — responsive styling
- `script.js` — rendering, category filter, video modal and navigation
- `projects.js` — project links and editable profile details

## Run locally
Open `index.html` in a modern browser. No build step is required.

## Current video projects
The portfolio contains eight Instagram Reels and one YouTube Short. Every project links to the original post. YouTube's official thumbnail URL is used for the Short. For Instagram Reels, the page attempts the public Instagram media thumbnail endpoint; if that is unavailable, it falls back to Instagram's own embedded Reel for that exact post rather than a stock or generated image. Instagram may restrict access to thumbnails or embeds depending on privacy, login state, region, and browser settings.

## Personalise before publishing
1. In `projects.js`, replace `hello@example.com` with the preferred public contact email.
2. Replace the generic Instagram and LinkedIn URLs with the profile links.
3. Replace each generic Reel title with the brand or campaign name where it is accurate and approved to share.
4. Add approved role details and verified performance results. Do not publish client-sensitive information without permission.

## Publish
Upload the folder to a static host such as GitHub Pages, Netlify, or Vercel. Keep all four files in the same directory.
