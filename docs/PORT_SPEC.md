# Port specification: legacy Project Control Tool → Next.js + PostgreSQL

Source of truth: `legacy/Project_Control_Tool__8_.html` (2,970 lines).

> **Important:** the legacy file contains two generations of the same script. The
> first half is a localStorage/Firestore-era version; later definitions override
> earlier ones. This spec follows the **effective (last-defined)** behaviour:
> `V.projects` (line 1578), `V.schedule` (line 2131 + wrapper at 2504),
> `V.admin` (line 2861), `blockers` (line 1932), `gPDF`/`gXLS` (lines 2188/2281),
> and the asset-store `addAtt` (line 2735). The Claude/Firestore-specific
> sharing code is not portable and is excluded except where noted.

---

## 1. Global shell and navigation

### Header
- Title: `Project control tool`.
- `#meta` for the selected project:
  `{client} · {type} · value {fmt(contract)} · {progress}% complete`
  (`fmt` = `Math.round(n).toLocaleString()`, no currency symbol).
  When none: `No project selected`.
- Project selector `<select id="sel" aria-label="Project">`, options are all
  projects in creation order; no selection is an option when empty (`No projects`).
  Selecting a project sets the current project and redraws. The selection is
  persisted in a **cookie** server-side (legacy kept it in JS state only).
- User badge: `{name} · {ROLE_LABEL[role]}`; click logs out. (In shared mode the
  legacy prevented logout; the port always supports logout.)

### Tabs
Order and labels:

| key | label |
|---|---|
| dashboard | Dashboard |
| projects | Projects |
| survey | Site Survey |
| schedule | Schedule |
| procurement | Procurement |
| fat | FAT |
| install | Installation |
| commis | Commissioning |
| sat | SAT |
| training | Training |
| support | Support |
| handover | Handover |
| costing | Costing |
| admin | Admin |

Admin is hidden from `user`; visible to `admin`/`superadmin`. Admin route/action
must also be enforced server-side.

### Stage rail / gate (above the tab content)
When a project is selected:
- Horizontal rail of the 10 stages. Current stage uses `.cur`; earlier stages
  use `.done`.
- If stage < 9: primary button `Pass gate and move to {next stage}` (admin-only,
  hidden for `user` via `.a`).
- Blocker list `<ul class="err">` appears **after** a failed gate attempt
  (`BL` is in-memory and cleared on project switch). Not shown on initial load.
- On success: stage++, activity log `Gate passed: {project} → {stage}`, toast
  `Moved to {stage}.`.

Stage constants:
`Inception, Site Survey, Procurement, Workshop & FAT, Installation,
Commissioning, SAT, Training, Handover, Closed` (indices 0–9).

### Login
- Username + password, `Sign in to continue`, error
  `Invalid username or password.`
- Port uses Better Auth username login; no `admin/admin123` fallback.
- Deactivated users cannot sign in (`This account is deactivated. Ask an admin.`)
  and an existing session must be rejected by `getCurrentUser`.

### Toast / feedback
Legacy uses a fixed bottom-right toast. Port: inline error/success messages via
server-action results, with the legacy wording where practical. No new console
warnings.

### Global activity log
- Global, not per project. `{ts ISO, userName, action}`.
- Legacy keeps max 300 in localStorage and shows the last 100 reversed.
  Port: `ActivityLog` table, admin tab shows latest 100 desc.
- Actions logged: sign in; project created/deleted; gate passed; task status
  change; PO added; SAT result changes; SAT sign-off; checklist item added;
  attachment added; reviews added; visit status change/planned; imported backup;
  user created; category added; task added; task date/dependency/name/role/owner
  edits (legacy logs “field changed” only for `tk2`), etc. Preserve the exact
  strings listed per action below where given.

### Roles
Legacy helpers:
```js
const can = (...r) => me && r.includes(me.role);
```
CSS hides `.a` from `user`, and `.s` from `user` and `admin`.
Server-side matrix for the port (same as CSS):

| Capability | user | admin | superadmin |
|---|---|---|---|
| View all tabs except Admin | yes | yes | yes |
| View Admin tab | no | yes | yes |
| Create project | yes | yes | yes |
| Edit project metadata (new, see gap) | TBD | TBD | TBD |
| Delete project | no | no | yes |
| Pass stage gate | no | yes | yes |
| Add/edit tasks, POs, checks, costs, params, visits, docs | yes | yes | yes |
| Delete task / PO / check item / cost / param / visit / attachment | no | yes | yes |
| Record results, sign-off, reviews, attachments, visit status | yes | yes | yes |
| Manage users, activate/deactivate, change roles | no | no | yes |
| Add project category / task role (legacy) | yes | yes | yes |
| View activity log / backup | no | yes | yes |

`getCurrentUser` must return `null`/redirect for `active = false`.

---

## 2. Shared business logic

