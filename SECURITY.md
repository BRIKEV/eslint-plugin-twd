# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| Latest  | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability in twd-lint, please report it
responsibly.

**Do not open a public issue.** Instead, use one of these options:

1. **GitHub Private Vulnerability Reporting** — Go to the
   [Security Advisories](https://github.com/BRIKEV/twd-lint/security/advisories/new)
   page and create a new advisory. This keeps the report private until a fix is
   available.

2. **Email** — Contact the maintainers at hello@twd.dev with details of
   the vulnerability.

### What to include

- Description of the vulnerability
- Steps to reproduce
- Affected version(s)
- Any potential impact assessment

### What to expect

- Acknowledgment within 48 hours
- A fix or mitigation plan within 7 days for critical issues
- Credit in the release notes (unless you prefer to remain anonymous)

## Scope

twd-lint is a development-only static analysis tool. It reads source
files and, with `--fix`, rewrites them. It does not run your tests, start a
browser or make network requests. Relevant reports include:

- an autofix that writes code other than what the rule describes
- a crafted source file that makes a rule hang or crash ESLint
- a problem in the package's dependencies that affects the plugin

Install it as a **devDependency**.
