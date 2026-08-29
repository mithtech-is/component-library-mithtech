# Security and access-control plan

## 1. Assets to protect

- Private source and specifications
- Package artifacts
- Documentation/catalogs
- Publishing credentials
- CI provenance and release metadata
- Internal examples and roadmap information

## 2. Access model

- Repository access through organization teams
- Package access inherited from or explicitly connected to approved repositories
- Storybook protected before application content loads
- Native package repositories restricted to approved teams
- External contractor access time-bounded and least privilege

## 3. Documentation access

Protect `storybook.po5.in` using an identity-aware gateway, recommended Cloudflare Access with the organization's identity provider. The current host was reachable without an observable authentication challenge during inspection; this is a pre-release security action.

## 4. Credentials

- GitHub Actions uses scoped workflow tokens where supported.
- Developer registry tokens are stored outside repositories.
- Tokens are never printed in logs.
- Publishing credentials are restricted to protected environments.
- Credential rotation and offboarding follow organization policy.

## 5. Supply chain

- Lock dependencies.
- Enable dependency/security scanning.
- Pin third-party Actions to approved references.
- Generate checksums and provenance where practical.
- Inspect packed file lists.
- Prohibit postinstall scripts unless reviewed and justified.
- Prevent accidental publishing to the public npm registry.

## 6. Example-data policy

Stories, catalogs, screenshots, tests, and templates use fictional data. Production tokens, endpoints, customer details, personal data, and credentials are prohibited.

## 7. Vulnerability handling

Security reports receive severity, owner, affected versions, mitigation, fixed version, and disclosure classification. Compromised versions are deprecated; published artifacts are not overwritten.

## 8. Required security evidence

- Access matrix
- Protected publishing environment
- Secret scanning
- Dependency scan
- Package file allowlist
- Unauthenticated access rejection for private documentation/packages
- Tested developer offboarding path

