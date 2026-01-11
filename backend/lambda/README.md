# Staffinc Owl - SAM Implementation

This is a SAM-based implementation of Staffinc Owl with a 2-Lambda architecture.

## Architecture

### Public Lambda
- **Purpose**: Handle user-facing operations, OpenAI API calls
- **Access**: No authentication required
- **Network**: Outside VPC (internet access for OpenAI)
- **Services**: OpenAI API, S3 presigned URLs
- **Endpoints**:
  - `GET /` - Health check
  - `POST /upload/presigned` - Generate S3 upload URL
  - `POST /upload/process` - Submit candidate for processing
  - `GET /upload/process/status/{id}` - Get candidate status
  - `POST /ai/analyze` - Perform full gap analysis (called by Private Lambda)
  - `POST /ai/normalize-notes` - Normalize interview notes
  - `POST /ai/normalize-scores` - Extract and normalize scores
  - `POST /ai/normalize-feedback` - Normalize client feedback
  - `POST /ai/standardize-requirements` - Standardize job requirements

### Private Lambda
- **Purpose**: Backend processing, database operations
- **Access**: API Key authentication required
- **Network**: Inside VPC (for RDS database access)
- **Services**: S3, RDS PostgreSQL
- **Endpoints**:
  - `GET /setup/clients` - List clients
  - `POST /setup/clients` - Create client
  - `GET /setup/interviewers` - List interviewers
  - `POST /setup/interviewers` - Create interviewer
  - `GET /setup/requirements` - List requirements
  - `POST /setup/requirements` - Create requirement (calls /ai/standardize-requirements)
  - `GET /metrics/overview` - Get metrics overview
  - `GET /metrics/candidates` - List candidates
  - `POST /internal/process` - Process candidate (calls /ai/analyze)
  - `GET /admin/db` - Execute DB queries (requires ADMIN_KEY)
  - `GET /admin/cleanup-stuck` - Reset stuck candidates (requires ADMIN_KEY)

## Directory Structure

```
backend/lambda/
├── src/
│   ├── public/
│   │   ├── index.ts              # Public Lambda entry point
│   │   └── handlers/
│   │       ├── health.ts
│   │       ├── get-presigned-url.ts
│   │       ├── process-candidate.ts
│   │       ├── status.ts
│   │       ├── ai-analyze.ts                  # AI gap analysis endpoint
│   │       ├── ai-normalize-notes.ts          # AI notes normalization
│   │       ├── ai-normalize-scores.ts         # AI scores extraction
│   │       ├── ai-normalize-feedback.ts       # AI feedback normalization
│   │       └── ai-standardize-requirements.ts # AI requirements standardization
│   ├── private/
│   │   ├── index.ts              # Private Lambda entry point
│   │   └── handlers/
│   │       ├── setup.ts
│   │       ├── metrics.ts
│   │       ├── admin.ts
│   │       └── internal-process.ts
│   ├── services/
│   │   ├── aws.service.ts         # S3 operations
│   │   ├── database.ts            # PostgreSQL operations
│   │   ├── llm.service.ts         # OpenAI integration (GPT-4o-mini)
│   │   └── http.service.ts        # HTTP client for API Gateway calls
│   ├── types/
│   │   └── index.ts               # TypeScript types
│   └── shared/
├── template.yaml                  # SAM template
├── samconfig.toml                 # SAM configuration
├── tsconfig.json                  # TypeScript config
├── package.json                   # Dependencies
└── .env.example                   # Environment variables template
```

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
sam local invoke PublicFunction --event events/event.json
```

## Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `AWS_DEFAULT_REGION` | AWS region | Yes |
| `AWS_S3_BUCKET` | S3 bucket name | Yes |
| `OPENAI_API_KEY` | OpenAI API key for GPT-4o-mini | Yes |
| `ADMIN_KEY` | Admin key for admin operations | Yes |
| `PRIVATE_API_URL` | Private API Gateway URL | Yes |
| `PRIVATE_API_KEY` | API key for private API access | Yes |

### Lambda Configuration

**PublicLambda:**
- **Runtime**: nodejs20.x
- **Timeout**: 600 seconds (10 minutes)
- **Memory**: 512 MB
- **Architecture**: x86_64
- **Network**: Outside VPC (internet access for OpenAI)

**PrivateFunction:**
- **Runtime**: nodejs20.x
- **Timeout**: 900 seconds (15 minutes)
- **Memory**: 512 MB
- **Architecture**: x86_64
- **Network**: Inside VPC (for RDS access)

## Testing

### Health Check
```bash
curl https://public-api-url/
```

### Get Presigned URL
```bash
curl -X POST https://public-api-url/upload/presigned \
  -H "Content-Type: application/json" \
  -d '{"fileName":"resume.pdf","contentType":"application/pdf"}'
```

### Submit Candidate
```bash
curl -X POST https://public-api-url/upload/process \
  -H "Content-Type: application/json" \
  -d '{"s3Key":"uploads/uuid/resume.pdf","fileName":"resume.pdf"}'
```

### Get Candidate Status
```bash
curl https://public-api-url/upload/process/status/{candidateId}
```

## Cleanup

To delete the stack:
```bash
aws cloudformation delete-stack --stack-name staffinc-owl-lambda
```

## Resources

- [AWS SAM Documentation](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/what-is-sam.html)
- [OpenAI API Documentation](https://platform.openai.com/docs)
