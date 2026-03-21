# GOING PLATFORM - DEPLOYMENT GUIDE

## goingec.com Domain Setup

### Phase 1: DNS & Domain Configuration

#### Subdomain Structure

```
goingec.com              → Landing page / Blog
app.goingec.com          → Frontend-Webapp (Users/Passengers)
admin.goingec.com        → Admin Dashboard
drivers.goingec.com      → Driver App (Web wrapper)
corporate.goingec.com    → Corporate Portal
api.goingec.com          → Backend APIs
cdn.goingec.com          → Static assets CDN
```

#### DNS Records to Add

**A Records (Point to server IP)**

````
Domain              A Record            Server IP
-----               --------            ---------
goingec.com         A                   YOUR_SERVER_IP
*.goingec.com       A (wildcard)        YOUR_SERVER_IP
corporate.goingec.com A                 YOUR_SERVER_IP
api.goingec.com     A                   YOUR_SERVER_IP
```app.goingec.com     A                   YOUR_SERVER_IP
admin.goingec.com   A                   YOUR_SERVER_IP
drivers.goingec.com  A

**CNAME Records (For CDN/Services)**

````

CDN CNAME Service

---

cdn.goingec.com CNAME cloudfront.amazonaws.com

```

**TXT Records (For verification)**

```

Domain TXT Record Purpose

---

goingec.com v=spf1 ... Email SPF
goingec.com \_dmarc=v=DMARC1 Email DMARC

````

---

### Phase 2: SSL/TLS Certificates

#### Using Let's Encrypt (Free)

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Generate certificates for all subdomains
sudo certbot certonly --nginx \
  -d goingec.com \
  -d www.goingec.com \
  -d app.goingec.com \
  -d admin.goingec.com \
  -d drivers.goingec.com \
  -d corporate.goingec.com \
  -d api.goingecom

# Auto-renewal.c
sudo certbot renew --dry-run
````

#### Wildcard Certificate

```bash
# For all subdomains at once
sudo certbot certonly --dns-cloudflare \
  -d goingec.com \
  -d '*.goingec.com'
```

---

### Phase 3: Environment Configuration

#### Frontend-Webapp (.env.production)

```env
NEXT_PUBLIC_API_URL=https://api.goingec.com
NEXT_PUBLIC_APP_URL=https://app.goingec.com
NEXT_PUBLIC_ANALYTICS=true
NEXT_PUBLIC_SENTRY_DSN=https://...
```

#### Admin-Dashboard (.env.production)

```env
NEXT_PUBLIC_API_URL=https://api.goingec.com
NEXT_PUBLIC_ADMIN_URL=https://admin.goingec.com
```

#### Corporate-Portal (.env.production)

```env
NEXT_PUBLIC_API_URL=https://api.goingec.com
NEXT_PUBLIC_CORPORATE_URL=https://corporate.goingec.com
```

---

### Phase 4: Nginx Configuration

#### /etc/nginx/sites-available/goingec.com

```nginx
# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name goingec.com *.goingec.com;
    return 301 https://$server_name$request_uri;
}

