# PC Migration README — PC-MIGRATION-001

Prepared on the laptop on 2026-09-23. These are the steps for the **new PC**. Nothing in this
file has been run on the PC yet. **This file contains no secret values.**

Goal: the PC restores the project and picks up **from exactly the same state as the laptop**.
That means the same code, including uncommitted work, the same `.env` files and the same
release database.

```
laptop project folder ──copy──▶ PC  ──▶ MongoDB 8.3 (rs0) ──▶ mongorestore ──▶ npm ci ──▶ npm run dev
```

---

## A. Copy the project folder

Copy the **whole** project root folder by hand, for example with a USB drive or an external disk:

```
Social Engineering Fraud Training PDS\
├── .git\              ← keep it: history, plus the working tree has MANY uncommitted changes
├── .claude\           ← launch.json for the preview servers
├── backend\           ← includes backend\.env (gitignored, required)
├── frontend\          ← includes frontend\.env (gitignored, required)
├── docs\
├── migration-backup\  ← this folder: DB archive, checksum, manifest, verifier
└── …
```

- **Copy the folder. Do not `git clone`.** The laptop's working tree has a large set of
  modified and untracked files that are **not committed**. Examples are
  `backend/data/learner-actions/v1/sms.json`, the SMS and Email E21–E25 tests and research docs,
  and `backend/scripts/release/`. A clone would lose all of them.
- Make sure the dot-files come across. Windows Explorer copies them, but check on the PC that
  these exist: `backend\.env`, `frontend\.env`, `frontend\.env.verify`, `.claude\launch.json`,
  `.git\`.
- `backend\node_modules` (≈12 MB) and `frontend\node_modules` (≈145 MB) are optional. The PC
  reinstalls them either way (§F/G), so you can leave them out to make the copy faster.
  `frontend\dist` is a build output and is not needed.
- The target path on the PC can be anything, and spaces are fine. The application has **no
  absolute paths**: every file it reads or writes is resolved relative to its own source
  location.

## B. Required software on the PC

These are the versions actually in use on the laptop. Match them.

| Software | Laptop version | Required on PC | Notes |
|---|---|---|---|
| Node.js | **v24.15.0** (via nvm-windows 2.0.0) | Node 24.x. Use 24.15.0 to match exactly | There is no `.nvmrc` or `engines` field. nvm is a convenience only, and a plain Node 24 installer works too. |
| npm | **11.12.1** (bundled with Node 24.15.0) | npm 11.x | Comes with Node |
| MongoDB Server | **8.3.8** (Community, Windows service "MongoDB") | **8.3.x** | The backup was made from FCV 8.3. Use the same minor version so the restore behaves identically. |
| MongoDB Database Tools | **100.18.0** (`mongodump`/`mongorestore`) | 100.18.0 or newer | Needed for the restore. Add `…\MongoDB\Tools\100\bin` to PATH. |
| mongosh | **2.10.0** | 2.x | Needed for `rs.initiate` and the verification script |
| Git | 2.47.1 | Optional | Only for continuing version control. The app does not need it to run. |

The OS is Windows 11 x64. If the PC is also Windows x64, the frontend's native build
dependencies (Vite, Rolldown, Tailwind oxide, lightningcss) will match. Even so, run `npm ci`
fresh on the PC (§F/G).

## C. MongoDB setup on the PC

The backend requires a **replica set**, because transactions are used; a standalone `mongod`
is refused. Target topology, the same as the laptop:

| Setting | Value |
|---|---|
| Port | `27017` |
| bindIp | `127.0.0.1` (loopback only) |
| Replica set name | `rs0` |
| Member host | `127.0.0.1:27017`, pinned to the IP. **Do not** use the PC's hostname. |

1. Install MongoDB Server 8.3.x as a Windows service.
2. Edit its `mongod.cfg` (in the install `bin\` folder) so that it contains:
   ```yaml
   net:
     port: 27017
     bindIp: 127.0.0.1
   replication:
     replSetName: rs0
   ```
   The dbPath and log path are whatever the PC installer chose. The laptop uses
   `C:/MongoDB/data` and `C:/MongoDB/log/mongod.log`, but those are **not** required on the PC.
3. Restart the MongoDB service, then initiate the set **once**:
   ```powershell
   mongosh --host 127.0.0.1 --port 27017 --eval 'rs.initiate({_id:"rs0",members:[{_id:0,host:"127.0.0.1:27017"}]})'
   mongosh "mongodb://127.0.0.1:27017/?replicaSet=rs0" --eval "rs.status().members.map(m=>m.name+' '+m.stateStr)"
   ```
   Wait until the output shows `127.0.0.1:27017 PRIMARY`. `docs/LOCAL_MONGODB_REPLICA_SET.md`
   has the full procedure and troubleshooting.

**Do not** copy the laptop's MongoDB data directory. The portable backup below replaces it.

## D. Restore the release database

Use `migration-backup/database/cyber_awareness_training_release.archive`. It is
**gzip-compressed**, so `--gzip` is mandatory. Run these from the project root on the PC:

```powershell
# 1. Integrity. Must print 534e632ace1be304837a24353fe4669dd4ff7aee3e242ceb8be42e8b6179221b
(Get-FileHash migration-backup\database\cyber_awareness_training_release.archive -Algorithm SHA256).Hash.ToLower()