### 2.1 Seed data on project creation
Project fields: `name`, `client`, `type` (from project categories), `contract`
(number). Created stage 0, spec empty, signed empty, empty lists, handover docs
seeded, tasks seeded, checklists seeded. `today()` is the local ISO date.

Default tasks (offset from today in days, duration in days, dependency is 1-based
task index; `null` = parallel):

| # | Task | Role | offset | duration | depends on |
|---|---|---|---|---|---|
| 1 | Approve technical spec | Design Engineer | 0 | 5 | — |
| 2 | Issue purchase orders | Procurement Officer | 2 | 10 | — |
| 3 | Workshop assembly | Workshop Lead | 12 | 15 | #1 |
| 4 | Factory acceptance test | Quality Manager | 27 | 3 | #2 |
| 5 | Site installation | Site Manager | 30 | 10 | #3 |
| 6 | Commissioning and SAT | Commissioning Engineer | 40 | 5 | #4 |
| 7 | Compile handover pack | Project Manager | 45 | 3 | #5 |
| 8 | Site survey and previsit | Site Manager | 0 | 5 | — |

End date = start + duration.

Default handover docs (slot): Supplier certificates, FAT report, SAT report,
As-built drawings, O&M manuals, Warranty terms.

Default checklists:
- `survey` (Site survey, 11): Site access and working hours confirmed; Installation
  location identified and dimensions measured; Power supply available (voltage,
  phase, capacity); Earthing and bonding available; Water supply and drainage (if
  applicable); Environmental conditions (dust, humidity, temperature); Civil works
  and foundations required; Cable routes and containment surveyed; Safety, permits
  and induction requirements; Client contacts and site rules recorded; Photos of
  existing installation taken.
- `fat` (FAT, 6): Visual and mechanical inspection; Insulation resistance (MΩ);
  Earth continuity (Ω); I/O point check; Protection tests; Functional test.
- `install` (Installation, 7): Site survey and access confirmed; Equipment
  delivered and positioned; Mechanical installation and anchoring; Cable
  containment and glanding; Power and signal cabling terminated; Earthing and
  bonding installed; Labelling and as-built markup.
- `commis` (Commissioning, 7): Pre-commissioning checks (insulation, continuity);
  Power-up and supply verification; Instrument calibration and loop checks; I/O
  and interlock testing; Control sequence and alarm testing; Performance run and
  readings recorded; Punch list recorded and agreed.
- `sat` (SAT, 6): Mechanical installation verified; Power-up and wiring check;
  Field I/O check; Commissioning tests; Performance readings; Operator training.
- `training` (Training, 5): Operator training; Maintenance staff training; Safety
  briefing; O&M manual walkthrough; Training attendance register signed.
- `tools` (Tools, 4): Special tools supplied; Calibration tools and certificates;
  Lifting and rigging gear; Spare keys and access cards.
- `parts` (Service parts, 4): Recommended spares list issued; Consumables on site
  (fuses, filters, seals); Critical spares on site; Spares labelled and stored.
- `warranty` (Warranty support, 5): Warranty terms issued to client; Warranty
  start date recorded; Service contacts and escalation list; First service visit
  scheduled; Remote support access agreed.

Labels `CL`: `fat=FAT, sat=SAT, training=Training, tools=Tools,
parts=Service parts, warranty=Warranty support, install=Installation,
commis=Commissioning, survey=Site survey`.

### 2.2 Checklist item semantics
- Test kinds: `fat`, `sat`. Non-test kinds: survey, install, commis, training,
  tools, parts, warranty.
- Test kinds record `result` `Pass`/`Fail`; non-test kinds record `Pass`
  displayed as **Done** or `NA` displayed as **N/A**.
- `isOk(item)`:
  - `install`/`commis`: `status === 3` (Done); `result` is irrelevant.
  - all others: `result === "Pass" || (result === "NA" && kind not in [fat,sat])`.
- `CheckItem.status` is used only by install/commis; checklist items keep 0.
- Checklist item comments are free text (`note`).
- Per-item photos use attachment scope/checkItem relation (see 2.7).

### 2.3 Stage gate blockers (effective version)
Gate fails and lists every blocker; stage unchanged. Exact messages:

- **Inception (0)**
  - if any of `specDim`, `specVolt`, `specKw` empty:
    `Complete dimensions, voltage and power in the technical spec.`
  - find first task whose name lowercased starts with `approve`; if it exists and
    status != Done: `Mark “{task name}” as Done.`
- **Site Survey (1)**
  - no visit with status exactly `Done`:
    `Log at least one completed previsit or site survey visit.`
  - each not-ok survey check: `{n} site survey item(s) not done.`
- **Procurement (2)**
  - no POs: `No purchase orders raised.`
  - each PO not received (status < 7): `{n} purchase order(s) not yet received.`
