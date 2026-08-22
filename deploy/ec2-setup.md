# SmartCare — AWS Free Tier deployment

This guide stands up the production prototype exactly as described in the
report (§3.3.7 Deployment and Maintenance):

- **GitHub Actions** — every push runs build + tests; pushes to `main` deploy to EC2.
- **EC2 t2.micro** — runs the Node.js/Express API (systemd, nginx in front).
- **RDS Free Tier** — managed MySQL for the database.
- **S3** — alternative static hosting for the built PWA and caregiver documents.
- **CloudWatch** — performance monitoring.

> Free Tier caveats: EC2 t2.micro and a `db.t3.micro` RDS instance fit within
> the 12-month free allowance when used alone. RDS counts one instance.

---

## 1. One-time GitHub setup

Push this repository to GitHub, then add these **Actions secrets**:

| Secret           | Value                                                    |
|------------------|----------------------------------------------------------|
| `EC2_HOST`       | EC2 public DNS/IP, e.g. `ec2-54-12-34-56.ap-south-1.compute.amazonaws.com` |
| `EC2_USER`       | `ubuntu` (Ubuntu AMI)                                    |
| `EC2_SSH_KEY`    | The **private** key for the keypair below (full PEM text) |

## 2. Database — RDS MySQL (Free Tier)

1. Console → RDS → Create database.
2. Engine **MySQL**, template **Free tier** (instance class `db.t3.micro`).
3. Storage: 20 GiB gp2 (Free Tier default). Disable automatic backups if you
   want to stay comfortably inside free usage, or keep them and monitor cost.
4. Public access **Yes** for the prototype; set a strong master password.
5. Security group: allow TCP **3306** from the EC2 security group only.
6. Note the endpoint (e.g. `smartcare-db.xxx.ap-south-1.rds.amazonaws.com`).

Create the schema:

```sql
CREATE DATABASE smartcare CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

## 3. Compute — EC2 t2.micro

1. Launch Ubuntu 24.04 LTS, **t2.micro**, 8 GiB gp3 (Free Tier eligible).
2. Create/download a keypair — this is the `EC2_SSH_KEY` secret.
3. Security group inbound rules:
   - **SSH** TCP 22 — your IP only
   - **HTTP** TCP 80 — 0.0.0.0/0
   - **HTTPS** TCP 443 — 0.0.0.0/0 (if you add TLS)
   - (API runs on 5000 behind nginx; do **not** expose 5000 publicly)
4. Allocate an Elastic IP so the host survives restarts.

Bootstrap (one-time, run as `ubuntu`):

```bash
# Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get update && sudo apt-get install -y nodejs git nginx python3 build-essential

# Uploads directory (matches the systemd unit)
sudo mkdir -p /var/lib/smartcare/uploads && sudo chown ubuntu:ubuntu /var/lib/smartcare/uploads

# Clone the repo (read-only deploy key, or a PAT)
sudo mkdir -p /srv && sudo chown ubuntu:ubuntu /srv
cd /srv
git clone git@github.com:<you>/<repo>.git smartcare
cd smartcare
npm ci --prefix server
npm run build --prefix client
```

Configure the environment:

```bash
cp server/.env.example server/.env
# Edit server/.env for production:
#   NODE_ENV=production
#   CLIENT_ORIGIN=http://<ELASTIC_IP_OR_DOMAIN>
#   DB_HOST=<rds endpoint>, DB_USER=admin, DB_PASSWORD=<strong>, DB_NAME=smartcare
#   JWT_ACCESS_SECRET / JWT_REFRESH_SECRET / FIELD_ENCRYPTION_KEY — fresh random values
#   UPLOAD_DIR=/var/lib/smartcare/uploads
```

Create tables and load demo data (run once):

```bash
cd /srv/smartcare/server && npm run seed
```

Install the service and nginx:

```bash
sudo cp /srv/smartcare/deploy/smartcare-api.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now smartcare-api
sudo systemctl status smartcare-api
```

### nginx reverse proxy

`/etc/nginx/sites-available/smartcare`:

```nginx
server {
    listen 80;
    server_name _;

    # Built PWA
    root /srv/smartcare/client/dist;
    index index.html;

    # API
    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # PWA routing — serve index.html for client-side routes, but not /api
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/smartcare /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

Deployments are now automatic: push to `main` → `Deploy (EC2)` workflow runs
`deploy/deploy.sh` on the box.

## 4. S3 (IR: static PWA + caregiver documents)

The prototype serves the built PWA from nginx and stores uploads on disk. For
the IR-aligned setup:

- **Static PWA**: `aws s3 sync client/dist s3://smartcare-web --acl public-read`
  behind CloudFront (optional) — keep nginx `try_files` behavior in mind since
  S3/CloudFront do SPA fallback via `index.html` error document.
- **Documents**: give uploads a lifecycle — mirror `/var/lib/smartcare/uploads`
  to `s3://smartcare-assets/uploads` with `aws s3 sync` (cron) as a durable
  backup. Moving live upload handling into S3 is the documented future step.

## 5. CloudWatch monitoring

- Enable **EC2 detailed monitoring** for the API instance.
- RDS: Free Tier instance metrics (CPU, storage) are always available.
- Install the CloudWatch agent for a custom `SmartCare` namespace:

```bash
sudo apt-get install -y amazon-cloudwatch-agent
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
  -a fetch-config -m ec2 -c ssm:AmazonCloudWatch-linux -s
```

- Systemd already ships the API logs to `journalctl`; a simple weekly check:

```bash
journalctl -u smartcare-api --since "1 week ago" | grep -i error | tail
```

## 6. Post-deployment checks

```bash
curl http://<HOST>/api/health
curl -I http://<HOST>/            # 200, serves index.html
curl -I http://<HOST>/login       # 200, SPA fallback works
```

`npm run db:reset` is **never** run in production — it drops tables. Use it only
on your local machine.
