## Rollerstat Monorepo

This repository is now organized as a monorepo with separate apps for public traffic and internal content operations.

### Structure

- `apps/web`: Public multilingual website (frontend + public APIs)
- `apps/admin`: Internal admin/CMS app (auth + admin APIs)
- `packages/content/posts`: Shared MDX content source used by both apps

### Development

Run public site:

```bash
npm run dev:web
```

Run admin app:

```bash
npm run dev:admin
```

Default `npm run dev` starts the public site.

### Build

Build both apps:

```bash
npm run build
```

Build only web:

```bash
npm run build:web
```

Build only admin:

```bash
npm run build:admin
```

### Lint

```bash
npm run lint
```

### Docker

Build and run both services with one command:

```bash
docker compose up --build -d
```

Run in background:

```bash
docker compose up -d
```

Stop all containers:

```bash
docker compose down
```

View logs:

```bash
docker compose logs -f web admin
```

URLs:

- Public website: `http://localhost:3000`
- Admin backend/CMS: `http://localhost:3001/admin`

### Environment

Both apps read from the root `.env.local` via symlinks:

- `apps/web/.env.local`
- `apps/admin/.env.local`

Keep your environment variables in the root `.env.local` file.
