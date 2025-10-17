# AI Landscape Designer - Project Context

## Project Overview

The AI Landscape Designer is a React-based web application that leverages Google's Gemini AI to redesign outdoor spaces in uploaded images. The application allows users to transform their garden or landscape photos into beautifully redesigned versions based on selected landscaping styles, climate considerations, and design preferences.

### Key Technologies
- **Framework**: React 19.1.1
- **Build Tool**: Vite 6.2.0
- **AI Integration**: Google GenAI SDK (gemini-2.5-flash-image model)
- **Styling**: Tailwind CSS (via CDN)
- **Icons**: lucide-react
- **Types**: TypeScript 5.8.2

### Core Functionality
- Upload images of outdoor spaces
- Select from 12 different landscaping styles (Modern, Minimalist, Rustic, Japanese Garden, Urban Modern, English Cottage, Mediterranean, Tropical, Farmhouse, Coastal, Desert, Bohemian)
- Specify climate zones for plant selection
- Adjust redesign density (minimal, balanced, lush)
- Choose whether to allow structural landscape changes
- Generate AI-redesigned images with plant and feature catalog
- Save and view history of redesigns
- User authentication and profile management

## Project Structure

```
├── App.tsx                 # Main application component with routing
├── index.html             # HTML entry point with CDN imports
├── index.tsx              # React DOM entry point
├── package.json           # Dependencies and scripts
├── vite.config.ts         # Vite build configuration
├── .env.local             # Environment variables (GEMINI_API_KEY)
├── constants.ts           # Landscaping style definitions
├── types.ts               # TypeScript type definitions
├── components/            # UI components
├── pages/                 # Page components
├── contexts/              # React context providers
├── services/              # Backend service integrations
└── hooks/                 # Custom React hooks (if any)
```

### Key Components Directory
- `Header.tsx`, `Footer.tsx` - Navigation components
- `ImageUploader.tsx` - Handles image upload functionality
- `StyleSelector.tsx` - Allows selection of landscaping styles
- `ClimateSelector.tsx` - Climate zone selection
- `ResultDisplay.tsx` - Displays original vs redesigned images
- `Modal.tsx` - Image display modal
- `DesignCatalog.tsx` - Shows catalog of plants and features
- `ToastContainer.tsx` - Notification system

### Key Pages Directory
- `DesignerPage.tsx` - Main page with core functionality
- `HistoryPage.tsx` - Displays user's redesign history
- Authentication pages (SignIn, SignUp, Profile, etc.)
- Legal pages (Terms, Privacy, etc.)

### Key Contexts Directory
- `AppContext.tsx` - Manages app-wide state (current page, modal state, etc.)
- `HistoryContext.tsx` - Handles design history and storage
- `ToastContext.tsx` - Global toast notification system

### Key Services Directory
- `geminiService.ts` - Core AI integration with Google GenAI
- `historyService.ts` - History management and persistence (currently using localStorage/IndexedDB)
- `imageDB.ts` - IndexedDB operations for image storage

## Backend Architecture (New)

The AI Landscape Designer now includes a backend built with Node.js, Express, and Drizzle ORM, connected to a Neon PostgreSQL database.

### Backend Directory Structure
```
├── backend/
│   ├── src/
│   │   ├── db/
│   │   │   ├── schema.ts      # Drizzle schema definitions
│   │   │   └── index.ts       # Database connection
│   │   ├── routes/
│   │   │   ├── landscapeRedesigns.ts  # Landscape redesign endpoints
│   │   │   └── users.ts              # User management endpoints
│   │   ├── server.ts          # Express server setup
│   │   └── migrate.ts         # Database migration runner
│   ├── drizzle/              # Migration files
│   ├── .env.example          # Environment variables template
│   └── package.json          # Backend dependencies and scripts
```

### Database Schema
- **users**: Stores user account information (name, email, subscription details)
- **images**: Stores image metadata (name, type, storage path)
- **landscape_redesigns**: Stores landscape design history (design catalog, styles, climate zone)
- **sessions**: Stores user session information (for authentication)

