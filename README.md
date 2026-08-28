# Legal Contract Summarizer & Risk Analyzer

AI-based web application that helps users understand legal contracts by
summarizing important clauses, detecting potential risks, and explaining
complex legal language in simple terms.

## Project Overview

This project is being developed as a MERN stack application in incremental
modules.

- **Module 1 — Authentication** (complete): User registration, login, logout,
  and session restoration using JWT stored in an HTTP-only cookie.
- **Module 2 — Contract Management** (complete): Upload PDF/DOCX contracts,
  validate files, extract text from both formats, and manage a per-user
  contract history with detail viewing.
- **Module 3 — Gemini Clause Analysis** (planned): AI-powered clause
  summarization and risk detection. Not yet implemented.

## Architecture

```text
Legal-Contract-Summarizer/
│
├── frontend/                 React + Vite single-page application
│   └── src/
│       ├── components/       Auth forms, Navbar
│       ├── context/          AuthContext (session state)
│       ├── hooks/            useAuth
│       ├── layouts/          AuthLayout
│       ├── pages/            Login, Register, Dashboard
│       ├── routes/           AppRoutes, protected/public routes
│       ├── services/         Axios API clients (auth, contract)
│       └── utils/            constants (API base URL)
│
└── backend/                  Express REST API
    └── src/
        ├── config/           env, MongoDB connection
        ├── controllers/      auth, contract
        ├── middleware/       auth (JWT), error handler, rate limiting
        ├── models/           User, Contract (Mongoose)
        ├── routes/           auth, contract
        ├── services/         auth, PDF/DOCX text extraction
        ├── utils/            JWT sign/verify, password hashing
        └── validators/       auth input validation
```

- **Frontend**: React 18, Vite, React Router, Axios.
- **Backend**: Node.js, Express, MongoDB (Mongoose), JWT, bcryptjs.
- **Extraction**: `pdf-parse` for PDFs and `mammoth` for DOCX files.
- **Security**: Helmet, CORS (restricted origin), `express-rate-limit` on auth
  routes, Multer upload validation.

## Prerequisites

- Node.js (v18+)
- npm
- MongoDB running locally (default `mongodb://localhost:27017`)

## Frontend Setup

```bash
cd frontend
npm install
```

Create `frontend/.env` (optional — the API URL defaults to
`http://localhost:4000/api`):

```env
VITE_API_URL=http://localhost:4000/api
```

Run the development server:

```bash
npm run dev
```

Production build:

```bash
npm run build
```

The frontend runs at `http://localhost:5173`.

## Backend Setup

```bash
cd backend
npm install
```

Create `backend/.env` from `.env.example`:

```env
PORT=4000
MONGO_URI=mongodb://localhost:27017/legal_contract_summarizer
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=7d
FRONTEND_ORIGIN=http://localhost:5173
NODE_ENV=development
```

> `NODE_ENV=production` switches the auth cookie to `Secure` / `SameSite=None`.
> `FRONTEND_ORIGIN` restricts which cross-origin web clients may call the API.

Run the backend:

```bash
npm run dev     # development with auto-reload (nodemon)
npm start       # production start
```

The API runs at `http://localhost:4000`.

## Running the Full Application

1. Start MongoDB.
2. Start the backend (`npm run dev` in `backend/`).
3. Start the frontend (`npm run dev` in `frontend/`).
4. Open `http://localhost:5173`, register an account, and log in.

## Authentication Overview

- Registration and login return a JWT in an **HTTP-only cookie** (`token`).
  The token is never stored in `localStorage`.
- All `/api/contracts` endpoints and `GET /api/auth/me` require a valid cookie.
- On refresh, the frontend calls `GET /api/auth/me` to restore the session.
- Logout clears the cookie.
- Password fields are excluded from all user responses and hashed with
  bcryptjs.

## Contract Upload Flow

1. The dashboard accepts a file via an `<input type="file" accept=".pdf,.docx">`.
2. The frontend validates the extension and the 10 MB size limit before upload.
3. The file is sent as `multipart/form-data` to `POST /api/contracts/upload`.
4. The backend enforces:
   - authentication (HTTP-only JWT cookie),
   - MIME type (only PDF or DOCX),
   - file size (maximum 10 MB),
   - extension (`pdf` / `docx`) as a secondary check.
5. Contract metadata is saved to MongoDB with `processingStatus: pending`, then
   `processing`.
6. Text is extracted from the stored file:
   - **success** → `extractedText` saved, `processingStatus: completed`;
   - **failure** → `extractionError` saved with a safe user-facing message,
     `processingStatus: failed`;
   - an unexpected error → `500`, the uploaded file is removed.
7. The refreshed contract history shows the status of every upload.

## PDF/DOCX Text Extraction

- PDFs are parsed with `pdf-parse`. Image-only/scanned PDFs with no extractable
  text are reported as a failed extraction with a safe message.
- DOCX files are parsed with `mammoth` raw-text extraction.
- Extracted text is normalized (whitespace, line endings, control characters)
  before being stored and displayed in the contract detail modal.

## API Endpoints

### Authentication — `/api/auth`

| Method | Endpoint        | Auth | Description                            |
| ------ | --------------- | ---- | -------------------------------------- |
| POST   | `/register`     | No   | Register a new account (rate limited)  |
| POST   | `/login`        | No   | Log in and set the auth cookie (limited) |
| POST   | `/logout`       | No   | Clear the auth cookie                  |
| GET    | `/me`           | Yes  | Return the current authenticated user  |

### Contracts — `/api/contracts`

| Method | Endpoint    | Auth | Description                                    |
| ------ | ----------- | ---- | ---------------------------------------------- |
| POST   | `/upload`   | Yes  | Upload and process a PDF/DOCX contract         |
| GET    | `/`         | Yes  | List the current user's contracts              |
| GET    | `/:id`      | Yes  | Get one of the current user's contracts        |

## Security Notes

- JWT is delivered in an HTTP-only cookie; the frontend never reads the raw
  token.
- All contract queries are scoped to `req.user.userId`, which is derived from
  the signed JWT — never trusted from frontend input. One user cannot retrieve
  another user's contracts (returns `404`).
- Physical file paths (`filePath`) and stored file names (`storedFileName`)
  are excluded from every API response.
- Internal/server errors return a generic `500` message; stack traces and raw
  error internals are logged server-side only.
- Raw extraction failures are stored as safe user-facing messages.
- Uploads are restricted to PDF/DOCX and 10 MB maximum.
- Helmet is enabled and CORS is restricted to `FRONTEND_ORIGIN`.
- Auth endpoints are rate limited.
- Secrets (`backend/.env`) are gitignored and never committed
  (`backend/uploads/`, `node_modules/`, and `dist/` are gitignored as well).

## Current Module Status

| Module | Feature                         | Status     |
| ------ | ------------------------------- | ---------- |
| 1      | Authentication & access control | **Done**   |
| 1      | HTTP-only JWT session           | **Done**   |
| 2      | Contract upload (PDF/DOCX)      | **Done**   |
| 2      | File validation & 10 MB limit   | **Done**   |
| 2      | MongoDB contract metadata       | **Done**   |
| 2      | PDF & DOCX text extraction      | **Done**   |
| 2      | Contract history & detail view  | **Done**   |
| 3      | Gemini clause analysis          | Planned    |

## Future Module 3 — Gemini Clause Analysis (placeholder)

Module 3 will integrate Gemini (or another LLM) to:

- Summarize key contract clauses.
- Detect and flag potential risks.
- Explain complex legal language in plain terms.

No AI/LLM functionality exists yet; the current application handles
authentication, upload, and text extraction only.