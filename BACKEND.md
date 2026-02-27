# Memory Remix Staging Backend Documentation

## 1. Scope

This document covers only backend components added for admin moderation:

- Supabase database migration and security policies.
- Vercel serverless admin API routes.
- Admin auth/authorization flow.
- API request/response contracts.
- Local and production setup.

Frontend/UI behavior is intentionally out of scope.

## 2. Backend Architecture

### 2.1 Stack

- Runtime: Vercel Serverless Functions (Node.js)
- Data/Auth: Supabase
- DB table: `public.memories`
- Files:
  - `api/_lib/supabaseAdmin.js`
  - `api/_lib/requireAdmin.js`
  - `api/admin/submissions/index.js`
  - `api/admin/submissions/[id].js`
  - `supabase/migrations/20260226_memories_admin_backend.sql`

### 2.2 Auth Model

1. Client authenticates in Supabase Auth (email/password).
2. Client receives `access_token`.
3. Client calls backend API with:
   - `Authorization: Bearer <access_token>`
4. Backend verifies token via Supabase Admin client (`auth.getUser(token)`).
5. Backend checks admin allowlist via `ADMIN_EMAIL_ALLOWLIST`.

If token is valid but email is not allowlisted, API returns `403`.

## 3. Environment Variables

Required for backend:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_EMAIL_ALLOWLIST` (comma-separated emails)

Frontend variables used by browser:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### 3.1 Local `.env.local` example

```env
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>

SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
ADMIN_EMAIL_ALLOWLIST=admin1@example.com,admin2@example.com
```

### 3.2 Note on local runtime behavior

Backend helper includes fallback reading from `.env.local` if runtime env is missing. This is for local debugging resilience when `vercel dev` does not inject expected variables.

Do not rely on this fallback as a production config strategy. In production, set all backend env vars in Vercel project settings.

## 4. Database Model and Migration

Migration file:

- `supabase/migrations/20260226_memories_admin_backend.sql`

### 4.1 Columns added/normalized

Table: `public.memories`

- Added nullable placeholder fields:
  - `new_question_1 text`
  - `new_prompt_text text`
- `status` normalized to enum type `public.memory_status`
  - allowed values: `pending`, `approved`, `rejected`
  - `NOT NULL`
  - default: `pending`

### 4.2 Index

- `memories_status_created_at_idx` on `(status, created_at desc)`

### 4.3 RLS and privileges

Migration enforces strict access:

- Enables and forces RLS on `public.memories`.
- Drops old policies on `public.memories`.
- Creates insert-only policy for `anon` and `authenticated`:
  - insert allowed only when `status = 'pending'`
- Revokes all table privileges for `anon` and `authenticated`, then grants only `INSERT`.

Result:

- Public clients cannot list/read submissions directly from DB.
- Public clients can create pending submissions.
- Admin APIs work with service role key server-side.

## 5. API Endpoints

Base path:

- `/api/admin/submissions`

All endpoints require:

- Header: `Authorization: Bearer <supabase_access_token>`

Response content type:

- `application/json`

### 5.1 List submissions

- Method: `GET`
- Path: `/api/admin/submissions`
- Query params:
  - `status`: `all | pending | approved | rejected` (default `all`)
  - `limit`: `1..200` (default `50`)
  - `offset`: `>=0` (default `0`)

Success `200`:

```json
{
  "data": [
    {
      "id": "uuid",
      "created_at": "2026-02-14T02:37:33.195593+00:00",
      "name": "string|null",
      "email": "string|null",
      "title": "string|null",
      "audio_url": "string|null",
      "status": "pending|approved|rejected",
      "new_question_1": "string|null",
      "new_prompt_text": "string|null"
    }
  ],
  "pagination": {
    "limit": 50,
    "offset": 0,
    "count": 123
  },
  "filter": {
    "status": "all"
  }
}
```

Errors:

- `400` invalid query params
- `401` missing/invalid token
- `403` user not in allowlist
- `405` wrong method (`Allow: GET`)
- `500` server/db error

### 5.2 Get submission by id

- Method: `GET`
- Path: `/api/admin/submissions/:id`
- `id` must be UUID

Success `200`:

```json
{
  "data": {
    "id": "uuid",
    "created_at": "2026-02-14T02:37:33.195593+00:00",
    "name": "string|null",
    "email": "string|null",
    "title": "string|null",
    "audio_url": "string|null",
    "status": "pending|approved|rejected",
    "new_question_1": "string|null",
    "new_prompt_text": "string|null"
  }
}
```

Errors:

- `400` invalid `id`
- `401` unauthorized
- `403` forbidden
- `404` not found
- `405` wrong method (`Allow: GET, PATCH`)
- `500` server/db error

### 5.3 Update moderation status

- Method: `PATCH`
- Path: `/api/admin/submissions/:id`
- Body:

```json
{
  "status": "approved"
}
```

Allowed status values for PATCH:

- `approved`
- `rejected`

Success `200`:

```json
{
  "data": {
    "id": "uuid",
    "created_at": "2026-02-14T02:37:33.195593+00:00",
    "name": "string|null",
    "email": "string|null",
    "title": "string|null",
    "audio_url": "string|null",
    "status": "approved",
    "new_question_1": "string|null",
    "new_prompt_text": "string|null"
  },
  "message": "status_updated"
}
```

Errors:

- `400` invalid id/body/status
- `401` unauthorized
- `403` forbidden
- `404` not found
- `405` wrong method
- `500` server/db error

## 6. Error Codes and Meaning

- `unauthorized`: no bearer token or invalid/expired token.
- `forbidden`: valid token, but email not in `ADMIN_EMAIL_ALLOWLIST`.
- `server_misconfigured`: missing required backend env vars.
- `invalid_query`: bad `status/limit/offset`.
- `invalid_id`: invalid UUID format in route param.
- `invalid_body`: missing JSON body or missing `status`.
- `invalid_status`: `status` is not `approved` or `rejected`.
- `not_found`: submission ID does not exist.
- `db_error`: Supabase query/update failure.
- `method_not_allowed`: unsupported HTTP method.

## 7. Local Testing

### 7.1 Start backend locally

```bash
vercel dev
```

### 7.2 PowerShell examples

```powershell
$token = "<ACCESS_TOKEN>"
$id = "<UUID>"

