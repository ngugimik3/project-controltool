# Project Control Tool

Next.js port of the legacy `legacy/Project_Control_Tool__8_.html` single-file project tracker. It runs on Next.js 16, React 19, Prisma 7, PostgreSQL and Better Auth.

## Features

- Dashboard with KPIs, alerts and a portfolio table.
- Projects with specs, technical parameters and stage gates.
- Site survey visits, checklists and reviews.
- Schedule with dependencies and a Gantt view.
- Procurement purchase orders, waybills and delivery status.
- FAT, installation, commissioning, SAT, training and support checks.
- Attachments per checklist item and support scope (images, PDF, CSV, text, up to 20 MB).
- SAT client sign-off that locks SAT records.
- Handover document tracking.
- Costing with budget, committed, actual, forecast and margin.
- Admin backup/import, user management, categories, task roles and activity log.
- Printable checklists, schedule and costing reports, plus CSV exports.

## Requirements

- Node.js 20+
- PostgreSQL 14+

## Setup

```bash
npm install
```

Create `.env.local`:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/project_control
BETTER_AUTH_SECRET=replace-with-a-long-random-string
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000
# Optional extra origins, comma separated:
# TRUSTED_ORIGINS=https://example.com
```

Apply migrations, generate the client and create the first super admin:

```bash
npx prisma migrate deploy
npx prisma generate
ADMIN_USERNAME=admin ADMIN_PASSWORD=change-me ADMIN_NAME="Super Admin" npm run seed
```

`ADMIN_USERNAME` is read from the environment for the seed script only; add it to `.env.local` if you prefer.

Start the app:

```bash
npm run dev
```

Open http://localhost:3000 and sign in with the seeded account.

## Scripts

- `npm run dev` - development server.
- `npm run build` - production build.
- `npm start` - run the production build.
- `npm run lint` - ESLint.
- `npm run seed` - create the initial super admin from `ADMIN_*` variables.

## Roles

| Capability | User | Admin | Super Admin |
|---|---|---|---|
| View and edit project work | yes | yes | yes |
| Delete tasks, POs, checks, costs, params, visits, attachments | no | yes | yes |
| Pass stage gates | no | yes | yes |
| Admin tab, backup export, activity log | no | yes | yes |
| Manage users, roles and activation | no | no | yes |
| Import backup | no | no | yes |
| Delete projects | no | no | yes |

Deactivated users are signed out and cannot sign back in. The last active super admin cannot be deactivated or demoted.

## Backup and exports

- **Admin > Download backup** exports all projects, checklists, reviews, costs and attachments as JSON.
- **Admin > Import** replaces all project data. Type `REPLACE` to confirm. Only super admins can import.
- Checklist, schedule and costing print views open in a new tab. Use the browser print dialog to save as PDF.
- Schedule and costing pages also provide CSV exports that open in Excel.

## Notes

- Dates are stored as UTC midnight and formatted in UTC to avoid day-shift bugs.
- Uploaded files are stored in PostgreSQL and streamed through authenticated API routes.
- The Gantt period is stored in `Project.extra.gantt`.
- The port specification is in `docs/PORT_SPEC.md`.
