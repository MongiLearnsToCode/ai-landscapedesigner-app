# Tailwind CSS CDN → Local Build Migration Task List

## 🔹 Preparation
- [x] Ensure prerequisites: Node.js ≥16, npm ≥7, Git, modern browser, VS Code with Tailwind IntelliSense
- [x] Create a Git backup branch before migration

## 🔹 Migration Steps
1. **Install Dependencies**
   - [x] Install Tailwind CSS (v3), PostCSS, and Autoprefixer
   - [x] Verify installation with `npm list`

2. **Create Configurations**
   - [x] Add `tailwind.config.js` with correct `content` paths
   - [x] Add `postcss.config.js` with Tailwind + Autoprefixer

3. **Set Up Styles**
   - [x] Create `styles.css` with `@tailwind base; @tailwind components; @tailwind utilities;`
   - [x] Add any custom base styles (background, icons, focus states)

4. **Integrate Styles**
   - [x] Import `./styles.css` in `index.tsx` **before** `App`

5. **Remove CDN**
   - [x] Remove `<script src="https://cdn.tailwindcss.com"></script>` from `index.html`
   - [x] Remove any inline `<style>` tags used for base resets
   - [x] Remove `class="bg-[#F0F1F5]"` or other CDN-specific inline styles

6. **Update Imports**
   - [x] Remove external CDN import maps (if used)
   - [x] Ensure all dependencies resolve from `node_modules`

7. **Update Build Tool**
   - [x] Update `vite.config.ts` to include PostCSS and optimize dependencies

8. **Reset & Restart**
   - [x] Clear Vite cache (`rm -rf node_modules/.vite`)
   - [x] Restart dev server with `npm run dev`

9. **Browser Refresh**
   - [x] Perform hard refresh (Ctrl+Shift+R / Cmd+Shift+R) to clear cached styles

## 🔹 Verification
- [x] Visual inspection: colors, spacing, typography, icons, shadows
- [x] Check hover states (`group-hover`, buttons, overlays)
- [x] Test responsive breakpoints (mobile, tablet, desktop)
- [x] Verify keyboard navigation & focus outlines
- [x] Build for production (`npm run build`) and confirm reduced CSS size (~28KB)
- [x] Run Lighthouse or DevTools audit (performance >90, no CDN requests, no console warnings)

## 🔹 Rollback Options
- [x] Revert migration commit in Git
- [x] Temporarily restore CDN script in `index.html`
- [x] Switch back to backup branch if needed

## 🔹 Post-Migration Checklist
- [x] All dependencies installed and configs created
- [x] `styles.css` working and imported
- [x] CDN removed from project
- [x] Vite/PostCSS integration successful
- [x] Dev + prod builds styling intact
- [x] Git commits pushed and documentation updated

