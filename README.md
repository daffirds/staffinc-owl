# Staffinc Owl

A full-stack AI-powered candidate analysis platform with AWS Lambda backend and React frontend.

## Project Structure

```
staffinc-owl/
├── backend/               # AWS Lambda backend
│   ├── lambda/           # SAM-based Lambda functions
│   │   ├── src/
│   │   │   ├── ai/      # AI Lambda - OpenAI integration
│   │   │   ├── private/ # Private Lambda - database operations
│   │   │   ├── handlers/ # Shared handlers
│   │   │   └── services/ # AWS S3, Database, LLM, HTTP services
│   │   ├── template.yaml # SAM template
│   │   └── samconfig.toml
│   └── prisma/           # Prisma schema for database
└── frontend/             # React frontend
    ├── src/
    │   ├── components/
    │   ├── lib/
    │   └── pages/
    └── package.json
```

## Backend (AWS Lambda)

### Architecture

**AI Function**
- Runtime: Node.js 20.x
- Timeout: 600 seconds
- Memory: 512 MB
- Network: Outside VPC (internet access for OpenAI)
- Handles: AI analysis, normalization, and standardization

**Private Function**
- Runtime: Node.js 20.x
- Timeout: 900 seconds
- Memory: 512 MB
- Network: Inside VPC (RDS database access)
- Handles: Database operations, setup, metrics, admin

### AI Function Endpoints
- `GET /` - Health check
- `POST /upload/presigned` - Generate S3 upload URL
- `POST /ai/analyze` - Perform full gap analysis
- `POST /ai/normalize-notes` - Normalize interview notes
- `POST /ai/normalize-scores` - Extract and normalize scores
- `POST /ai/normalize-feedback` - Normalize client feedback
- `POST /ai/standardize-requirements` - Standardize job requirements

### Private Function Endpoints
- `POST /upload/process` - Submit candidate for processing
- `GET /upload/process/status/{id}` - Get candidate status
- `GET/POST /clients` - List/create clients
- `GET/POST /interviewers` - List/create interviewers
- `GET/POST /requirements` - List/create requirements
- `GET /metrics/overview` - Get metrics overview
- `GET /metrics/candidates` - List candidates
- `POST /internal/process` - Process candidate (internal)
- `GET /admin/db` - Execute DB queries (ADMIN_KEY required)
- `GET /admin/cleanup-stuck` - Reset stuck candidates (ADMIN_KEY required)
- `GET /db-test` - Database connection test

### Setup

1. Install dependencies:
```bash
cd backend/lambda
npm install
```

2. Set environment variables:
```bash
cp .env.example .env
# Edit .env with your credentials
```

3. Build:
```bash
npm run build
```

4. Deploy with SAM:
```bash
sam build
sam deploy --guided
```

## Frontend (React)

### Tech Stack
- Vite
- React 18
- TypeScript
- shadcn/ui
- Tailwind CSS
- React Router
- TanStack Query
- Recharts

### Setup

1. Install dependencies:
```bash
cd frontend
npm install
```

2. Start development server:
```bash
npm run dev
```

3. Build for production:
```bash
npm run build
```

## Root Scripts

```bash
# Install all dependencies
npm run install:all

# Start both frontend and backend dev servers
npm run dev

# Push database schema
npm run db:push

# Generate Prisma client
npm run db:generate
```

## Environment Variables

### Backend
- `DATABASE_URL` - PostgreSQL connection string
- `AWS_S3_BUCKET` - S3 bucket name
- `OPENAI_API_KEY` - OpenAI API key
- `ADMIN_KEY` - Admin key for admin operations
- `API_GATEWAY_ID` - API Gateway ID for internal calls
- `NODE_TLS_REJECT_UNAUTHORIZED` - Set to '0' for development

### Frontend
Set your API endpoints in the frontend environment configuration.

## Prerequisites

- Node.js 20.x
- AWS CLI configured
- SAM CLI installed
- PostgreSQL RDS instance
- S3 bucket
- OpenAI API key

## Cleanup

Delete Lambda stack:
```bash
cd backend/lambda
aws cloudformation delete-stack --stack-name staffinc-owl
```