- **Workshop & FAT (3)**
  - each not-ok FAT check: `{n} FAT item(s) not done.`
- **Installation (4)**
  - each not-done install step: `{n} installation step(s) not done.`
- **Commissioning (5)**
  - each not-done commis step: `{n} commissioning step(s) not done.`
- **SAT (6)**
  - each not-ok SAT check: `{n} SAT item(s) not done.`
  - no sign-off: `Client SAT sign-off is missing.`
- **Training (7)**
  - each not-ok training check: `{n} training item(s) not done.`
- **Handover (8)**
  - each doc not ready: `{n} handover document(s) not ready.`
- **Closed (9)**: no gate button.

### 2.4 Progress
```
stageFrac(project):
  s = stage
  if s == 0:  (((specDim && specVolt && specKw) ? 1 : 0) + (approveTaskDone ? 1 : 0)) / 2
  if s == 2:  receivedPOs / totalPOs            (0 if none)
  if s == 8:  readyDocs / totalDocs             (0 if none)
  if s >= 9:  0
  kind = ["", "survey", "", "fat", "install", "commis", "sat", "training"][s]
  checks = checklist(kind)
  numerator = okChecks + (s == 6 && signed ? 1 : 0)
  denominator = totalChecks + (s == 6 ? 1 : 0)
  return denominator ? numerator / denominator : 0

progress = stage >= 9 ? 100 : round(((stage + stageFrac) / 9) * 100)
averageProgress = round(avg(progress) for projects with stage < 9)
```
Degenerate empty denominators count as 0.

### 2.5 Finance
```
budget    = sum(costLines.budget)
actual    = sum(costLines.actual)
committed = sum(PO.cost where PO.status > 0)   // any status beyond Draft
forecast  = max(budget, actual, committed)
margin    = project.contract - forecast
margin%   = contract ? (margin / contract) * 100 : 0
```
Displayed with `Math.round(...).toLocaleString()`, margin % with 1 decimal.
Margin value red when negative (forecast > contract).

### 2.6 Alerts
For selected project:
- Each task with `status != 3` and `endDate < today`:
  `Overdue: {name}. Notify {role}.`
- Each PO with `status < 7` and `promisedBy > needBy`:
  `Slipping: {item} from {supplier} is promised {promised}, needed {need}.`
- If none: `Nothing overdue or slipping.`

Dashboard aggregates overdue tasks and slipping POs across all projects.

### 2.7 Attachments
- Scopes used by the legacy UI: `projects`, `schedule`, `procurement`,
  `handover`, `fat`, `sat`, `training`, `survey`, `install`, `commis`, `support`,
  plus per-item photos keyed by check item.
- Legacy card: title `Documents and photos`; buttons `Add files`, `Take photo`;
  text `Files are shared with everyone who has this page: images, PDF, CSV or text,
  up to 20 MB.`; empty `Nothing attached yet.`; image thumbnail 120×90; file name
  below; `Open` for non-images; `Remove` (admin-only via `.a`).
- Per-item photos: 56×42 thumbnail, `×` remove (admin-only), `Add photo`.
- Accepted: `image/*` or `.pdf,.csv,.txt,.md,.json`; capture-environment for
  `Take photo`.
- Images are shrunk client-side (asset-store version: max 1600 px, JPEG quality
  0.8). Port should keep client-side shrink and enforce 20 MB per file server-side.
- Storage: `Attachment.data` bytes in PostgreSQL (legacy data URL / asset URL).
  `uploadedBy` is stored but not displayed.
- Deleting a checklist item also deletes its item photos (cascade via
  `checkItemId`).
- Add allowed to all roles; remove admin+superadmin only.

### 2.8 Reviews
- Review record: version (`v1`, `v2`, …), date (ISO), author display name,
  status (Not started / In progress / Blocked / Done), text.
- Checklist-item reviews belong to the item; stage reviews belong to a stage key.
- Add requires non-empty text. Version = existing count + 1.
- Display newest first, with badges `v{n}` and status; summary shows count and
  latest version preview.
- Stage review keys used: `survey`, `install`, `commis`. Checklist-item reviews
  are used for installation and commissioning steps.
- Activity log: `{project}: review v{n} added`.

### 2.9 Task status interaction
`nxt(task)` cycles `(status + 1) % 4`. Before moving from 3 → 0 or to 1:
- If next status is `In progress (1)` and the task has a dependency whose status
  is not Done: abort with `Waiting on “{dependency}”.`
- Otherwise set status, log `{project}: {task} → {status}`, toast on gate only.
- Status button label is the current status.
- Waiting warning shown when dependency exists and is not Done.
- Overdue warning shown when status != Done and endDate < today.
- Deleting a task clears `dependsOnId` on its dependents (schema SetNull).
- Dependency choices exclude the task itself and any task that (transitively)
  depends on it, preventing cycles. Option 0 = `Runs in parallel (no dependency)`;
  others `After: {name}`.

