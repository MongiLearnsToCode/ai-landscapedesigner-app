# AI Landscape Designer - Agent Guidelines

## Build & Test Commands
- `npm run dev` - Start development server (client + API)
- `npm run build` - Build for production (includes sitemap generation)
- `npm run test` - Run single test file: `tsx services/errorUtils.test.ts`
- `npm run db:generate` - Generate Drizzle database migrations
- `npm run db:migrate` - Run database migrations

## Code Style Guidelines

### Imports & Formatting
- Use ES6 imports with absolute paths: `import { Component } from '@/components/Component'`
- Group imports: React/libraries first, then local components, then types
- Use TypeScript with strict mode enabled
- Components use `.tsx` extension, utilities `.ts`

### Component Conventions
- Use functional components with React.FC type annotation
- Export components as named exports: `export const Component: React.FC = () => {}`
- Use PascalCase for component names and files
- Props interfaces defined inline or as separate type exports

### State Management
- Use Zustand for global state (see `stores/appStore.ts`)
- Local state with useState hooks
- Type all state with TypeScript interfaces

### Error Handling
- Use `sanitizeError()` from `services/errorUtils.ts` for user-facing errors
- Never expose internal error details or API keys
- Return generic error messages: 'Service temporarily unavailable', 'Network error occurred'

### Styling
- Use Tailwind CSS classes only
- Responsive design with mobile-first approach
- Use semantic HTML elements with proper ARIA labels
- Orange accent color (#orange-500) for primary actions

### Database
- Use Drizzle ORM with PostgreSQL
- Migrations in `drizzle/` directory
- Schema in `db/schema.ts`

### Testing
- Single test file: `services/errorUtils.test.ts`
- Run with `tsx` for TypeScript execution
- Test error sanitization thoroughly