# 2. The target must not exist yet. Expected output: []
mongosh "mongodb://127.0.0.1:27017/?replicaSet=rs0" --quiet --eval "db.adminCommand({listDatabases:1,nameOnly:true}).databases.map(x=>x.name).filter(n=>n.startsWith('cyber_awareness_training_release'))"

# 3. Restore (no --drop, on purpose)
mongorestore --uri="mongodb://127.0.0.1:27017/?replicaSet=rs0" `
  --archive="migration-backup\database\cyber_awareness_training_release.archive" `
  --gzip `
  --nsInclude="cyber_awareness_training_release.*"

# 4. Verify (read-only). Last line must be: RESULT: PASS
mongosh "mongodb://127.0.0.1:27017/?replicaSet=rs0" --quiet --file migration-backup\verification\verify-release-db.js
```

Expected result: 11 collections, 268 documents and 45 indexes, including 100 ScenarioDefinition
records. The full inventory is in `DATABASE_BACKUP_MANIFEST.md`.

Only restore **this** archive. Do not restore
`backend/deploy/migration-001/cyber_awareness_training_release.archive.gz`: it is an older
build that holds only the 100 definitions, with no admin, learners or runs.

## E. Environment and configuration files

These files are **already in the project folder** and travel with the copy. Do not recreate
them from `.env.example`. The existing secrets have to stay the same (see the notes below).

| File | Purpose | Required on PC | Git |
|---|---|---|---|
| `backend/.env` | Backend runtime config. It sets `NODE_ENV=development`, `PORT=5000`, `MONGO_URI` (points to `cyber_awareness_training_release` on `127.0.0.1:27017` with `replicaSet=rs0`, no credentials), `CORS_ORIGIN=http://localhost:5173`, the candidate `SESSION_SECRET` and its lifetime, and the `ADMIN_SESSION_SECRET` and its lifetime. | **Yes.** The server refuses to start without `ADMIN_SESSION_SECRET`. | gitignored, local only |
| `frontend/.env` | `VITE_API_BASE_URL` points the UI at the backend API on port 5000 | **Yes** | gitignored, local only |
| `frontend/.env.verify` | `VITE_API_BASE_URL` for the isolated verification build (API on port 5055, UI on port 5199) | Only for isolated verification runs | tracked |
| `backend/.env.example`, `frontend/.env.example` | Templates only | No (reference) | tracked |
| `.claude/launch.json` | Preview-server definitions for Claude Code (`frontend` on 5173, `scene-verify` on 5199) | Only when using Claude Code | tracked |

Notes:

- **Keep `SESSION_SECRET` unchanged.** The per-run learner action codes (SECURITY-001) are
  derived from it, because `LEARNER_ACTION_SECRET` is not set. Changing it makes codes that
  were already issued stale, and it also signs out existing candidate sessions.
- `ADMIN_SESSION_SECRET` must stay different from `SESSION_SECRET`. The server checks this.
- Optional variables that are not set, so their defaults apply: `HOST` (127.0.0.1), `EXPORT_DIR`
  (`backend/exports`), `LEARNER_ACTION_SECRET`, and the `ADMIN_LOGIN_*` throttling values.
- None of these variables are set at the Windows **User or Machine** level on the laptop, so
  nothing outside the project needs to be recreated. On the PC, make sure none of them are
  set system-wide. `dotenv` does not override an existing OS environment variable, so a stray
  system `MONGO_URI` would silently win.

