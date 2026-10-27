# Legal Contract Summarizer & Risk Analyzer — Project Documentation

## How to Run

### 1. Backend
```
cd backend
# Add your Gemini API key to .env:  GEMINI_API_KEY=AIza...
npm install
npm run dev        # runs on http://localhost:4000
```

### 2. Frontend
```
cd frontend
npm install
npm run dev        # runs on http://localhost:5173
```

---

## Module → File Map

---

### Module 1 — User Authentication & Access Management

**What it does:** Register, login, logout, JWT stored in httpOnly cookie, password hashing.

| Layer | File | Responsibility |
|---|---|---|
| Config | `backend/src/config/env.js` | Loads JWT_SECRET, PORT, etc. from `.env` |
| Model | `backend/src/models/user.model.js` | MongoDB User schema (name, email, password, role) |
| Util | `backend/src/utils/password.js` | bcrypt hash + compare |
| Util | `backend/src/utils/jwt.js` | sign + verify JWT |
| Validator | `backend/src/validators/auth.validator.js` | Validates register/login request body |
| Service | `backend/src/services/auth.service.js` | registerUser, loginUser, getUser, safeUser |
| Controller | `backend/src/controllers/auth.controller.js` | register, login, logout, me handlers |
| Middleware | `backend/src/middleware/auth.middleware.js` | requireAuth — verifies JWT from cookie |
| Middleware | `backend/src/middleware/rateLimit.middleware.js` | Rate limits auth endpoints (50 req/15 min) |
| Route | `backend/src/routes/auth.routes.js` | POST /api/auth/register, /login, /logout · GET /me |
| Frontend | `frontend/src/services/authService.js` | login(), register(), logout(), getCurrentUser() |
| Frontend | `frontend/src/context/AuthContext.jsx` | Global auth state (user, isAuthenticated, loading) |
| Frontend | `frontend/src/hooks/useAuth.js` | useAuth() hook to consume AuthContext |
| Frontend | `frontend/src/components/auth/Login.jsx` | Login form UI |
| Frontend | `frontend/src/components/auth/Register.jsx` | Register form UI |
| Frontend | `frontend/src/pages/auth/Login.jsx` | Re-exports Login component |
| Frontend | `frontend/src/pages/auth/Register.jsx` | Re-exports Register component |
| Frontend | `frontend/src/layouts/AuthLayout.jsx` | Centered layout wrapper for auth pages |

**Flow:**
```
User fills form → authService.login/register → POST /api/auth/login|register
→ auth.controller → auth.service → User model → JWT signed → set httpOnly cookie
→ AuthContext.user updated → redirect to /dashboard
```

---

### Module 2 — Legal Document Upload & Processing

**What it does:** Accept PDF/DOCX upload, extract text, store contract record in MongoDB.

| Layer | File | Responsibility |
|---|---|---|
| Model | `backend/src/models/contract.model.js` | Contract schema (fileName, fileType, filePath, processingStatus, extractedText) |
| Service | `backend/src/services/documentExtraction.service.js` | extractTextFromFile() — pdf-parse for PDF, mammoth for DOCX |
| Controller | `backend/src/controllers/contract.controller.js` | uploadContract, getContracts, getContractById |
| Route | `backend/src/routes/contract.routes.js` | POST /upload (multer), GET /, GET /:id |
| Frontend | `frontend/src/services/contractService.js` | uploadContract(), getContracts(), getContractById() |
| Frontend | `frontend/src/pages/dashboard/Dashboard.jsx` | File picker UI, upload progress bar, contract history table |

**Flow:**
```
User picks file → Dashboard → contractService.uploadContract()
→ POST /api/contracts/upload (multer saves file to uploads/contracts/)
→ contract.controller → ExtractionService extracts text
→ Contract saved with processingStatus: 'completed' + extractedText
→ Dashboard table refreshes
```

---

### Module 3 — AI-Based Contract Analysis

**What it does:** Sends extracted contract text to Gemini API, gets structured JSON with summary, important clauses, risks, and risk score. Stores result in Analysis model.

