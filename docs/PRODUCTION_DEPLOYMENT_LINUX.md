# Production Deployment — Linux server (Ubuntu)

Target: 4 CPU cores · 12 GB RAM · 300 GB NVMe · 1 Gbps · Ubuntu LTS.
Written by the final production audit (30 September 2026). Everything below that is not
application code — TLS, the page CSP, edge rate limiting, the firewall, MongoDB access
control, backups — is the server's job, and the application cannot do it for itself.

```
 learners' browsers ──HTTPS 443──► Nginx ──http 127.0.0.1:5000──► Node API (1 process)
                                    │  serves frontend/dist                │
                                    │  TLS, HSTS, CSP, rate limits         └─► mongod 127.0.0.1:27017
                                    └─ firewall: only 22 (restricted), 80, 443 open     replica set rs0, auth ON
```

Only Nginx listens on a public interface. The API binds `127.0.0.1` by default (`HOST`), and
MongoDB must bind `127.0.0.1` only.

## 1. Non-negotiables

| # | Requirement | Why |
|---|---|---|
| 1 | **HTTPS.** | Session cookies are `Secure` when `NODE_ENV=production`. Over plain `http://` the browser drops them and every learner is bounced back to sign-in. |
| 2 | **Same origin.** Nginx serves the page AND forwards `/api/`. | The production build calls `/api` on its own origin (`frontend/.env.production`). No CORS is involved in production. |
| 3 | **Do not copy `backend/.env` or `frontend/.env` to the server.** | `backend/.env` is a development file (`NODE_ENV=development`, the published development `SESSION_SECRET`). `dotenv` would load any value the service environment does not set. Configuration comes only from the systemd `EnvironmentFile` below. |
| 4 | **Build the frontend on a clean checkout with `npm run build`, then `npm run check:bundle`.** | The check fails if a development API URL (`http://localhost:5000/api`) or a server secret name reached the bundle. The `frontend/dist` shipped before 30 Sep 2026 contains that URL and must be rebuilt. |
| 5 | **MongoDB never reachable from the network**, access control on. | The database holds every learner's record. |
| 6 | **One API process.** | Admin login throttling and the expiry sweeper are in-process by design. Do not run PM2 cluster mode or several instances. |

## 2. MongoDB 8.x — single-node replica set with authentication

The engine refuses to run without transactions, so the replica set is mandatory. With access
control on, a replica set also needs a keyfile (internal authentication), even with one member.

```bash
sudo mkdir -p /etc/mongodb && sudo openssl rand -base64 756 | sudo tee /etc/mongodb/keyfile >/dev/null
sudo chown mongodb:mongodb /etc/mongodb/keyfile && sudo chmod 400 /etc/mongodb/keyfile
```

`/etc/mongod.conf`:

```yaml
storage:
  dbPath: /var/lib/mongodb
  wiredTiger:
    engineConfig:
      cacheSizeGB: 4          # leaves ~7 GB for the OS, Nginx and Node on a 12 GB host
net:
  port: 27017
  bindIp: 127.0.0.1           # NEVER 0.0.0.0
replication:
  replSetName: rs0
  oplogSizeMB: 1024
security:
  authorization: enabled
  keyFile: /etc/mongodb/keyfile
systemLog:
  destination: file
  path: /var/log/mongodb/mongod.log
  logAppend: true
  logRotate: reopen
```

```bash
sudo systemctl enable --now mongod
mongosh --quiet --eval 'rs.initiate({_id:"rs0",members:[{_id:0,host:"127.0.0.1:27017"}]})'
# localhost exception: create the first (admin) user, then the application user
mongosh admin --eval 'db.createUser({user:"dbadmin",pwd:passwordPrompt(),roles:["root"]})'
mongosh -u dbadmin -p --authenticationDatabase admin --eval '
  db.getSiblingDB("cyber_awareness_training_release").createUser({
    user:"cyberapp", pwd:passwordPrompt(),
    roles:[{role:"readWrite", db:"cyber_awareness_training_release"}]})'
```

Restore the release database (see `docs/PRODUCTION_RELEASE_MANIFEST.md` §7) with the `dbadmin`
credentials, then validate it before the first learner signs in.

## 3. Backend service