# Frontend-Webapp
server {
    listen 443 ssl http2;
    server_name app.goingec.com;

    ssl_certificate /etc/letsencrypt/live/goingec.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/goingec.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Admin Dashboard
server {
    listen 443 ssl http2;
    server_name admin.goingec.com;

    ssl_certificate /etc/letsencrypt/live/goingec.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/goingec.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Corporate Portal
server {
    listen 443 ssl http2;
    server_name corporate.goingec.com;

    ssl_certificate /etc/letsencrypt/live/goingec.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/goingec.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3002;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# API Backend
server {
    listen 443 ssl http2;
    server_name api.goingec.com;

    ssl_certificate /etc/letsencrypt/live/goingec.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/goingec.com/privkey.pem;

    location / {
        proxy_pass http://localhost:4000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Landing Page (Root)
server {
    listen 443 ssl http2;
    server_name goingec.com www.goingec.com;

    ssl_certificate /etc/letsencrypt/live/goingec.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/goingec.com/privkey.pem;

    root /var/www/goingec.com/public;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

#### Enable Configuration

```bash
sudo ln -s /etc/nginx/sites-available/goingec.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

### Phase 5: Application Deployment

#### Using Docker Compose

```yaml
# docker-compose.yml
version: '3.9'

services:
  frontend-webapp:
    image: going-frontend-webapp:latest
    ports:
      - '3000:3000'
    environment:
      NEXT_PUBLIC_API_URL: https://api.goingec.com
      NEXT_PUBLIC_APP_URL: https://app.goingec.com
    restart: always

  admin-dashboard:
    image: going-admin-dashboard:latest
    ports:
      - '3001:3000'
    environment:
      NEXT_PUBLIC_API_URL: https://api.goingec.com
      NEXT_PUBLIC_ADMIN_URL: https://admin.goingec.com
    restart: always

  corporate-portal:
    image: going-corporate-portal:latest
    ports:
      - '3002:3000'
    environment:
      NEXT_PUBLIC_API_URL: https://api.goingec.com
    restart: always

  api-backend:
    image: going-api-backend:latest
    ports:
      - '4000:4000'
    environment:
      DATABASE_URL: postgresql://...
      REDIS_URL: redis://redis:6379
    depends_on:
      - postgres
      - redis
    restart: always

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: always

  redis:
    image: redis:7-alpine
    restart: always

volumes:
  postgres_data:
```

#### Deploy

```bash
docker-compose up -d
docker-compose logs -f
```

---

### Phase 6: Monitoring & Analytics

#### Google Analytics Setup

```html
<!-- Add to _document.tsx or root layout -->
<script
  strategy="afterInteractive"
  src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"
/>
<script id="google-analytics" strategy="afterInteractive">
  {
    `window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'GA_MEASUREMENT_ID');`;
  }
</script>
```

#### Sentry Error Tracking

```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
  integrations: [
    new Sentry.Replay({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
});
```

---

### Phase 7: Performance Optimization

#### CDN Configuration (Cloudflare)

```bash
# Caching rules for static assets
Path: /api/*
Cache: Bypass

Path: /static/*
Cache: Cache Everything
TTL: 1 month

Path: /_next/*
Cache: Cache Everything
TTL: 1 month
```

#### Image Optimization

```jsx
import Image from 'next/image';

<Image
  src="/hero.jpg"
  alt="Hero"
  width={1920}
  height={1080}
  quality={80}
  loading="lazy"
  responsive={true}
/>;
```

---

### Phase 8: Security Headers

#### Add to Nginx config

```nginx
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "DENY" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;
```

---

### Phase 9: Database & Cache

#### PostgreSQL Setup

```bash
# Connect to remote database
DATABASE_URL=postgresql://user:pass@db.goingec.com:5432/going_production

# Run migrations
npm run db:migrate:prod

# Seed data
npm run db:seed:prod
```

#### Redis Cache

```bash
# Connect to Redis
REDIS_URL=redis://redis.goingec.com:6379

# Cache strategy
Cache TTL: 5 minutes for API responses
Cache TTL: 1 hour for user data
Cache TTL: 24 hours for static data
```

---

### Phase 10: Launch Checklist

- [ ] Domain registered and DNS configured
- [ ] SSL certificates installed and auto-renewal working
- [ ] All subdomains resolving correctly
- [ ] Frontend-Webapp accessible at app.goingec.com
- [ ] Admin-Dashboard accessible at admin.goingec.com
- [ ] Corporate-Portal accessible at corporate.goingec.com
- [ ] API accessible at api.goingec.com
- [ ] Landing page accessible at goingec.com
- [ ] HTTPS working on all domains
- [ ] Security headers configured
- [ ] Analytics tracking implemented
- [ ] Error monitoring configured
- [ ] Database backups scheduled
- [ ] Load balancer configured (if needed)
- [ ] CI/CD pipeline working
- [ ] Monitoring and alerting active
- [ ] Disaster recovery plan tested
- [ ] Performance optimized (< 2s load time)
- [ ] SEO optimized
- [ ] Legal pages (terms, privacy) published

---

## Rollback Procedure

If issues occur:

```bash
# Revert to previous version
docker-compose down
docker pull going-frontend-webapp:previous
docker-compose up -d

# Check logs
docker-compose logs -f frontend-webapp

# Rollback DNS if needed
# Update DNS A records to previous IP
```

---

## Support & Maintenance

**Regular Tasks:**

- Monitor application performance
- Review error logs daily
- Update dependencies monthly
- Renew SSL certificates (automatic)
- Backup database daily
- Monitor disk space
- Scale resources as needed

**Emergency Contacts:**

- DevOps Team: devops@goingec.com
- Support Team: support@goingec.com
- Security Team: security@goingec.com

---

**Deployment Version:** 1.0.0  
**Last Updated:** 2026-02-21
