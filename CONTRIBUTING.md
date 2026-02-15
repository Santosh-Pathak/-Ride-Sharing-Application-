# Contributing to RideShare

## Development Setup

1. Use Node.js 20 (see `.nvmrc`).
2. Fork and clone the repo, then run `npm install`.
3. Copy `.env.example` to `.env` and set values.
4. Start infrastructure: `npm run docker:up`.

## Code Style

- ESLint and Prettier are enforced. Run `npm run lint` and `npm run format:check`.
- Pre-commit (Husky + lint-staged) runs lint and format on staged files.
- Use the shared `@rideshare/shared` logger and error types.

## Branching

- `main` – production-ready.
- `develop` – integration branch.
- Feature branches: `feature/description` or `fix/description`.

## Pull Requests

- Open PRs against `develop` (or `main` for small fixes).
- Ensure CI passes (lint, format, tests).
- Keep changes focused and documented.

## Testing

- Add unit tests for new logic; use `node --test` or Jest in services that use it.
- Run `npm run test` and `npm run test:ci` before pushing.

## API Changes

- Update `docs/api/swagger.yaml` for new or changed endpoints.
