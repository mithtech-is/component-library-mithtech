# Risk register

| ID | Risk | Likelihood | Impact | Mitigation | Owner |
|---|---|---:|---:|---|---|
| R-001 | Bundled HTML loses original component/file boundaries | High | High | Forensic inventory, visual fixture, human classification | Engineering |
| R-002 | Storybook and HTML disagree on fonts/tokens | High | High | Formal source-of-truth and font-role approval gate | Design |
| R-003 | All selectors are treated as public API | Medium | High | Explicit public/internal classification; 1.x compatibility aliases | Engineering |
| R-004 | Multi-platform scope delays first usable release | High | High | Phased releases with independent gates | Product |
| R-005 | Web depth effects do not translate natively | High | Medium | Semantic depth mapping and platform-approved approximations | Design/mobile |
| R-006 | Font binaries lack verified redistribution evidence | Medium | High | Verify exact files and include license notices before publication | Legal/maintainer |
| R-007 | Storybook remains publicly reachable | High | Medium | Identity-aware access gateway before private launch | Security |
| R-008 | GitHub package token setup burdens developers | Medium | Medium | Onboarding script/docs and support runbook | Developer experience |
| R-009 | Package updates break multiple applications | Medium | High | Semantic versions, upgrade PRs, consumer CI, rollback | Release owner |
| R-010 | Framework adapters drift semantically | High | High | Shared specifications, token generation, parity reviews | Platform leads |
| R-011 | Accessibility behavior is copied from static HTML | Medium | High | Headless/native primitives and manual accessibility testing | Accessibility owner |
| R-012 | Package contains unintended assets/secrets | Low | Critical | Files allowlist, pack inspection, secret scanning | Security |
| R-013 | NativeWind unsupported CSS creates silent visual loss | High | Medium | Supported-subset mapping, custom native utilities, device tests | RN lead |
| R-014 | Framework/version churn destabilizes adapters | Medium | Medium | Declared support matrix, peer ranges, scheduled upgrades | Platform leads |
| R-015 | No named approver causes unresolved decisions | Medium | High | Gate 0 owner assignment and CODEOWNERS | Product owner |

Risks are reviewed at each release gate. Closed risks retain evidence and closure rationale.

