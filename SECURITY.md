# Security Policy

## Supported versions

Security fixes land on `main` and ship in the next release. Older releases are not patched.

## Reporting a vulnerability

Please do not open a public issue for a security problem.

Report it privately through [GitHub Security Advisories](https://github.com/AlexGalhardo/askedly-social-network/security/advisories/new). Include:

- what the problem is and which route, action or file is affected;
- steps to reproduce it, or a proof of concept;
- what an attacker could gain (data exposed, money moved, accounts taken over).

You can expect a first reply within 5 business days. Once the fix is released, the advisory is published and you are credited, unless you ask not to be.

## Scope

In scope: this repository's code, including authentication, sessions, payments (PIX and Stripe), payouts, webhooks, privacy of anonymous questions and private profiles.

Out of scope: denial of service by volume, social engineering, findings that need a compromised device or account, and third-party services (Stripe, AbacatePay, Vercel, Cloudflare, Resend, UploadThing). Report those to the vendor.

## Testing rules

- Test only against your own local instance (see [`docs/docker.md`](docs/docker.md) for a full stack with simulated payments). Do not test against production accounts or data that are not yours.
- Never move real money and never access other users' data beyond what is needed to prove the issue.

The project's threat model, the OWASP Top 10 audit and the accepted risks are documented in [`docs/security.md`](docs/security.md).