### API Endpoints
- `GET /api/users/:userId` - Retrieve user information
- `POST /api/users` - Create or update user
- `GET /api/landscaperedesigns/users/:userId` - Retrieve user's landscape redesigns
- `POST /api/landscaperedesigns/users/:userId` - Save a new landscape redesign
- `GET /api/landscaperedesigns/:redesignId` - Retrieve specific redesign
- `PATCH /api/landscaperedesigns/:redesignId` - Update a redesign (pin/unpin)
- `DELETE /api/landscaperedesigns/:redesignId` - Delete a redesign
- `GET /api/landscaperedesigns/users/:userId/pinned` - Retrieve pinned redesigns

### Migration from Client-Side Storage
The backend implementation now fully replaces the previous localStorage and IndexedDB approach used in:
- `services/historyService.ts` (completely rewritten to use backend API)
- `services/imageDB.ts` (functionality moved to backend with proper image uploads)

The frontend now communicates with the backend via API calls to persist data in the Neon database, providing improved data persistence, sharing capabilities, and user account management.

## Building and Running

### Prerequisites
- Node.js
- A Gemini API key from Google AI Studio

### Setup Instructions
1. Clone or download the project
2. Install dependencies: `npm install`
3. Set up environment variables in `.env.local`:
   ```
   GEMINI_API_KEY=your_api_key_here
   ```
4. Run the development server: `npm run dev`

### Available Scripts
- `npm run dev` - Start the development server (runs on port 3000)
- `npm run build` - Build the application for production
- `npm run preview` - Preview the production build locally

## Development Conventions

### Coding Style
- Written in TypeScript with strict typing
- Uses React functional components with hooks
- Follows modern React patterns and best practices
- Component-based architecture with clear separation of concerns

### AI Integration Guidelines
- Uses `gemini-2.5-flash-image` model for image editing tasks
- Follows strict prompt engineering to preserve house structures
- Maintains original aspect ratio unless specified otherwise
- Generates JSON catalogs of plants and features alongside redesigned images

### State Management
- Uses React Context API for global state management
- Persists session state in localStorage
- Uses IndexedDB for image storage and history management

### API Key Security
- API key is loaded from environment variables
- Vite configuration defines the API key for client-side use
- Never hardcode API keys in source code

## Architecture Patterns

### Component Architecture
- Main App component manages routing between page components via context
- Page components contain the main layout and business logic
- Reusable components in the components/ directory
- Context providers wrap the application to share global state

### Data Flow
1. User uploads an image via ImageUploader
2. User configures design preferences (style, climate, density)
3. Application calls Gemini API via geminiService
4. API returns redesigned image and catalog data
5. Results are displayed and optionally saved to history

### Error Handling
- Comprehensive try/catch blocks around API calls
- Toast notifications for user feedback
- Fallback mechanisms for JSON parsing failures
- Safety checks for API responses and content availability

## Key Files to Understand

### `/pages/DesignerPage.tsx`
The main page containing all the core functionality of the landscape redesign tool. Handles state management, user inputs, and orchestrates the AI redesign process.

### `/services/geminiService.ts`
The critical service that interfaces with Google's Gemini AI. Contains complex prompt engineering logic and handles image processing, JSON parsing, and error handling for API calls.

### `/contexts/AppContext.tsx`
Manages the global application state including current page, modal states, and navigation logic.

### `/contexts/HistoryContext.tsx`
Handles the storage and retrieval of design history using both localStorage and IndexedDB for image data.

## Special Considerations

### AI Prompt Engineering
The application uses sophisticated prompt engineering to ensure the AI preserves the house structure while only modifying the landscape. The prompt includes multiple critical rules about what can and cannot be changed.

### Image Quality and Aspect Ratio
Maintaining high image quality and respecting the original aspect ratio are critical requirements implemented through the prompt instructions.

### Climate-Specific Plant Selection
The application considers climate zones when generating plant suggestions, with special handling for arid/desert climates.

### Functional Access Rules
The system ensures all garage doors and house entrances maintain functional access paths, which is a critical design constraint implemented in the AI prompt.