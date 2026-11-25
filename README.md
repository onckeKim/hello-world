# A little surprise ♡

A static, dependency-free surprise reveal site (5 screens: intro → suspense → reveal → keepsake ticket → final message, with replay).

```
index.html          markup + spoiler-free social preview metadata
styles.css          all styling and animation
script.js           screen flow, particles, reveal burst, ticket barcode
favicon.svg / favicon-32.png / apple-touch-icon.png
og-image.jpg        generic, spoiler-free link preview image
```

No build step. Open `index.html` locally or serve the folder (`python3 -m http.server`).

## Deploy

**Netlify:** go to app.netlify.com/drop and drag this folder in. Or import the GitHub repo: leave build command empty, publish directory `.`.

**Vercel:** vercel.com/new → import the repo → Framework preset "Other", no build command, output directory `.` → Deploy.
Or from a terminal: `npx vercel --prod` in this folder.

**Live at https://somethingspecialforyounikita.netlify.app/ — if the address changes:** in `index.html`, change `og:image` to that site's full URL
(e.g. `https://your-site.netlify.app/og-image.jpg`) and redeploy, so WhatsApp shows the preview image.
Send the link to yourself first to check the preview.