| Layer | File | Responsibility |
|---|---|---|
| Config | `backend/src/config/env.js` | Exposes geminiApiKey from GEMINI_API_KEY env var |
| Model | `backend/src/models/analysis.model.js` | Analysis schema (summary, importantClauses, risks, riskScore, qaHistory, status) |
| Service | `backend/src/services/gemini.service.js` | analyzeContract() — builds prompt, calls Gemini, parses JSON response |
| Controller | `backend/src/controllers/analysis.controller.js` | analyze() handler — calls gemini service, saves to Analysis model |
| Route | `backend/src/routes/analysis.routes.js` | POST /api/analysis/:contractId/analyze |
| Frontend | `frontend/src/services/analysisService.js` | triggerAnalysis() |
| Frontend | `frontend/src/pages/analysis/AnalysisPage.jsx` | Triggers analysis on load, shows spinner while waiting |
| Frontend | `frontend/src/components/analysis/AnalysisResult.jsx` | Renders summary, risk score meter, risks, clauses |

**Flow:**
```
User clicks Analyze → navigate to /analysis/:contractId
→ AnalysisPage calls triggerAnalysis() → POST /api/analysis/:contractId/analyze
→ analysis.controller fetches Contract.extractedText
→ gemini.service.analyzeContract() → Gemini API → JSON parsed
→ Analysis record saved (status: completed)
→ AnalysisResult component renders the data
```

---

### Module 4 — Risk Detection & Assessment

**What it does:** Gemini identifies risky clauses, assigns levels (low/medium/high/critical), explains each risk, and computes an overall risk score (0–100).

| Layer | File | Responsibility |
|---|---|---|
| Service | `backend/src/services/gemini.service.js` | Prompt instructs Gemini to return risks[] + riskScore |
| Model | `backend/src/models/analysis.model.js` | risks[] sub-schema: { clause, level, explanation } · riskScore: Number |
| Controller | `backend/src/controllers/analysis.controller.js` | Stores risks + riskScore from Gemini response |
| Frontend | `frontend/src/components/analysis/RiskBadge.jsx` | Color-coded pill: low=green, medium=yellow, high=orange, critical=red |
| Frontend | `frontend/src/components/analysis/AnalysisResult.jsx` | RiskMeter bar + risk list with RiskBadge per item |

**Flow:**
```
Gemini response.risks[] → stored in Analysis.risks
→ AnalysisResult renders each risk with RiskBadge (level color)
→ RiskMeter shows riskScore/100 as a colored progress bar
```

---

### Module 5 — Plain-Language Summary & Interactive Q&A

**What it does:** Gemini produces a plain-English summary of the contract. Users can ask follow-up questions; answers are stored in qaHistory.

| Layer | File | Responsibility |
|---|---|---|
| Service | `backend/src/services/gemini.service.js` | askQuestion() — sends contract text + question to Gemini |
| Controller | `backend/src/controllers/analysis.controller.js` | ask() handler — calls askQuestion, appends to analysis.qaHistory |
| Route | `backend/src/routes/analysis.routes.js` | POST /api/analysis/:contractId/ask |
| Frontend | `frontend/src/services/analysisService.js` | askQuestion() |
| Frontend | `frontend/src/components/analysis/QAPanel.jsx` | Question input form + scrollable Q&A history |
| Frontend | `frontend/src/components/analysis/AnalysisResult.jsx` | Renders analysis.summary in Summary section |

**Flow:**
```
User types question → QAPanel → analysisService.askQuestion()
→ POST /api/analysis/:contractId/ask { question }
→ analysis.controller → gemini.service.askQuestion()
→ Gemini returns plain-English answer
→ Saved to analysis.qaHistory → rendered in QAPanel history list
```

---

### Module 6 — Dashboard & Report Generation

**What it does:** Dashboard lists all uploaded contracts with status. Analysis page shows full results. Report endpoint returns structured data; frontend downloads it as a .txt file.

| Layer | File | Responsibility |
|---|---|---|
| Controller | `backend/src/controllers/analysis.controller.js` | getAnalysis() — fetch stored analysis · getReport() — build report object |
| Route | `backend/src/routes/analysis.routes.js` | GET /api/analysis/:contractId · GET /api/analysis/:contractId/report |
| Frontend | `frontend/src/services/analysisService.js` | getAnalysis(), getReport() |
| Frontend | `frontend/src/pages/dashboard/Dashboard.jsx` | Contract history table, Analyze button per row |
| Frontend | `frontend/src/pages/analysis/AnalysisPage.jsx` | Full analysis view, Download Report + Re-analyze buttons |

