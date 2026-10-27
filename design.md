# Legal Contract Summarizer & Risk Analyzer — Design Document

## Stack
- **Frontend**: React 18 + Vite, React Router v6, Axios
- **Backend**: Node.js + Express (ESM), Mongoose, Multer, JWT (httpOnly cookie)
- **Database**: MongoDB
- **AI**: Google Gemini API (`gemini-1.5-flash`)
- **File parsing**: pdf-parse, mammoth

## Architecture — Flat (no nested folders beyond src/)

```
backend/src/
  config/         database.js, env.js
  controllers/    auth.controller.js, contract.controller.js, analysis.controller.js
  middleware/     auth.middleware.js, error.middleware.js, rateLimit.middleware.js
  models/         user.model.js, contract.model.js, analysis.model.js
  routes/         auth.routes.js, contract.routes.js, analysis.routes.js
  services/       auth.service.js, documentExtraction.service.js, gemini.service.js
  utils/          jwt.js, password.js
  validators/     auth.validator.js
  app.js, server.js

frontend/src/
  components/common/   Navbar.jsx
  components/auth/     Login.jsx, Register.jsx
  components/analysis/ AnalysisResult.jsx, RiskBadge.jsx, ClauseCard.jsx, QAPanel.jsx
  context/             AuthContext.jsx
  hooks/               useAuth.js
  pages/auth/          Login.jsx, Register.jsx
  pages/dashboard/     Dashboard.jsx
  pages/analysis/      AnalysisPage.jsx
  routes/              AppRoutes.jsx
  services/            authService.js, contractService.js, analysisService.js
  utils/               constants.js
  App.jsx, main.jsx, styles.css
```

## Modules

### Module 1 — User Authentication (DONE)
- Register / Login / Logout / /me
- JWT stored in httpOnly cookie
- bcrypt password hashing

### Module 2 — Document Upload & Processing (DONE)
- PDF / DOCX upload via Multer (10 MB limit)
- Text extraction: pdf-parse + mammoth
- Contract stored in MongoDB with processingStatus

### Module 3 — AI-Based Contract Analysis (NEW)
- POST `/api/analysis/:contractId/analyze`
- Calls Gemini API with extracted text
- Returns: summary, importantClauses[], riskScore (0-100), risks[]
- Stored in `Analysis` model

### Module 4 — Risk Detection & Assessment (NEW)
- Part of analysis response: risks[] with { clause, level (low/medium/high/critical), explanation }
- riskScore aggregated from individual risk levels
- GET `/api/analysis/:contractId` returns stored analysis

### Module 5 — Plain-Language Summary & Q&A (NEW)
- Summary field in analysis (plain English)
- POST `/api/analysis/:contractId/ask` — sends question + contract text to Gemini, returns answer

### Module 6 — Dashboard & Report Generation (NEW)
- Dashboard shows contract list with analysis status
- AnalysisPage shows full analysis: summary, risk score, clauses, risks, Q&A
- GET `/api/analysis/:contractId/report` — returns JSON report
- Frontend "Download Report" button generates a formatted text file

## Data Models

### Analysis
```
contractId: ObjectId (ref Contract)
userId: ObjectId (ref User)
summary: String
importantClauses: [{ title, content, explanation }]
risks: [{ clause, level, explanation }]
riskScore: Number (0-100)
qaHistory: [{ question, answer, askedAt }]
status: enum [pending, completed, failed]
```

## API Routes
```
POST   /api/analysis/:contractId/analyze   → trigger AI analysis
GET    /api/analysis/:contractId           → get stored analysis
POST   /api/analysis/:contractId/ask       → Q&A
GET    /api/analysis/:contractId/report    → download report data
```

## Gemini Prompt Strategy
- Single structured prompt requesting JSON output with keys: summary, importantClauses, risks, riskScore
- Q&A prompt: system context = contract text, user question appended
- Model: gemini-1.5-flash (fast, cost-effective)