### 2.10 Purchases
- Status labels: Draft, Approved, Sent, Confirmed, In production, Shipped,
  In transit, Received, Inspected (0–8).
- `received` means status >= 7.
- Slipping when status < 7 and promisedBy > needBy.
- Waybill is a free text inline field (label “Waybill / ETA”).
- New PO requires every field non-empty in the legacy UI; server validates
  required strings, dates and cost >= 0.
- Legacy allows only waybill and status edits after creation; no other PO editing.

### 2.11 SAT sign-off
- Input: client representative and role; required.
- Saves `signedBy`; `signedAt` recorded (legacy en-GB locale string; schema
  DateTime).
- After signing, SAT checklist inputs/result buttons are disabled, new SAT items
  are rejected, and result/res changes are rejected
  (`SAT is signed off and locked.`). General comments remain editable in legacy.
- Display: `Signed by {name} on {signedAt}. This record is locked.`
- Log: `SAT signed off: {project} by {name}`.
- Gate requires sign-off plus all SAT items ok.

### 2.12 FAT failure rework
- Recording `Fail` on a FAT item creates a task exactly once:
  name `Rework: {item}`, role `Workshop Lead`, owner blank, start today, end
  today+3, no dependency, status Not started.
- Log: `{project}: FAT {item} → {result}`.

### 2.13 Other validation and strings
- Project create: name, client and project value required; toast
  `Name, client and project value are required.` Type select defaults from
  categories.
- Category add: required `Type the category name first.`; duplicate
  case-insensitive `That category already exists.`; log `Added category {name}`.
- Role add: required `Type the role name first.`; duplicate
  `That role already exists.`
- Task add: name, start, end required
  `Task name, start and end dates are required.`; end before start
  `The end date cannot be before the start date.`
- Task date edit: empty date ignored (redraw); end < start rejected with same
  toast.
- Gantt period: To <= From rejected with `The To date must be after the From date.`
- Cost line: code required `Enter a cost code.`; budget/actual default 0.
- Check item: text required `Type the new item first.`; SAT locked.
- Review: text required `Write the review or status update first.`
- Visit: date required `Enter the visit date.`; log planned and status changes.
- PO: all fields required `Fill in every purchase order field.`
- Sign-off: name required `Enter the client representative.`
- User: name, username, password required
  `Name, username and password are required.`; duplicate
  `Username already exists.`; cannot delete own account
  `You cannot delete your own account.`
- Project delete: confirm, superadmin only.
- Task delete: confirm, admin+superadmin only.
- All other deletes: no confirm in legacy.

---

## 3. Tab-by-tab specification

### 3.1 Dashboard
Shown to everyone; always available even without a project.

KPI grid:
1. **Active projects** — count of projects with stage < 9.
2. **Average progress** — `avgP()%` over active projects.
3. **Overdue tasks** — count across all projects.
4. **Slipping purchase orders** — count across all projects.
5. **Margin, all projects (forecast)** — `Σ(contract - forecast)` formatted.

Cards:
- `Alerts for {project}` (only when a project is selected): alert lines or
  `Nothing overdue or slipping.`
- `All projects`: project table:
  - Project, Client, Stage badge (`ba`), Progress bar + `{n}%`,
    Tasks done `{done}/{total}`, Project Value right-aligned, actions.
  - `Open` selects that project and navigates to Schedule.
  - `Delete` (superadmin only, `.s`).
  - Empty: `No projects yet. Create one on the Projects tab.`

No exports.

### 3.2 Projects
Shown to everyone.

1. **New project** card:
   - Name (placeholder `Project name`)
   - Client (`Client`)
   - Category select (`Category`, from project-type settings)
   - Contract value (`Project value`, number min 0)
   - Button `Create project`.
   - On success seed tasks/checklists/handover docs; log
     `Created project {name}`; toast
     `Project created with tasks, checklists and handover list.`
2. **Project categories** card:
   - Existing categories as `.badge.bn`.
   - Input `New category, e.g. Solar PV system` + `Add category`.
   - Persist to `Setting` (`projectTypes`), legacy `pm:t`.
3. **Technical spec: {project}** (selected project only):
   - Subtitle: `Dimensions, voltage and power are required to pass the
     Inception gate.`
   - Fields: Structural dimensions, Voltage and phase, Power (kW), Standards
     required; Notes textarea.
   - **Additional parameters and features** table: Group (7 groups), Parameter,
     Value, Unit, Del (admin). Add row: group select, parameter (datalist of 18
     suggestions), value, unit, `Add parameter`.
   - Groups: Structural; Electrical; Control and instrumentation; Mechanical and
     process; Environmental; Features; Other.
   - Suggestions: Enclosure rating (IP); Weight (kg); Material; Supply frequency
     (Hz); Rated current (A); Fault level (kA); Earthing system; PLC make and
     model; HMI; Communication protocols; I/O count; Ambient temperature range;
     Flow rate; Pump head; Motor rating; Cable entry; Colour and finish;
     Certification.
   - Empty params: `No additional parameters yet.`
