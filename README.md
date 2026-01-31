# Canvas – UCSD Grades, Assignments & Announcements

View your UCSD Canvas grades, assignments (due/incomplete and completed), and announcements. Use either **Log in with Canvas** (OAuth) or paste a manual access token.

## Quick start

1. **Manual token (no setup)**  
   Run `npm run dev`, open the app, then go to [Canvas → Settings → Approved Integrations](https://canvas.ucsd.edu/profile/settings) and create a new access token. Paste the token (and Canvas URL) in the form.

2. **Log in with Canvas (OAuth)**  
   You need a Canvas Developer Key from your institution (e.g. UCSD admin). Then:

   - Copy `.env.example` to `.env` and set:
     - `CANVAS_CLIENT_ID` – Developer Key client ID  
     - `CANVAS_CLIENT_SECRET` – Developer Key client secret  
     - `CANVAS_BASE_URL` – e.g. `https://canvas.ucsd.edu`  
     - `OAUTH_REDIRECT_URI` – e.g. `http://localhost:5173/oauth/callback`  
   - In the Canvas Developer Key settings, add that exact redirect URI.
   - Run the OAuth server: `npm run server` (in one terminal).
   - Run the app: `npm run dev` (in another terminal).
   - Click **Log in with Canvas** and complete the login; the app will receive the access token.

---

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