**Flow:**
```
Dashboard → contract row "Analyze" button → navigate /analysis/:contractId
→ AnalysisPage checks for existing analysis (GET /api/analysis/:contractId)
→ If none, triggers new analysis automatically
→ "Download Report" → GET /api/analysis/:contractId/report
→ downloadTextReport() builds formatted .txt and triggers browser download
→ "Re-analyze" → POST /api/analysis/:contractId/analyze (overwrites existing)
```

---

## Full File Tree

```
Legal-Contract-Summarizer/
├── design.md                          ← Architecture design decisions
├── PROJECT_DOCS.md                    ← This file
│
├── backend/
│   ├── .env                           ← MONGO_URI, JWT_SECRET, GEMINI_API_KEY
│   ├── .env.example
│   ├── package.json
│   └── src/
│       ├── server.js                  ← Entry point, startup validation
│       ├── app.js                     ← Express app, middleware, route mounting
│       ├── config/
│       │   ├── env.js                 ← Central env config object
│       │   └── database.js            ← Mongoose connect()
│       ├── models/
│       │   ├── user.model.js          ← Module 1
│       │   ├── contract.model.js      ← Module 2
│       │   └── analysis.model.js      ← Modules 3-6
│       ├── services/
│       │   ├── auth.service.js        ← Module 1
│       │   ├── documentExtraction.service.js  ← Module 2
│       │   └── gemini.service.js      ← Modules 3, 4, 5
│       ├── controllers/
│       │   ├── auth.controller.js     ← Module 1
│       │   ├── contract.controller.js ← Module 2
│       │   └── analysis.controller.js ← Modules 3, 4, 5, 6
│       ├── routes/
│       │   ├── auth.routes.js         ← Module 1
│       │   ├── contract.routes.js     ← Module 2
│       │   └── analysis.routes.js     ← Modules 3, 4, 5, 6
│       ├── middleware/
│       │   ├── auth.middleware.js     ← All protected routes
│       │   ├── error.middleware.js    ← Global error handler
│       │   └── rateLimit.middleware.js← Module 1
│       ├── utils/
│       │   ├── jwt.js                 ← Module 1
│       │   └── password.js            ← Module 1
│       └── validators/
│           └── auth.validator.js      ← Module 1
│
└── frontend/
    ├── index.html
    ├── package.json
    └── src/
        ├── main.jsx                   ← React entry point
        ├── App.jsx                    ← AuthProvider wrapper
        ├── styles.css                 ← All styles (single file)
        ├── routes/
        │   └── AppRoutes.jsx          ← All routes, ProtectedRoute, PublicRoute
        ├── context/
        │   └── AuthContext.jsx        ← Module 1 — global auth state
        ├── hooks/
        │   └── useAuth.js             ← Module 1 — useAuth() hook
        ├── layouts/
        │   └── AuthLayout.jsx         ← Module 1 — centered auth wrapper
        ├── services/
        │   ├── authService.js         ← Module 1
        │   ├── contractService.js     ← Module 2
        │   └── analysisService.js     ← Modules 3, 4, 5, 6
        ├── utils/
        │   └── constants.js           ← API_URL
        ├── components/
        │   ├── common/
        │   │   └── Navbar.jsx         ← All modules — top nav
        │   └── analysis/
        │       ├── AnalysisResult.jsx ← Modules 3, 4 — summary + risks + clauses
        │       ├── RiskBadge.jsx      ← Module 4 — color-coded risk level pill
        │       ├── ClauseCard.jsx     ← Module 3 — expandable clause card
        │       └── QAPanel.jsx        ← Module 5 — Q&A form + history
        └── pages/
            ├── auth/
            │   ├── Login.jsx          ← Module 1
            │   └── Register.jsx       ← Module 1
            ├── dashboard/
            │   └── Dashboard.jsx      ← Modules 2, 6 — upload + contract list
            └── analysis/
                └── AnalysisPage.jsx   ← Modules 3, 4, 5, 6 — full analysis view
```

---

## Environment Variables (backend/.env)

| Variable | Required | Description |
|---|---|---|
| `MONGO_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | Secret for signing JWTs |
| `GEMINI_API_KEY` | Yes | Google Gemini API key (get free at aistudio.google.com) |
| `JWT_EXPIRES_IN` | No | Token expiry, default `7d` |
| `FRONTEND_ORIGIN` | No | CORS origin, default `http://localhost:5173` |
| `PORT` | No | Server port, default `4000` |