4. **All projects** card (same table as Dashboard).
5. **Documents and photos** attachments scoped `projects`.

No export.

**Gap:** legacy has no project metadata edit UI. Task step 2 asks for edit.
Proposed: add an `Edit project` card/section (name, client, category, contract)
with the same confirmation and permissions as create. Permission decision needed
(see section 6).

### 3.3 Site Survey
Requires a project (`Create or select a project first.` otherwise).

1. **Previsits and site visits** table, sorted by date ascending:
   - Date (date input, inline save)
   - Type: Previsit / Site survey / Revisit
   - Attendees (free text)
   - Purpose (free text)
   - Status: Planned / Done / Cancelled
   - Findings (free text → `notes`)
   - Del (admin, no confirm)
   - Empty: `No visits logged yet.`
   - Status change logs `{project}: {type} on {date} marked {status}`.
2. **Plan a visit** card: Date (required), Type, Attendees (`Names and roles`),
   Purpose (`What must be checked or measured`); button `Add visit`.
   Log `{project}: {type} planned for {date}`.
3. Sub text: `Pass this stage by logging at least one completed visit and
   finishing the survey checklist.`
4. **Site survey checklist** (`chk2('survey')`):
   - Heading `Site survey checklist: {ok} of {n} complete`.
   - Table: Item inline editable; Detail inline; Result buttons **Done** and
     **N/A**; Comment inline + per-item photo strip; Del (admin).
   - Add item input `Add a new item`, `Add item`.
   - `Print Site survey`.
   - General comments textarea (saved to Note key `survey`).
   - Documents and photos scoped `survey`.
   - Non-test `isOk`: Pass or N/A.
5. **Survey reviews and status updates** card: review list + form; key `survey`;
   form status defaults In progress.

Print (`Print Site survey`) prepends:
`Site survey and previsit report`, `Visits` table (date, type, attendees,
purpose, status, findings; or `No visits logged.`), then the checklist print.

### 3.4 Schedule
Requires a project.

Top action row:
- `Download PDF`
- `Download Excel`
- `Print view`
- `Copy for Excel`
- Sub text: `Exports follow the period set below. Excel marks active periods with
  a block.`

1. **Gantt period** card:
   - From (blank fits tasks)
   - To
   - Scale: Days / Weeks / Months
   - `Fit to tasks`
   - Stored per project (`gv`: unit default `week`, from/to blank = task bounds).
   - Validation as in 2.13.
2. Gantt table:
   - Task name inline editable + dependency select immediately below.
   - Waiting / Overdue warnings in the task cell.
   - Role inline editable with datalist of roles.
   - Owner inline editable (`Assign person`).
   - Start / End date inputs.
   - Status button cycles status.
   - Timeline bar (`.gt i.s{status}`) clipped to period; tooltip
     `{start} to {end}`.
   - Del (admin, confirm `Delete this task?`).
3. **Add task** card: Task name, Role (datalist), Owner, Start, End,
   Depends on (same options, default parallel); `Add task`.
4. **Roles** card: role badges; input `New role, e.g. Electrician` +
   `Add role`; sub: `Roles added here appear as suggestions on every task. You can
   also type any role directly on a task.`
5. **Documents and photos** attachments scoped `schedule`.

Timeline scale labels:
- month: `toLocaleString('en-GB',{month:'short',year:'2-digit'})`.
- day/week: `MM-DD` labels at day/week intervals; day scale thins labels if >45.
- More than 400 period columns in Excel/TSV: error
  `That period has too many columns. Use a coarser scale or a shorter range.`

Exports detailed in section 4.

### 3.5 Procurement
Requires a project.

1. **New purchase order** card:
   - Component (`Component`)
   - Supplier (`Supplier`)
   - Need by (date)
   - Promised (date)
   - Cost (number min 0)
   - `Add purchase order`
   - Log `PO added: {item}`.
2. PO table:
   - Item, Supplier, Need by, Promised (red `.warn` when slipping), Waybill / ETA
     inline text, Cost right-aligned, Status select, Del (admin, no confirm).
   - Status selection saves immediately and redraws.
   - Empty row: `No purchase orders yet.`
3. **Documents and photos** attachments scoped `procurement`.

No export.

### 3.6 FAT
Requires a project. Uses `chk2('fat')`.

- KPI: `FAT items passed` `{passCount} of {n}`; `Failed` `{failCount}`.
- Table: Item, Reading, Result (Pass/Fail), Comment + per-item photos, Del
  (admin).
