# Release and versioning plan

## 1. Version policy

Use semantic versioning per platform package family.

| Change | Version |
|---|---|
| Backward-compatible defect correction | Patch |
| New backward-compatible token/component/API | Minor |
| Breaking public API or semantic token change | Major |

Initial maturation:

```text
0.1.0 extracted core
0.2.0 first component primitives
0.3.0 documentation integration
0.4.0 pilot adoption
1.0.0 approved stable web foundation
```

## 2. Channels

```text
canary  automated development snapshots
next    reviewed prereleases
latest  stable production releases
```

## 3. Release contents

- Versioned packages
- Git tag
- Changelog
- Migration notes when applicable
- Documentation/catalog deployment
- Compatibility matrix
- Test and package evidence
- Known limitations

## 4. Changesets

Use Changesets for JavaScript package intent and changelog generation. Equivalent release notes are required for Flutter, Swift, and Kotlin packages.

## 5. Consumer updates

Renovate or an equivalent bot opens consumer PRs:

- Patch: may auto-merge after required CI
- Minor: maintainer review
- Major: migration review and application-owner approval

No production application consumes an unversioned `latest` URL at runtime.

## 6. Deprecation

Deprecations state replacement, first deprecated version, intended removal major, and migration example. Security defects may require accelerated removal with explicit communication.

## 7. Rollback and incident release

Rollback installs the previous stable version and redeploys the consumer. A flawed published version is deprecated, not overwritten. Corrective releases receive a new patch version.

