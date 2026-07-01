# Security Review Checklist

Detailed companion to the Security axis of `SKILL.md`. Work through these when a change touches user input, authentication, data storage, external integrations, or anything that crosses a trust boundary. For broader hardening guidance, see the `security-and-hardening` skill.

## Trust Boundaries

- [ ] Every input from outside the system (HTTP requests, query params, headers, cookies, file uploads, webhooks, third-party API responses, message queues, config files, environment) is treated as untrusted until validated.
- [ ] Validation happens at the boundary (on the way in), not scattered deep in business logic.
- [ ] Validation is allowlist-based (accept known-good) rather than denylist-based (block known-bad) where feasible.

## Input Validation & Sanitization

- [ ] String lengths, numeric ranges, and enum values are bounded.
- [ ] Structured input is parsed and validated against a schema (e.g., zod, JSON schema) — not hand-rolled.
- [ ] File uploads validate type, size, and content — not just the extension.
- [ ] Path/filename inputs are checked against directory traversal (`../`, absolute paths, null bytes).

## Injection

- [ ] SQL uses parameterized queries or an ORM — never string concatenation of user data.
- [ ] NoSQL queries don't interpolate raw user objects (operator injection, e.g., `$where`, `$gt`).
- [ ] Shell/command execution avoids user data; if unavoidable, args are passed as an array (no shell string).
- [ ] Template rendering escapes by default; raw/unescaped output is justified and reviewed.
- [ ] Deserialization of untrusted data avoids unsafe formats (no pickle, no `eval`, no arbitrary object instantiation).

## Output Encoding (XSS)

- [ ] HTML output is contextually encoded (body, attribute, JS, URL, CSS contexts differ).
- [ ] No use of `dangerouslySetInnerHTML` / `innerHTML` with untrusted data; if used, content is sanitized (e.g., DOMPurify).
- [ ] Redirects validate the target against an allowlist (no open redirect).
- [ ] `Content-Type` and security headers (CSP, X-Content-Type-Options, HSTS) are set where relevant.

## Authentication & Authorization

- [ ] Every protected endpoint checks authentication.
- [ ] Authorization is checked per-resource (object-level access control) — not just "is logged in."
- [ ] No IDOR: a user cannot access another user's records by changing an ID.
- [ ] Session tokens are httpOnly, secure, and SameSite where applicable; expiry/rotation is handled.
- [ ] Password handling uses a strong adaptive hash (bcrypt/scrypt/argon2) — never plain, MD5, or SHA-1.

## Secrets & Sensitive Data

- [ ] No secrets, API keys, tokens, or credentials in code, tests, logs, or version control.
- [ ] Secrets come from environment/secret managers; `.env.example` holds placeholders only.
- [ ] Sensitive data (PII, tokens, card data) is not logged, and is redacted in error reports.
- [ ] Sensitive data is encrypted at rest and in transit where required.

## Dependencies

- [ ] New dependencies are actively maintained, reputable, and license-compatible.
- [ ] `npm audit` (or equivalent) shows no unresolved high/critical vulnerabilities introduced.
- [ ] Lockfile is updated and committed; no unexpected transitive additions.

## Error Handling & Disclosure

- [ ] Error messages to users don't leak stack traces, SQL, file paths, or internal identifiers.
- [ ] Failures default to denying access (fail closed), not granting it.
- [ ] Rate limiting / brute-force protection exists on auth and expensive endpoints where relevant.

## Verdict

- [ ] No **Critical** security findings remain unresolved.
- [ ] Any accepted risk is documented with justification and, where needed, a tracked follow-up.