- `Add a new item` + `Add item`; `Print FAT`.
- Note: `A failed FAT item creates a rework task on the Schedule tab.`
- General comments (Note key `fat`).
- Documents and photos scoped `fat`.
- No stage reviews.
- Gate requires every FAT item result Pass (NA is not ok for FAT).

### 3.7 Installation
Requires a project. Uses `stp('install')`.

- Heading `Installation: {ok} of {n} steps done`.
- Sub: `Every step must be Done to pass this stage gate.`
- Table: Step name inline editable; Status select (TS); expandable
  `Reviews and status updates` with item review list + form; per-item photos;
  Del (admin).
- Add step input `Add a new step` + `Add step`; `Print Installation`.
- **Stage reviews and status updates** card, key `install`; default status from
  latest review or In progress.
- **Documents and photos** scoped `install`.
- Gate requires every step status Done; result is irrelevant.

### 3.8 Commissioning
Same as Installation with kind `commis`; text `Commissioning: {ok} of {n} steps
done`; stage review key `commis`; attachments scope `commis`.

### 3.9 SAT
Requires a project. Uses `chk2('sat')`.

- Same structure as FAT, with KPI `SAT items passed`, `Failed`, Pass/Fail buttons.
- **Client sign-off** card:
  - Unsigned: input `Client representative and role`, button
    `Record sign-off`.
  - Signed: `Signed by {name} on {signedAt}. This record is locked.`
- When signed: all item/reading/comment/result controls and per-item photo add
  are disabled; add-item is rejected; Del for items? Legacy `delC` is not disabled
  by sign-off (its button has `.a` but no `dis`); this is a legacy inconsistency.
  Port proposal: **lock all SAT edits including delete after sign-off** (state in
  decisions).
- General comments not locked in legacy; proposal keep editable or lock? See
  decisions.
- `Print SAT`.
- Attachments scoped `sat`.
- Gate requires all SAT items ok plus sign-off.

### 3.10 Training
Requires a project. Uses `chk2('training')`.

- Non-test checklist: Done / N/A, reading column labelled Detail, comments,
  per-item photos, add item, `Print Training`, general comments (Note `training`).
- Attachments scoped `training`.
- Gate requires every training item `isOk` (Pass or NA).

### 3.11 Support
Requires a project. Three non-test checklists, each rendered like `chk2(k, na=1)`
(no per-section attachment card):
- `tools` — Tools
- `parts` — Service parts
- `warranty` — Warranty support
Each has its own heading, KPI, table, add item, print, general comments.
After the three sections: **Documents and photos** scoped `support`.
Gate: not stage-gated; Support items never block a gate.

### 3.12 Handover
Requires a project.

- KPI `Documents ready` `{ready} of {n}`.
- Rows: slot name, reference input (`File link or reference`), toggle button
  `Ready` (ok) / `Mark ready`.
  - Clicking writes the current reference and toggles ready.
- Empty docs: not possible after project creation (6 seeded), but handle empty
  state.
- Attachments scoped `handover`.
- Gate requires all docs ready.

### 3.13 Costing
Requires a project.

KPI grid:
- Project value
- Budget
- Committed (POs)
- Actual
- Forecast
- Margin (red if negative, secondary line `{pct}%`)

Sub: `Forecast is the highest of budget, committed and actual.`

Cost line table: Cost code, Budget (right), Actual (right), Del (admin). Empty:
`No cost lines yet.`

Add card: Cost code (`Cost code, e.g. Materials`), Budget, Actual, `Add cost
line`. Code required; budget/actual default 0.

No export and no stage gate.

### 3.14 Admin
Admin tab: `admin` and `superadmin` only. Legacy final version shows Backup and
Activity log; an earlier version also had Users. Task requires Users CRUD,
activation, role changes, activity log and settings.

1. **Users** (superadmin only; new in port, based on legacy earlier version):
   - List: name (`@username`), role badge, active state.
   - Create: full name, username, password (autocomplete new-password), role
     select User/Admin/Super Admin; `Add user` via `createUserRecord`.
   - Validation from `lib/users.ts`: username 3–30 `[a-z0-9_.]`, password >= 8,
     unique username.
   - Activate/deactivate (not self; not last active superadmin).
   - Change role (not own last superadmin demotion).
   - Delete (not own account). Prefer deactivate over delete.
2. **Settings** (admin+superadmin):
   - Project types (legacy `TY` / `pm:t`, `Setting.projectTypes`).
   - Task roles (legacy `RR` / `pm:r`, `Setting.taskRoles`).
   - Legacy category/role add controls also live on Projects/Schedule and are
     available to all roles. Keep or move? See decisions.
3. **Activity log**: latest 100, newest first; Time (en-GB), User, Action; empty
   `No activity yet.`
