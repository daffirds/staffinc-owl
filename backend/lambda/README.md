# Staffinc Owl Lambda - SAM Implementation

AWS Lambda backend for Staffinc Owl with AI-powered candidate analysis.

## Architecture

### AI Function
- **Purpose**: AI processing and OpenAI API integration
- **Access**: Public endpoints
- **Network**: Outside VPC (internet access for OpenAI)
- **Runtime**: Node.js 20.x
- **Timeout**: 600 seconds
- **Memory**: 512 MB

### Private Function
- **Purpose**: Database operations and backend processing
- **Access**: API endpoints within VPC
- **Network**: Inside VPC (RDS database access)
- **Runtime**: Node.js 20.x
- **Timeout**: 900 seconds
- **Memory**: 512 MB

## Directory Structure

```
backend/lambda/
├── src/
│   ├── ai/
│   │   └── index.ts              # AI Lambda entry point
│   ├── private/
│   │   └── index.ts              # Private Lambda entry point
│   ├── handlers/
│   │   ├── health.ts
│   │   ├── status.ts
│   │   ├── process-candidate.ts
│   │   ├── get-presigned-url.ts
│   │   ├── internal-process.ts
│   │   ├── admin.ts
│   │   ├── setup.ts
│   │   ├── metrics.ts
│   │   └── db-test.ts
│   ├── services/
│   │   ├── aws.service.ts        # S3 operations
│   │   ├── database.ts           # PostgreSQL operations
│   │   ├── llm.service.ts        # OpenAI integration
│   │   └── http.service.ts       # HTTP client
│   └── types/
│       └── index.ts              # TypeScript types
├── template.yaml                  # SAM template
├── samconfig.toml                 # SAM configuration
├── tsconfig.json                  # TypeScript config
├── package.json                   # Dependencies
└── .env.example                   # Environment variables template
```

## API Endpoints

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
- `GET /clients` - List clients
- `POST /clients` - Create client
- `GET /interviewers` - List interviewers
- `POST /interviewers` - Create interviewer
- `GET /requirements` - List requirements
- `POST /requirements` - Create requirement
- `GET /metrics/overview` - Get metrics overview
- `GET /metrics/candidates` - List candidates
- `POST /internal/process` - Process candidate (internal)
- `GET /admin/db` - Execute DB queries (requires ADMIN_KEY)
- `GET /admin/cleanup-stuck` - Reset stuck candidates (requires ADMIN_KEY)
- `GET /db-test` - Database connection test

## Setup

### Prerequisites
- Node.js 20.x
- AWS CLI configured
- SAM CLI installed
- PostgreSQL RDS instance
- S3 bucket
- OpenAI API key

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your credentials
```

### Build

```bash
npm run build
```

### Deploy

Using SAM CLI:
```bash
sam build
sam deploy --guided
```

Or use pre-configured deploy:
```bash
sam deploy
```

### Local Development

Start local API Gateway:
```bash
sam local start-api
```

Invoke a specific function locally:
```bash
sam local invoke AIFunction --event events/event.json
```

## Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `AWS_DEFAULT_REGION` | AWS region | Yes |
| `AWS_S3_BUCKET` | S3 bucket name | Yes |
| `OPENAI_API_KEY` | OpenAI API key | Yes |
| `ADMIN_KEY` | Admin key for admin operations | Yes |
| `API_GATEWAY_ID` | API Gateway ID for internal calls | Yes |
| `NODE_TLS_REJECT_UNAUTHORIZED` | SSL verification (set to '0' for dev) | Yes |

## Testing

### Health Check
```bash
curl https://api-url/
```

### Get Presigned URL
```bash
curl -X POST https://api-url/upload/presigned \
  -H "Content-Type: application/json" \
  -d '{"fileName":"resume.pdf","contentType":"application/pdf"}'
```

### Submit Candidate
```bash
curl -X POST https://api-url/upload/process \
  -H "Content-Type: application/json" \
  -d '{"s3Key":"uploads/uuid/resume.pdf","fileName":"resume.pdf"}'
```

### Get Candidate Status
```bash
curl https://api-url/upload/process/status/{candidateId}
```

## Cleanup

To delete the stack:
```bash
aws cloudformation delete-stack --stack-name staffinc-owl
```

## Resources

- [AWS SAM Documentation](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/what-is-sam.html)
- [OpenAI API Documentation](https://platform.openai.com/docs)
