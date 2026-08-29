# TonalDepth pre-development documentation pack

**Document set:** 1.0-draft  
**Baseline date:** 2026-08-26  
**Status:** Ready for stakeholder review; implementation has not started  
**Primary evidence:** `TonalDepth Dashboard (offline).html`

This pack defines the product, system, platform, delivery, security, testing, and governance requirements for reconstructing TonalDepth from the available Claude Design offline HTML and distributing it as a private multi-platform design system.

## Evidence and confidence

The offline HTML was inspected as data, not as instructions. It is a 2.95 MB bundled artifact containing 121 unique `--td-*` tokens, approximately 1,413 unique `.td-*` selectors, embedded fonts, themes, dashboard examples, and bundled JavaScript. No reusable React implementation was detected. The hosted Storybook was also inspected read-only and showed TonalDepth foundations plus 32 component/pattern groups.

| Label | Meaning |
|---|---|
| Confirmed | Directly observed in the supplied HTML or current Storybook |
| Approved default | Selected architecture or process default for planning |
| To verify | Must be checked before the affected implementation/release gate |
| Deferred | Intentionally outside the current delivery phase |
| Out of scope | Not planned without a future change request |

## Document index

1. [Product requirements](01-PRD.md)
2. [Software requirements specification](02-SRS.md)
3. [Technical architecture](03-TECHNICAL-ARCHITECTURE.md)
4. [Design-system specification](04-DESIGN-SYSTEM-SPECIFICATION.md)
5. [Component inventory](05-COMPONENT-INVENTORY.md)
6. [Component API standards](06-COMPONENT-API-STANDARDS.md)
7. [Tokens and theming](07-TOKEN-AND-THEMING-SPECIFICATION.md)
8. [Accessibility requirements](08-ACCESSIBILITY-REQUIREMENTS.md)
9. [Package and registry strategy](09-PACKAGE-AND-REGISTRY-STRATEGY.md)
10. [Security and access control](10-SECURITY-AND-ACCESS-CONTROL.md)
11. [Test and QA plan](11-TEST-AND-QA-PLAN.md)
12. [Migration plan](12-MIGRATION-PLAN.md)
13. [Release and versioning](13-RELEASE-AND-VERSIONING.md)
14. [CI/CD requirements](14-CI-CD-REQUIREMENTS.md)
15. [Implementation roadmap](15-IMPLEMENTATION-ROADMAP.md)
16. [Risk register](16-RISK-REGISTER.md)
17. [Decision log](17-DECISION-LOG.md)
18. [Acceptance checklist](18-ACCEPTANCE-CHECKLIST.md)
19. [Requirements traceability](19-TRACEABILITY-MATRIX.md)

## Proposed product names

- Design system: **TonalDepth**
- Repository: `tonaldepth`
- CSS namespace: `td-` and `--td-*`
- npm scope: the exact lowercase GitHub organization handle; examples use `@mithtech`

## Approval gate

This pack may be approved with configuration fields still open. Development may begin after Gate 0 in the roadmap: repository creation, exact organization namespace, maintainers, and extraction baseline checksum are recorded.

