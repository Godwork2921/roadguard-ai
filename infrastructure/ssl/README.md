# TLS certificates

Nginx mounts this directory read-only at `/etc/nginx/ssl` and expects
`roadguard.crt` and `roadguard.key`.

**This directory is intentionally empty.** No certificate material is committed
to the repository (see Rule 5 in the project brief: no credentials in Git).

## Why the HTTPS vhost fails without these files

`infrastructure/nginx/roadguard.conf` declares an `:443 ssl` server block. Nginx
refuses to start if the referenced certificate is missing, which takes down the
whole proxy - including the `:80` redirect.

## Development

Do not enable the HTTPS vhost in development. The `:80` server block in
`infrastructure/nginx/nginx.conf` is sufficient and is what
`docker-compose.dev.yml` uses.

## Production

Generate a real certificate with certbot, then restart nginx:

```bash
docker compose -f docker-compose.prod.yml run --rm certbot \
    certonly --webroot -w /var/www/certbot \
    -d roadguard.ai -d www.roadguard.ai

docker compose -f docker-compose.prod.yml restart nginx
```

For internal or staging deployments, generate a self-signed pair instead:

```bash
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout roadguard.key -out roadguard.crt \
    -subj "/CN=roadguard.local"
```

These filenames are gitignored (see `.gitignore`, section "Infrastructure").