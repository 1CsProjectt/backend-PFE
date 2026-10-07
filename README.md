# PFE Management Platform — Backend API

REST and real-time backend for managing **end-of-studies projects (PFE)** at a university scale: student teams, supervisor matching, academic sessions, defenses (soutenances), invitations, preference lists, meetings, and notifications.

Built with **Node.js**, **Express**, **Sequelize**, and **PostgreSQL**, with **Socket.IO** for push-style updates and **Swagger** for interactive API docs.

## Core capabilities

| Domain | Description |
|--------|-------------|
| **Auth & users** | JWT/cookie-based auth, role-aware access (students, teachers, admins, externals) |
| **PFE & teams** | Project registration, group formation, join-team requests |
| **Invitations** | Supervisor/student invitation flows |
| **Sessions & events** | Academic year / session management |
| **Preference lists** | Ranked choices for topics or supervisors |
| **Meetings** | Scheduling between stakeholders |
| **Soutenances** | Defense authorization and soutenance records |
| **Notifications** | User notifications (Socket.IO ready) |
| **Files** | Uploads via Multer + Cloudinary; static `/uploads` and `/photos` |

## Security middleware

- Helmet, rate limiting, compression, CORS allowlist
- `express-mongo-sanitize`, `xss-clean`, `hpp`
- Session support with configurable secrets via environment variables

## Tech stack

- Express 4, Sequelize 6, PostgreSQL (`pg`)
- Socket.IO 4, Swagger UI
- bcryptjs, jsonwebtoken, nodemailer, node-cron
- Cloudinary for hosted media

## Prerequisites

- Node.js 18+
- PostgreSQL database
- `.env` with DB credentials, JWT secret, session secret, Cloudinary keys, etc.

## Installation

```bash
git clone https://github.com/1CsProjectt/backend-PFE.git
cd backend-PFE
npm install
# configure .env
npm start
```

Default dev script uses **nodemon** on `index.js`.

## API surface (base path `/api/v1`)

| Route prefix | Area |
|--------------|------|
| `/auth` | Login, registration, token handling |
| `/users` | User profiles and administration |
| `/student` | Student-specific operations |
| `/pfe` | PFE project entities |
| `/teams` | Groups / teams |
| `/invitation` | Invitations |
| `/jointeam` | Team join requests |
| `/preflist` | Preference lists |
| `/mettings` | Meetings |
| `/notification` | Notifications |
| `/session` | Academic sessions / events |
| `/autsout` | Soutenance authorization |
| `/soutenances` | Defense records |

**Swagger documentation:** `/api-docs` (after the server starts).

Protected routes use the `protect` middleware and session injection (`injectCurrentSession`) for context-aware handlers.

## Project structure

```
├── Routes/           # Express routers
├── controllers/      # Request handlers
├── models/           # Sequelize models + associations
├── middlewares/      # Auth, uploads, session injection
├── config/           # Database, Swagger
├── utils/            # Errors, Cloudinary helpers
└── index.js          # App entry (HTTP + Socket.IO server)
```

## Deployment note

The codebase includes CORS entries for Render/ngrok-style hosts; set `allowedOrigins` and production secrets in `.env` before deploying.

## License

ISC
