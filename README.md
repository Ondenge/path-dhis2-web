# PATH.ORG WEB Capture — DHIS2 Full-Parity Capture App

A production-grade React app providing full parity with the DHIS2 Capture App, built with Material UI, React Query, and React Router.

## What's included

| Login screen (styled, MUI) |
| Auth + /api/me integration |
| DHIS2 role/authority-based permissions |
| Event programs (WITHOUT_REGISTRATION) |
| Tracker programs (WITH_REGISTRATION) |
| TEI registration + auto-enrollment |
| TEI list (MUI DataGrid, paginated) |
| TEI detail view + attribute display |
| Event capture per program stage |
| Multi-stage program support |
| Dynamic field rendering (all valueTypes) |
| OrgUnit tree (lazy-loading, searchable) |
| Program-filtered org unit selection |
| React Query (caching, invalidation) |
| Proper URL encoding (no Tomcat errors) |
| CORS proxy (no browser CORS errors) |
| Edit existing events |
| Delete TEI / events with confirmation |
| Permission-gated UI (Add/View/Edit/Delete)

---

## Architecture

```
src/
├── api/
│   └── dhis2.js          # All API functions (d2url, d2fetch, TEI, events, enrollments)
├── context/
│   └── AuthContext.js    # Session state + derivePermissions()
├── hooks/
│   └── usePrograms.js    # React Query hooks (programs, TEIs, events, org units)
├── components/
│   ├── DynamicField.jsx  # Universal MUI field renderer for all DHIS2 valueTypes
│   └── OrgUnitTree.jsx   # Lazy-loading hierarchical org unit tree
├── pages/
│   ├── LoginPage.jsx     # Styled login with MUI
│   ├── MainLayout.jsx    # App shell: sidebar, program list, org unit tree
│   ├── TrackerCapturePage.jsx  # TEI list + registration + enrollment + stage events
│   └── EventCapturePage.jsx    # Anonymous event list + new/edit form
└── utils/
    └── programHelpers.js # Metadata utilities, display helpers
```

---

## Setup

### Step 1 — Install Docker Desktop (Windows)

Download and install [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop/), then open **PowerShell** or **Windows Terminal** and create a working directory:

```powershell
mkdir dhis2-local
cd dhis2-local
```

---

### Step 2 — Create configuration files

**Create `dhis.conf`** (DHIS2 database configuration):

```powershell
@"
connection.dialect = org.hibernate.dialect.PostgreSQLDialect
connection.driver_class = org.postgresql.Driver
connection.url = jdbc:postgresql://db/dhis2
connection.username = dhis
connection.password = dhis
connection.pool.size = 5
encryption.password = Sup3rS3cr3t
"@ | Out-File -FilePath "dhis.conf" -Encoding utf8
```

**Create `docker-compose.yml`**:

```powershell
@"
services:
  db:
    image: postgis/postgis:13-3.4-alpine
    environment:
      POSTGRES_USER: dhis
      POSTGRES_DB: dhis2
      POSTGRES_PASSWORD: dhis
    volumes:
      - db-data:/var/lib/postgresql/data
  dhis2:
    image: dhis2/core:2.40.4
    volumes:
      - ./dhis.conf:/opt/dhis2/dhis.conf
    environment:
      JAVA_OPTS: "-Xmx2g"
    ports:
      - "8080:8080"
    depends_on:
      - db
volumes:
  db-data:
"@ | Out-File -FilePath "docker-compose.yml" -Encoding utf8
```

---

### Step 3 — Start DHIS2

```powershell
$env:DHIS2_IMAGE="dhis2/core:2.40.4"
docker compose up
```

Wait 2–3 minutes for DHIS2 to initialise. Once you see `Server startup in` in the logs, open [http://localhost:8080] and log in with the default credentials (`admin` / `district`) to configure your programs, org units, data elements and user roles.

> **Note:** The `db-data` Docker volume persists your database between restarts. To start completely fresh, run `docker compose down -v` to wipe it.

---

### Step 4 — Install and run the app

```powershell
cd path-dhis2-web
npm install
npm start
```

The app opens at [http://localhost:3000].

To target a different DHIS2 instance:

```powershell
$env:REACT_APP_DHIS2_URL="http://localhost:8080"
npm start
```

> All `/api/*` requests are proxied by the React dev server to your DHIS2 instance — no CORS configuration needed. This is handled by `src/setupProxy.js`.

---

### Step 5 — Sign in

Use your own DHIS2 credentials. The app reads your roles and authorities from `/api/me` and shows or hides features accordingly:

| Authority | Unlocks |
|---|---|
| `F_PROGRAM_ENROLLMENT` | Register TEI, submit events |
| `F_VIEW_EVENT_ANALYTICS` | View records list |
| `F_TRACKED_ENTITY_INSTANCE_SEARCH` | TEI list |
| `F_EDIT_MY_DATAVALUES` / `F_EVENT_MAINTENANCE_ALL` | Edit events |
| `F_DELETE_EVENT` / `F_TRACKED_ENTITY_INSTANCE_DELETE` | Delete |
| `ALL` | Everything (super user) |

---

## Supported Field Types

All DHIS2 valueTypes render correctly:

- `TEXT`, `LONG_TEXT`, `EMAIL`, `PHONE_NUMBER` → text inputs
- `NUMBER`, `INTEGER` variants → number inputs
- `DATE`, `DATETIME` → date pickers
- `BOOLEAN` → Yes/No radio buttons
- `TRUE_ONLY` → Checkbox
- Option Sets (≤6 options) → Chip multi-select
- Option Sets (>6 options) → MUI Select dropdown