```bash
sudo useradd --system --home /opt/cyber-awareness --shell /usr/sbin/nologin cyberaware
# code at /opt/cyber-awareness/backend (no .env file in it), then:
cd /opt/cyber-awareness/backend && npm ci --omit=dev
sudo mkdir -p /etc/cyber-awareness /var/lib/cyber-awareness/exports
sudo chown cyberaware: /var/lib/cyber-awareness/exports && sudo chmod 700 /var/lib/cyber-awareness/exports
```

`/etc/cyber-awareness/backend.env` (mode `600`, owner `root`):

```ini
NODE_ENV=production
HOST=127.0.0.1
PORT=5000
TRUST_PROXY=loopback
MONGO_URI=mongodb://cyberapp:<password>@127.0.0.1:27017/cyber_awareness_training_release?replicaSet=rs0&authSource=cyber_awareness_training_release
CORS_ORIGIN=https://<your-host-name>
SESSION_SECRET=<48 random bytes, base64url>
ADMIN_SESSION_SECRET=<a DIFFERENT 48 random bytes>
LEARNER_ACTION_SECRET=<a third random value>
EXPORT_DIR=/var/lib/cyber-awareness/exports
# DEMO_SERVICE_NUMBER=            # empty disables the Demo User; leave unset to keep the approved default
```

Generate each secret with
`node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`.
The server refuses to start if `ADMIN_SESSION_SECRET` is missing or equals `SESSION_SECRET`, or if
`SESSION_SECRET` is still the development default under `NODE_ENV=production`.

`TRUST_PROXY=loopback` is correct ONLY because Nginx on the same host is the one caller. It makes
`req.ip` the real client address, which the admin login throttle keys on. Without it every
request looks like `127.0.0.1`, and five wrong passwords from anyone lock the administrator out.

`/etc/systemd/system/cyber-awareness.service`:

```ini
[Unit]
Description=Cyber Awareness Training API
After=network.target mongod.service
Requires=mongod.service

[Service]
Type=simple
User=cyberaware
WorkingDirectory=/opt/cyber-awareness/backend
EnvironmentFile=/etc/cyber-awareness/backend.env
ExecStart=/usr/bin/node src/server.js
Restart=always
RestartSec=2
TimeoutStopSec=15
LimitNOFILE=65536
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/var/lib/cyber-awareness/exports

[Install]
WantedBy=multi-user.target
```

`SIGTERM` finishes in-flight requests (each engine write is a single transaction) and exits
within 10 s. On start, attempts whose 90-minute deadline passed while the service was down are
finalised before the first request is served.

Logs go to journald. Cap them in `/etc/systemd/journald.conf` with `SystemMaxUse=1G`. The API
writes one JSON line per learner action, about 75 lines per completed attempt.

## 4. Nginx

```nginx
limit_req_zone $binary_remote_addr zone=api:10m      rate=50r/s;
limit_req_zone $binary_remote_addr zone=signin:10m   rate=10r/s;
limit_req_zone $binary_remote_addr zone=adminlogin:10m rate=10r/m;
limit_req_status 429;

upstream cyber_api {
    server 127.0.0.1:5000;
    keepalive 32;
    keepalive_timeout 30s;        # below the API's 65 s keep-alive, so the API never closes a pooled socket first
}

server {
    listen 80;
    server_name <your-host-name>;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name <your-host-name>;
    ssl_certificate     /etc/ssl/<cert>.pem;
    ssl_certificate_key /etc/ssl/<key>.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    server_tokens off;

    root /var/www/cyber-awareness;           # the contents of frontend/dist
    client_max_body_size 1m;                  # same limit as the API's JSON parser

    add_header Strict-Transport-Security "max-age=31536000" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'" always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-Frame-Options DENY always;
    add_header Referrer-Policy no-referrer always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=(), usb=()" always;

    gzip on;
    gzip_types text/css application/javascript text/javascript application/json image/svg+xml;

    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable" always;
        add_header X-Content-Type-Options nosniff always;
        try_files $uri =404;
    }

    location / {
        add_header Cache-Control "no-cache" always;
        # (the security headers above must be repeated in any location that adds its own add_header)
        try_files $uri /index.html;
    }

    location /api/ {
        limit_req zone=api burst=400 nodelay;
        proxy_pass http://cyber_api;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $remote_addr;   # overwrite, never append a client-supplied chain
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 5s;
        proxy_read_timeout 60s;
    }
    location = /api/candidates {
        limit_req zone=signin burst=200 nodelay;
        proxy_pass http://cyber_api;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_set_header X-Forwarded-For $remote_addr;
    }
    location = /api/admin/login {
        limit_req zone=adminlogin burst=5 nodelay;
        proxy_pass http://cyber_api;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_set_header X-Forwarded-For $remote_addr;
    }
}
```

