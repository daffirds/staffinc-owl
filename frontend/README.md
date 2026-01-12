# Staffinc Owl Frontend

React frontend for Staffinc Owl - AI-powered candidate analysis platform.

## Tech Stack

- **Vite** - Build tool and dev server
- **React 18** - UI library
- **TypeScript** - Type safety
- **shadcn/ui** - Component library
- **Tailwind CSS** - Styling
- **React Router** - Client-side routing
- **TanStack Query** - Data fetching and caching
- **Recharts** - Data visualization
- **Zod** - Schema validation
- **Axios** - HTTP client

## Getting Started

### Prerequisites
- Node.js 20.x or later
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
Create a `.env` file in the root directory and add:
```bash
VITE_API_URL=https://your-api-gateway-url
```

3. Start development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Project Structure

```
frontend/
├── src/
│   ├── components/    # Reusable UI components
│   ├── lib/           # Utilities and helpers
│   ├── pages/         # Page components
│   └── main.tsx       # Application entry point
├── public/            # Static assets
└── package.json       # Dependencies
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run build:dev` - Build for development
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

## Features

- **Candidate Management** - Upload and track candidates
- **AI Analysis** - View AI-powered gap analysis
- **Dashboard** - Metrics and overview
- **Setup** - Configure clients, interviewers, and requirements

## API Integration

The frontend communicates with the AWS Lambda backend via REST API. API endpoints are configured through environment variables.

## Building for Production

```bash
npm run build
```

The build output will be in the `dist/` directory.

## Deployment

The frontend can be deployed to:
- AWS S3 + CloudFront
- Vercel
- Netlify
- Any static hosting service

## Styling

This project uses Tailwind CSS for styling with shadcn/ui components. Customize the theme in `tailwind.config.js` and CSS variables in `src/index.css`.
