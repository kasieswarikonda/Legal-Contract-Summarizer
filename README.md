## Module 1 Authentication

### Environment variables

Create `backend/.env`:

```env
PORT=4000
MONGO_URI=mongodb://localhost:27017/legal_contract_summarizer
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=7d
FRONTEND_ORIGIN=http://localhost:5173
NODE_ENV=development
```

The frontend uses `VITE_API_URL` when provided and otherwise calls
`http://localhost:4000/api`.

### API endpoints

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

Authentication uses an HTTP-only cookie. JWTs are never stored in
`localStorage`, and password fields are excluded from user responses.

### Run locally

Start MongoDB, then run each application in its own terminal:

```bash
cd backend
npm install
npm run dev
```

```bash
cd frontend
npm install
npm run dev
```

Registration and login set the cookie and navigate to `/dashboard`. On refresh,
the frontend calls `/api/auth/me` to restore the authenticated user. Logout
clears the cookie and redirects to `/login`.
# Legal Contract Summarizer & Risk Analyzer

AI-based web application that helps users understand legal contracts by
summarizing important clauses, detecting potential risks, and explaining
complex legal language in simple terms.

## Project

This project is being developed as a MERN stack application. Module 1 provides
user authentication and access management only; contract analysis is reserved
for later modules.

### Technology Stack

#### Frontend
- React.js
- Vite
- React Router
- Axios

#### Backend
- Node.js
- Express.js
- MongoDB
- Mongoose

#### Authentication
- JWT
- bcryptjs

#### AI
- Reserved for a later module

## Project Structure

```text
Legal-Contract-Summarizer/
│
├── frontend/
│   └── React application
│
├── backend/
│   └── Express REST API
│
├── .gitignore
└── README.md