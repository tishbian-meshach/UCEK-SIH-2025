# Repo Overview

- **App**: Next.js (App Router) TypeScript
- **UI**: TailwindCSS + shadcn/ui
- **Data**: Google Sheets via `google-spreadsheet` using service account
- **Auth**: Local (email/regNo + password) stored in Google Sheet

## Key Paths
- **Pages**: `app/` (App Router)
- **Dashboard**: `app/dashboard/page.tsx`
- **Join Team**: `app/join-team/page.tsx`
- **API**: `app/api/**/route.ts`
- **Lib**: `lib/` (sheets.ts, types.ts, utils)

## API Endpoints (selected)
- **Teams**
  - GET `/api/teams` — list teams
  - GET `/api/teams/available` — available teams
  - GET `/api/teams/[teamId]` — team details
  - GET `/api/teams/[teamId]/requests` — list join requests for team
- **Requests**
  - POST `/api/requests` — create join request
  - PUT `/api/requests/[requestId]/accept` — accept join request
  - PUT `/api/requests/[requestId]/reject` — reject join request
- **Students**
  - GET `/api/students` — list
  - GET `/api/students/[regNo]/requests` — request status map

## Library
- `lib/sheets.ts` — all Google Sheets ops
  - `getRequestsForTeam(teamId)`
  - `acceptJoinRequest(requestId)`
  - `rejectJoinRequest(requestId)`
  - `hasStudentRequestedTeam(studentRegNo, teamId)`
  - `getStudentRequestsStatus(studentRegNo)`
- `lib/types.ts` — `Student`, `Team`, `JoinRequest`, etc.

## Environment
- `.env` must include:
  - `GOOGLE_SERVICE_ACCOUNT_EMAIL`
  - `GOOGLE_PRIVATE_KEY` (escaped newlines as `\n`)
  - `SPREADSHEET_ID`

## Scripts
- `dev`: next dev
- `build`: next build
- `start`: next start

## Notes
- Max team size: 6 (leader + up to 5 members) enforced in `acceptJoinRequest`.
- Request status considered pending when `Status` empty or "Pending" and `Accepted?` is not "Yes".