# CI/CD requirements

## 1. Pull-request pipeline

Every pull request shall run applicable checks:

```text
format/lint
token validation and regeneration check
TypeScript/framework compilation
unit tests
accessibility tests
Storybook/catalog build
visual regression
package build and pack inspection
clean-consumer smoke builds
dependency/security scan
```

Changed-scope detection may reduce work, but stable branch protection must require all relevant checks.

## 2. Main branch

Main is protected. Direct pushes are disabled except approved emergency procedure. Required reviews include code ownership for tokens, public APIs, and publishing workflows.

## 3. Release pipeline

```text
Approved main commit
        ↓
Version proposal/change review
        ↓
Re-run required test matrix
        ↓
Build immutable artifacts
        ↓
Publish to private registries
        ↓
Deploy versioned documentation
        ↓
Create release notes/tag
        ↓
Trigger consumer update PRs
```

## 4. Credentials and environments

- Publishing occurs only from protected environments.
- GitHub Actions uses `GITHUB_TOKEN` with explicit minimum permissions where supported.
- Cross-repository access is granted explicitly.
- No pull request from untrusted code receives publishing credentials.
- Production documentation deployment requires protected-environment approval until proven safe to automate.

## 5. Artifact policy

CI stores package archives, generated-token diff, test reports, accessibility results, visual diff summary, SBOM where adopted, and provenance/checksum metadata according to retention policy.

## 6. Failure policy

Publishing is atomic per coordinated release where practical. Partial publication halts dependent releases and creates an incident record. Documentation never claims a package version that was not successfully published and verified.