**Ports used:** 27017 (MongoDB), 5000 (backend API), 5173 (frontend dev server). The isolated
verification setup uses 5055 and 5199. If 5173 is taken on the PC, Vite will move to 5174, and
the backend's `CORS_ORIGIN` would then reject the UI. Free port 5173 rather than editing
config.

## F. Backend startup

```powershell
cd backend
npm ci          # exact versions from package-lock.json (npm install also works)
npm run dev     # node --watch src/server.js, serves 127.0.0.1:5000
```

## G. Frontend startup

```powershell
cd frontend
npm ci
npm run dev     # Vite, serves http://localhost:5173
```

## H. Demo Admin

The restored release database already contains the **existing demo Admin account** (the
`adminusers` collection, 1 document). It was created on the laptop on 2026-09-23 with
`backend/scripts/createDemoAdmin.js`. Log in with the same demo credentials used on the laptop.
They are intentionally not repeated here. This demo credential is weak on purpose and **must
be replaced before any real deployment**. Do **not** run `npm run admin:create-demo` or
`admin:create` on the PC; the account is already in the restore.

## I. Important warnings

- **Do not** create a fresh, empty production database. **Restore** the provided release
  backup.
- **Do not** restore on top of an existing `cyber_awareness_training_release`, and do not add
  `--drop`.
- **Do not** run migration scripts against the restored release database unless you are
  explicitly told to.
- **Do not** run database build or rebuild or seed scripts. That includes `npm run
  release:build`, `import:definitions`, `import:scenarios`, `dev:pool`, `generate:synthetic`,
  `backfill:profile`, `admin:create-demo`, and `scripts/seedReviewDemo.js`.
- **Do not** overwrite the release database by accident. Double-check every `--db`, `--nsTo`
  and `MONGO_URI` before running any tool.
- **Do not** modify ScenarioDefinition records during the migration.
- **Do not** re-run `rs.initiate()` on a set that is already initiated. Check `rs.status()`
  first.
- `npm test` in `backend` creates its own throwaway test databases. It is **not** part of the
  migration, so do not run it as a migration step.

## J. Things outside the project folder

| Path (laptop) | Purpose | Required on PC | How to recreate |
|---|---|---|---|
| `C:\Program Files\MongoDB\Server\8.3\` + `bin\mongod.cfg` | MongoDB install and its config (`replSetName: rs0`, port 27017, loopback) | Yes, as a fresh install | Install MongoDB 8.3.x on the PC and apply §C. Do not copy the install. |
| `C:\MongoDB\data`, `C:\MongoDB\log` | The laptop's MongoDB dbPath and log | **No** | The data comes from the portable archive (§D) |
| `C:\Program Files\MongoDB\Tools\100\bin\` | mongodump / mongorestore | Yes, as a fresh install | Install MongoDB Database Tools and add it to PATH |
| `%LOCALAPPDATA%\Programs\mongosh\` | mongosh | Yes, as a fresh install | Install mongosh 2.x |
| `%LOCALAPPDATA%\Author Software\nvm\` | nvm-windows and Node 24.15.0 | Node yes; nvm optional | Install Node 24.15.0 |
| `C:\Users\Asus\.claude\projects\…\memory\` | Claude Code's per-project working notes. These are not part of the application. | **No** (optional) | Copy it by hand only if you want Claude Code on the PC to keep those notes. The folder name encodes the project path, so it must be renamed to match the PC's path. |

Nothing else is needed. There are no certificates, uploads, external asset folders or
external config files. Scenario content, learner-action maps (`backend/data/`), exports
(`backend/exports/`, currently empty) and frontend assets are all inside the project.
Machine-specific paths appear only in documentation and in the test helper
`backend/scripts/testEngine.js`, which probes `C:/Program Files/MongoDB/Server/8.x/bin/mongod.exe`
for test tooling. None of them are used by the running application.

## K. Checklist for the PC task

1. Copy the folder, then confirm the `.env` files and `migration-backup\` are present.
2. Install Node 24.15.0, MongoDB 8.3.x, the Database Tools and mongosh.
3. Configure `rs0` on `127.0.0.1:27017` and initiate it once. Confirm PRIMARY.
4. Verify the SHA-256, then restore with `--gzip`, then run `verify-release-db.js`. It must
   print PASS.
5. Run `npm ci` in `backend` and in `frontend`.
6. Run `npm run dev` in each, then open http://localhost:5173.