4. **Backup** (legacy final):
   - Textarea + `Export to text` (JSON of all projects) + `Import from text`.
   - Import validates JSON array and creates projects; legacy in DB mode appends
     copies with new IDs.
   - Port proposal: export all projects as JSON (superadmin/admin); import
     superadmin-only with confirmation, zod validation, and new IDs. Could defer
     import. See decisions.
5. **Sharing and access** and **Import from this browser** cards are Claude-era
   and are intentionally not ported.

---

## 4. Exports and print

### 4.1 Schedule PDF (`Download PDF`)
- jsPDF, landscape A4, unit pt. Uses current Gantt period (`gwin`) and scale.
- Title `Project schedule: {name}`.
- Meta: `{client} | {type} | Stage: {stage} | Period {from} to {to}
  ({unit}s) | Printed {en-GB date}`.
- Period grid lines and labels; per task: name (truncated), role/owner/start/end/
  dependency line, bar colored by task status
  (`#777`, `#185fa5`, `#b3261e`, `#2e7d4f`); page break after y > 540; legend.
- Non-ASCII sanitisation: Ω → `ohm`, drop chars >= 256.
- Port uses installed `jspdf` (no CDN); wrapped in try/catch with error toast;
  fallback to print view if download unavailable.

### 4.2 Schedule Excel (`Download Excel`)
- xlsx workbook, sheet `Gantt`.
- Rows: title, meta, blank, header.
- Header: Task, Role, Owner, Status, Start, End, Depends on, then one column per
  period ({day/week/month} labels).
- Each cell contains `█` when the task overlaps the period.
- Column widths: 32,22,16,12,11,11,28, then 6 (8 for months).
- More than 400 period columns rejected.
- File name `Schedule-{name with non-alphanumerics replaced by '-'}`.
- Port uses installed `xlsx` client-side.

### 4.3 Schedule Print view (`Print view`)
- Hidden `#pr` region (print CSS already in globals) with title, project meta,
  period, an inline SVG Gantt, then a table: Task, Role, Owner, Start, End, Status,
  Depends on. Calls `window.print()`.

### 4.4 Copy for Excel
- TSV with same columns as Excel; active periods use `X`; tabs in values replaced
  by spaces; copies to clipboard; fallback textarea + `execCommand('copy')`.
- >400 periods rejected.
- Toast: `The schedule is selected and copied. Paste it into Excel with Ctrl+V.`

### 4.5 Checklist print (`Print {label}`)
For survey, fat, install, commis, sat, training, tools, parts, warranty:
- Standard checklist report:
  - Title `{Label} checklist` (survey: `Site survey and previsit report` with a
    visits table prepended).
  - Meta: `{name} · {client} · {type}` and `Printed {en-GB datetime}`.
  - Table: Item; Reading (test) or Detail (non-test); Result
    (`Pass`/`Done`, `Fail`, `N/A`, or `Pending`); Comment + per-item images.
  - Approx. 110 px item images and then full photos.
  - `Comments` section when general comments exist.
  - SAT sign-off line when signed.
  - `Photos` section for image attachments; `Documents: names` for non-images.
  - Signature line:
    `Prepared by: ______________ Date: ________   Client: ______________ Date: ________`
- Installation/Commissioning print:
  - Title `{Label}`; meta as above.
  - Table Step / Status / Reviews and status updates, with review lines
    `v{n}, {date}, {author}, {status}: {text}` and item images.
  - `Stage reviews` section when present.
  - Photos from stage attachments.
  - Signature line.
- Triggers browser print; toast
  `Opening the print dialog. If nothing opens, press Ctrl+P.`
- Port can build a server-rendered print page or a client print component. No
  PDF library needed for checklists (legacy used `window.print`).

No exports on Dashboard, Projects, Procurement, Handover, Costing, Admin (except
backup text).

---

## 5. Legacy storage → schema mapping

### 5.1 localStorage keys
| Key | Contents | Port |
|---|---|---|
| `pm:p` | all projects with nested arrays (`tasks`, `pos`, `checks`, `docs`, `costs`, `params`, `visits`, `att`, `rev`, `notes`, `spec`, `gv`) | normalized tables |
| `pm:u` | users `{id,name,username,role,pw}` | Better Auth `User` + `Account`; roles; active |
| `pm:l` | activity log max 300 | `ActivityLog` |
| `pm:s` | signed-in user id | Better Auth session cookie |
| `pm:t` | project categories | `Setting['projectTypes']` |
| `pm:r` | custom task roles | `Setting['taskRoles']` |

In-memory only: current project (`cur`), active tab (`tab`), current user (`me`),
blocker list (`BL`), open review `<details>` map (`OPEN`), gantt period (legacy
per project `gv`, not localStorage globally). Port: tab = route; project = cookie;
blockers = action result; open state = client component; gantt = `Project.extra`.