**About the rate limits:** they are per client IP. A classroom whose PCs share one NAT address
looks like one client to Nginx. The limits are sized for that case. A burst of 200 sign-ins and
400 API requests passes, and 50 requests per second sustained is roughly ten times what a room
of 400 learners generates (measured: about 74 requests per 90-minute attempt). They stop floods
and scripted profile creation, not a class. If one address serves more than 200 learners who all
sign in within the same few seconds, raise the `signin` burst.

**`add_header` inheritance:** Nginx drops the server-level `add_header`s in any `location` that
declares its own. Repeat the security headers there, or use the `headers-more` module. Verify
with `curl -sI https://<host>/` and `curl -sI https://<host>/assets/<file>.js`.

## 5. Firewall

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow from <admin-network> to any port 22 proto tcp
sudo ufw allow 80,443/tcp
sudo ufw enable
sudo ss -tlnp        # expect 27017 and 5000 on 127.0.0.1 only; 80/443 on 0.0.0.0
```

If the server is reachable from the internet, see §8 before go-live.

## 6. Backups

```bash
# /etc/cron.d/cyber-awareness-backup  (as root, 02:30 daily, 14-day retention)
30 2 * * * root mongodump --uri="mongodb://dbadmin:<pw>@127.0.0.1:27017/?replicaSet=rs0&authSource=admin" \
  --db=cyber_awareness_training_release --gzip --archive=/var/backups/cyber/cat-$(date +\%F).archive.gz \
  && tar czf /var/backups/cyber/exports-$(date +\%F).tgz -C /var/lib/cyber-awareness exports \
  && find /var/backups/cyber -type f -mtime +14 -delete
```

Copy backups off the machine. Test a restore under another name (`--nsFrom/--nsTo`) at least once
before go-live. Measured growth (audit, 30 Sep 2026, 3,160 attempts / 31,600 runs / 123,262
events): a completed attempt is about 1 attempt + 10 runs + ~60 ledger events. That is roughly
28 KB of raw documents and about 20 KB on disk after WiredTiger compression, indexes included.
100,000 attempts come to about 2–4 GB with headroom, so disk is not a constraint on 300 GB.

## 7. Go-live checklist

- [ ] `curl -s https://<host>/api/health` returns `{"status":"ok",…}` (no database name in production)
- [ ] `curl -sI https://<host>/api/health` shows `Cache-Control: no-store`, `X-Frame-Options: DENY`, no `X-Powered-By`
- [ ] `curl -sI https://<host>/` shows HSTS and the CSP
- [ ] `ss -tlnp`: MongoDB and the API are on 127.0.0.1 only
- [ ] `npm run check:bundle` passed on the build that was deployed
- [ ] `node scripts/release/validateProductionRelease.js --db=cyber_awareness_training_release` PASS before the first learner
- [ ] the administrator account was created interactively on the server (`npm run admin:create`)
- [ ] a backup ran and a test restore succeeded
- [ ] browser: sign in, start, play one scenario, sign out. Admin: sign in, dashboard, one export.

## 8. Learner sign-in on a network-reachable server (decision for the client)

Learner sign-in is **by name and personal/service number, with no password**. That is the
approved design. On the original single offline machine it was sound. On a server reachable
over a network, anyone who knows or guesses a learner's service number can sign in as that
learner, see their results and history, and take or finish their assessment. The server
cannot tell them apart.

Acceptable when the server is reachable only from the training network (classroom LAN / VPN)
and sessions are supervised. **Not acceptable on the open internet.** In that case restrict
access at the network layer (VPN, IP allowlist, or Nginx `allow`/`deny` for the classroom
ranges), or approve a change to the authentication design. The Admin area is
password-protected (Argon2id, throttled) and is not affected.
