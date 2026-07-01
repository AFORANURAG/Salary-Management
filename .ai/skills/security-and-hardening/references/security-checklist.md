# Security Checklist (Reference)

Detailed reference material for the `security-and-hardening` skill. Load this when you need the OWASP ordering, a full pre-commit verification routine, or expanded per-category checklists.

## OWASP Top 10 (2021) — Quick Reference

The patterns in `SKILL.md` are organized by prevention technique, not by rank. This table maps them to the official 2021 ordering.

| Rank | Category | Primary defenses |
|---|---|---|
| A01 | Broken Access Control | Authorization on every endpoint, ownership checks, deny by default, least privilege |
| A02 | Cryptographic Failures | HTTPS/TLS everywhere, encrypt PII at rest, strong password hashing (bcrypt/scrypt/argon2), no weak/legacy ciphers |
| A03 | Injection | Parameterized queries, ORM, input validation, output encoding |
| A04 | Insecure Design | Threat model first (STRIDE), abuse cases, secure-by-design patterns |
| A05 | Security Misconfiguration | Security headers (helmet/CSP/HSTS), locked-down CORS, no default creds, disable verbose errors |
| A06 | Vulnerable & Outdated Components | `npm audit`, `npm ci` + committed lockfile, dependency review, watch typosquats/postinstall |
| A07 | Identification & Authentication Failures | Rate-limited login, secure sessions (httpOnly/secure/sameSite), MFA where appropriate, expiring reset tokens |
| A08 | Software & Data Integrity Failures | Verify signatures/integrity, trusted CI/CD, no untrusted deserialization, SRI for external scripts |
| A09 | Security Logging & Monitoring Failures | Log security events (authn/authz/failures), no sensitive data in logs, alert on anomalies |
| A10 | Server-Side Request Forgery (SSRF) | Allowlist scheme + host, reject private/reserved resolved IPs, forbid redirects, pin IP for high-risk surfaces |

> For LLM-backed features, also map to the [OWASP Top 10 for LLM Applications (2025)](https://genai.owasp.org/llm-top-10/) — see the "Securing AI / LLM Features" section of `SKILL.md`.

## Pre-Commit Verification

Run this routine before committing security-relevant code.

### 1. Scan staged changes for secrets

```bash
# Flag likely secrets in what you're about to commit
git diff --cached | grep -iE "password|secret|api[_-]?key|token|private[_-]?key|BEGIN (RSA|EC|OPENSSH) PRIVATE KEY"
```

If anything matches, remove it, move it to an environment variable, and — if it ever reached a remote — **rotate the credential**.

### 2. Confirm secret files are ignored

```bash
# These should all print a .gitignore match, not nothing
git check-ignore .env .env.local && echo "env files ignored"
```

`.gitignore` must include at minimum:

```
.env
.env.local
.env.*.local
*.pem
*.key
```

### 3. Audit dependencies

```bash
npm audit --omit=dev          # production-reachable vulnerabilities
npm audit                     # full report including dev deps
```

Triage with the decision tree in `SKILL.md` ("Triaging npm audit Results"). Critical/high reachable in production block the commit; document and date any deferral.

### 4. Lockfile + reproducible install

```bash
git status --porcelain package-lock.json   # lockfile changes should be intentional & committed
# CI must use:  npm ci   (not npm install)
```

## Expanded Per-Category Checklist

### Authentication
- [ ] Passwords hashed with bcrypt/scrypt/argon2 (salt rounds ≥ 12)
- [ ] Session tokens are httpOnly, secure, sameSite
- [ ] Login and password-reset endpoints are rate limited
- [ ] Password reset tokens are single-use and expire
- [ ] No credentials or tokens written to logs
- [ ] Account lockout / backoff on repeated failures

### Authorization
- [ ] Every protected endpoint verifies authentication AND authorization
- [ ] Resource ownership checked (users access only their own data)
- [ ] Admin/elevated actions verify role explicitly
- [ ] Default is deny; access is granted, not assumed
- [ ] No authorization decisions made on the client

### Input & Output
- [ ] All external input validated at the boundary (schema validation)
- [ ] Input size caps and type constraints enforced
- [ ] SQL/NoSQL queries parameterized; no string concatenation
- [ ] HTML output encoded/escaped; no `innerHTML`/`eval` with user data
- [ ] File uploads restricted by type and size; extension not trusted
- [ ] Server-side URL fetches allowlisted (no SSRF)

### Data Protection
- [ ] No secrets in code or version control
- [ ] Secrets loaded from environment, validated on startup
- [ ] Sensitive fields stripped from API responses
- [ ] PII encrypted at rest where applicable
- [ ] TLS/HTTPS for all external communication

### Infrastructure & Config
- [ ] Security headers configured (CSP, HSTS, X-Frame-Options, X-Content-Type-Options)
- [ ] CORS restricted to known origins (no wildcard with credentials)
- [ ] Verbose errors / stack traces disabled in production responses
- [ ] Rate limiting active on auth and other sensitive endpoints
- [ ] Security-relevant events logged; logs free of sensitive data

### Supply Chain
- [ ] Lockfile committed; CI installs with `npm ci`
- [ ] New dependencies reviewed (maintenance, downloads, license, postinstall scripts)
- [ ] No known critical/high vulnerabilities in production dependencies
- [ ] Watching for typosquatted package names

### AI / LLM (if used)
- [ ] Model output treated as untrusted (no eval/SQL/innerHTML/shell/file paths)
- [ ] Secrets and cross-tenant data kept out of prompts
- [ ] Tool/agent permissions scoped to the minimum; destructive actions require confirmation
- [ ] Token, request-rate, and recursion-depth limits enforced
- [ ] RAG/vector data partitioned per tenant; indexed documents validated