### 5.2 Model mapping
| Legacy object/field | Schema |
|---|---|
| project `{name,client,type,contract,stage}` | `Project` same fields |
| `spec.{dim,volt,kw,std,notes}` | `specDim`, `specVolt`, `specKw`, `specStd`, `specNotes` |
| `signed`, `signedAt` | `signedBy`, `signedAt` |
| `gv.{unit,from,to}` | `Project.extra` JSON (`gantt`) |
| `tasks[] {name,role,owner,start,end,dep,st}` | `Task` (`startDate`, `endDate`, `status`, `dependsOnId`) |
| `pos[] {item,sup,need,prom,cost,st,way}` | `PurchaseOrder` |
| `checks[] {kind,item,reading,res,note,s}` | `CheckItem` (`result`, `status`) |
| check `revs[] {v,date,by,status,text}` | `CheckItemReview` |
| `rev[k][]` stage reviews | `StageReview` (`key`) |
| `docs[] {slot,ref,ready}` | `HandoverDoc` |
| `costs[] {code,bud,act}` | `CostLine` |
| `params[] {g,n,v,u}` | `Param` (`groupName`) |
| `visits[]` | `SiteVisit` |
| `att[] {st,name,img,data,by}` | `Attachment` (`scope`, `isImage`, `data`, `uploadedBy`); item photos also set `checkItemId` |
| `notes[k]` | `Note` (`key`) |
| `TY`, `RR` | `Setting` |
| `L[]` | `ActivityLog` |

---

## 6. Schema gaps, mismatches and proposed changes

No blocking schema gap prevents the port. Items requiring a decision:

1. **Project metadata edit** (task requires; legacy does not have it).
   Fields already exist. Proposal: add edit UI/action. Permission TBD.
2. **Gantt period** has no columns. Proposal: store in existing
   `Project.extra.gantt = {unit:'week'|'day'|'month', from:'YYYY-MM-DD', to:''}`
   via a typed helper. No migration.
3. **Uniqueness for versions/order**:
   - `CheckItemReview` should have `@@unique([checkItemId, version])`.
   - `StageReview` should have `@@unique([projectId, key, version])`.
   - `HandoverDoc` should have `@@unique([projectId, slot])`.
   Proposal: one migration adding these constraints (empty/new data, safe).
4. **ActivityLog** has no `userId`/`projectId`. Legacy log is global, so this is
   acceptable. Optional future: add `userId String?` and `projectId String?` for
   filtering; not needed for parity. Proposal: no change now.
5. **Money precision**: `Project.contract`, `PurchaseOrder.cost`,
   `CostLine.budget/actual` are `Float`; legacy used JS numbers. Proposal: keep
   Float for parity (display rounded), or add a later Decimal migration if
   accounting precision is required. No change now.
6. **Attachment storage**: schema stores `Bytes` in PostgreSQL, while legacy
   stored data URLs / asset URLs. Port can store bytes and serve download route
   handlers. Need a body-size strategy (route handler upload, client-side image
   shrink) to honor the 20 MB legacy wording. No schema change.
7. **Attachment legacy `st` is a string scope**. Schema has `scope` + optional
   `checkItemId`; use `scope='item'` + `checkItemId` for per-item photos, or
   `scope=<kind>` for tab attachments. No schema change.
8. **No per-project authorization**. Legacy roles are global. Port keeps global
   roles. No schema change.
9. **Legacy duplicate Admin implementations**: final Admin has no Users; earlier
   has Users. Task explicitly requires Users. Port will include Users.
10. **Backup import** could create large/duplicate data. Proposal: export JSON
    for admins; import superadmin-only with confirmation and zod validation.
11. **Settings add-category/add-role permissions**: legacy lets all signed-in
    users add categories (Projects tab) and roles (Schedule tab) even though the
    Admin tab is restricted. Port proposal: preserve those add controls for all
    roles and add management/removal in Admin for admins. Alternative: move all
    category/role management to Admin. Decision needed.
12. **SAT lock scope**: legacy disables inputs/results but not item delete or
    general comments. Port proposal: lock all SAT checklist mutations (including
    delete and per-item attachments) after sign-off; keep general comments
    editable. Decision needed.
13. **Project delete role** is superadmin only (`.s`); task step 2 says
    create/edit/delete. Keep superadmin delete.
14. **Deactivated users**: `active` exists; code must enforce it in
    `getCurrentUser` (step 10), not only login.

---

## 7. Port order and verification gates
Per the task: foundation → projects → dashboard → survey → schedule →
procurement → FAT/install/commis/SAT/training/support → handover → costing →
admin → exports → responsive/looks.

Every step:
- `npx tsc --noEmit`
- `npm run lint`
- manual test in the running app
- git commit with a clear message

All writes: server actions, `requireUser(...)`, role checks, zod validation,
`{ error }` returns, `revalidatePath`.
`proxy.ts` remains a cookie-only gate.
