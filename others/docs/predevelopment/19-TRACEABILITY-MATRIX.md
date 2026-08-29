# Requirements traceability matrix

| Requirement group | Design/architecture source | Verification | Release gate |
|---|---|---|---|
| PRD-OBJ-* | PRD, architecture | Stakeholder review and release outcomes | Pre-development / 1.0 |
| FR-TOK-* | Token specification, architecture | Schema/generator tests and diff check | Core package |
| FR-THM-* | Token/theming specification | Theme visual and runtime tests | Core package |
| FR-CMP-* | Component API and design specification | Unit, interaction, accessibility, catalog | Per component/platform |
| FR-DOC-* | Documentation requirements | Storybook/catalog build and content audit | Platform release |
| FR-PKG-* | Registry and release plans | Private install, publish, upgrade, rollback | Package release |
| NFR-COMP-* | Platform architecture | Clean-consumer production builds | Platform release |
| NFR-PERF-* | Package architecture | Bundle/CSS/font reports | Stable release |
| NFR-REL-* | CI/CD and release plans | Reproducibility and rollback rehearsal | Stable release |
| NFR-MNT-* | Repository/API standards | Code review and generated-file checks | Pull request |
| SEC-* | Security plan | Permission, secret, scan, access tests | Security gate |
| A11Y-* | Accessibility plan | Automated and manual platform checks | Component/stable release |

## Evidence policy

Each verification record shall include requirement ID, version/commit, environment, method, result, evidence link/path, verifier, and date. A successful build does not prove visual fidelity, accessibility, installation, or production deployment unless those are separately verified.

## Change control

Requirement changes update this matrix and the affected acceptance gate in the same pull request. A requirement may not be deleted merely because implementation is difficult; it must be superseded, deferred, or removed through an approved scope decision.

