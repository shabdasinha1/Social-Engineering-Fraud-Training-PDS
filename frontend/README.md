# Frontend - Cyber Awareness Training

React + Vite + Tailwind CSS frontend for the Social Engineering & Fraud Detection
training simulation. The Express/MongoDB backend is added in a later phase.

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build into dist/
npm run lint
```

## Notes

- Design tokens live in `src/styles/index.css` (`@theme` block). Add a token
  there instead of hardcoding colours in components.
- `@/` is an alias for `src/`.
- Copy `.env.example` to `.env` once the backend exists.

See `../PROJECT_MASTER_PLAN.md` for project status and the next task.