Invoke-RestMethod -Method GET `
  -Uri "http://localhost:3000/api/admin/submissions?status=all&limit=20&offset=0" `
  -Headers @{ Authorization = "Bearer $token" }

Invoke-RestMethod -Method GET `
  -Uri "http://localhost:3000/api/admin/submissions/$id" `
  -Headers @{ Authorization = "Bearer $token" }

Invoke-RestMethod -Method PATCH `
  -Uri "http://localhost:3000/api/admin/submissions/$id" `
  -Headers @{ Authorization = "Bearer $token"; "Content-Type" = "application/json" } `
  -Body '{"status":"approved"}'
```

### 7.3 Validation checklist

1. Missing token returns `401`.
2. Non-allowlisted user returns `403`.
3. Invalid `status` query returns `400`.
4. Invalid `PATCH` status returns `400`.
5. Unknown ID returns `404`.
6. Public direct DB select on `memories` is blocked by RLS.

## 8. Deployment Notes

1. Set backend env vars in Vercel project.
2. Keep `SUPABASE_SERVICE_ROLE_KEY` server-only.
3. Never expose service role key in browser code or `VITE_*`.
4. If Webflow uses static artifacts from `dist/`, that does not replace backend env setup in Vercel.

## 9. Security Notes

- Service role key has broad DB privileges. Treat as secret.
- Admin access is controlled by both token validity and email allowlist.
- RLS is intentionally strict to prevent public reads.
- API routes are the only supported path for moderation actions.

