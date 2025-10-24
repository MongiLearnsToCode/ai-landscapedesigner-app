# Agent Guidelines for AI Landscape Designer

## Build/Lint/Test Commands
- **Build**: `npm run build` (includes sitemap generation)
- **Dev**: `npm run dev` (runs client + API concurrently)
- **Test**: `npm run test` (runs errorUtils.test.ts)
- **Single test**: `tsx services/errorUtils.test.ts`
- **DB generate**: `npm run db:generate`
- **DB migrate**: `npm run db:migrate`

## Code Style Guidelines

### Imports & Exports
- Use ES6 imports/exports
- Group imports: React, third-party libraries, then local imports
- Use path aliases: `@/` for root-relative imports
- Prefer named exports over default exports

### Naming Conventions
- **Components**: PascalCase (e.g., `Header`, `ImageUploader`)
- **Functions/Variables**: camelCase (e.g., `uploadImage`, `isAuthenticated`)
- **Types/Interfaces**: PascalCase (e.g., `User`, `ImageFile`)
- **Files**: PascalCase for components, camelCase for utilities

### TypeScript
- Strict typing required for all new code
- Use interfaces for object shapes
- Define return types for functions
- Use union types for enums (e.g., `LandscapingStyle`)

### Formatting
- 2-space indentation
- No semicolons
- Single quotes for strings
- Trailing commas in multi-line objects/arrays

### Error Handling
- Use `sanitizeError()` from `services/errorUtils.ts` for user-facing errors
- Never expose internal errors or API keys to users
- Use try/catch with async/await
- Log errors to console for debugging

### React Patterns
- Functional components with hooks
- Use Zustand stores for state management
- Props interface for component props
- Event handlers prefixed with `handle` (e.g., `handleClick`)

### Styling
- Tailwind CSS classes
- Responsive design with `sm:`, `md:`, `lg:` prefixes
- Consistent color palette (slate/orange theme)
- Component-scoped className logic

### Database
- Drizzle ORM for queries
- Use transactions for multi-step operations
- Soft deletes with `isDeleted` flag