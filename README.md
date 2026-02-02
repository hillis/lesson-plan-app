# Lesson Plan Generator

An AI-powered web application that helps educators create personalized, CTE (Career & Technical Education)-format lesson plans in minutes. Upload your curriculum materials once, then generate complete weekly lesson plans with just a few clicks.

## Features

- **AI-Powered Generation** - Uses Claude AI to analyze your curriculum and generate comprehensive lesson plans
- **Document Upload** - Upload syllabus, standards, pacing guides, and other curriculum materials (PDF, DOCX, TXT)
- **Customizable Output** - Configure days per week, include/exclude student handouts and presentations
- **Google Drive Integration** - Automatically save generated files to your Google Drive in organized folders
- **CTE Format** - Generates lesson plans in standard Career & Technical Education format with:
  - Daily learning objectives
  - Detailed time-based schedules
  - Differentiation strategies (Advanced, Struggling, ELL learners)
  - Vocabulary definitions
  - Assessment strategies
  - Content standards alignment

## Tech Stack

**Frontend:**
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Radix UI / shadcn/ui components

**Backend:**
- Supabase (Authentication, PostgreSQL Database, File Storage)
- Claude AI (Anthropic SDK)
- Google Drive API

**Document Processing:**
- mammoth (Word documents)
- pdf-parse (PDF extraction)
- docx / pptxgenjs (Document generation)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- Anthropic API key
- Google Cloud project with Drive API enabled

### Environment Setup

Create a `.env.local` file with the following variables:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# AI
ANTHROPIC_API_KEY=your_anthropic_key

# Google OAuth & Drive
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/drive/auth/callback

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication pages
│   ├── api/               # API routes
│   ├── dashboard/         # Protected dashboard pages
│   └── page.tsx           # Landing page
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   └── ...               # Feature components
├── lib/                   # Utilities and services
│   ├── claude/           # AI integration
│   ├── document-generator/
│   ├── google/           # Drive API client
│   └── supabase/         # Database clients
├── hooks/                 # React hooks
└── types/                 # TypeScript definitions
```

## Usage

1. **Sign Up/Login** - Create an account or sign in with Google
2. **Upload Documents** - Go to My Documents and upload your curriculum materials
3. **Generate** - From the Dashboard, select week number and options, then generate
4. **Export** - Download files or save directly to Google Drive

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/documents` | GET/POST/DELETE | Manage uploaded documents |
| `/api/generate` | POST | Generate lesson plans |
| `/api/generated-files` | GET/DELETE/PATCH | Manage generated files |
| `/api/drive/save` | POST | Save files to Google Drive |
| `/api/drive/folders` | GET | List Drive folders |

## Deployment

This app is configured for deployment on Vercel:

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

## License

MIT
