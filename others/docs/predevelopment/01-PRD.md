# Product requirements document

## 1. Product definition

TonalDepth will be a private, versioned, multi-platform design-system product reconstructed from the existing Claude Design HTML and documented system. It will provide canonical design tokens, reusable components, platform-native adapters, documentation, automated testing, and controlled updates.

## 2. Problem

The current system is expressed primarily as bundled HTML, CSS, JavaScript, and documentation. It is visually rich but cannot be reliably installed, typed, upgraded, tested, or consumed across frameworks. Teams would otherwise copy markup and styles, causing drift and repeated implementation work.

## 3. Objectives

- PRD-OBJ-001: Preserve the approved TonalDepth visual language.
- PRD-OBJ-002: Establish a single version-controlled source of truth.
- PRD-OBJ-003: Make tokens and components privately installable.
- PRD-OBJ-004: Support controlled, testable upgrades across consuming projects.
- PRD-OBJ-005: Provide native developer experiences for each supported platform.
- PRD-OBJ-006: Meet WCAG 2.2 AA and corresponding native accessibility expectations.
- PRD-OBJ-007: Prevent unreviewed global changes from silently reaching production applications.

## 4. Users

| User | Need |
|---|---|
| Product designer | Consistent tokens, anatomy, states, and usage rules |
| Web developer | CSS and framework-native components with types |
| Mobile developer | Native components and generated platform tokens |
| Application owner | Predictable releases and rollback |
| Maintainer | Automated testing, documentation, and publishing |
| Security administrator | Private access and auditable package permissions |

## 5. Supported platforms

### Target platform portfolio

- Plain HTML/CSS
- React
- Next.js
- Vue and Nuxt
- Angular
- Svelte and SvelteKit
- React Native and Expo using NativeWind
- Flutter
- Native iOS using SwiftUI first, UIKit compatibility where justified
- Native Android using Jetpack Compose first, Android Views compatibility where justified

Support is phased; inclusion in the portfolio does not mean simultaneous first release.

## 6. Product scope

### In scope

- Canonical, platform-neutral tokens
- Web CSS foundation
- Typed web-framework components
- Native mobile tokens and components
- Light/dark themes, brand mode, and density modes
- Fonts, icons, accessibility, and motion rules
- Private package distribution
- Existing Storybook migration for web documentation
- Native catalog applications for mobile
- Semantic versioning, changelogs, migrations, and update automation

### Out of scope for initial delivery

- Visual redesign of TonalDepth
- Public package distribution
- Application business logic, networking, or data persistence
- Drag-and-drop page builder
- Automatic conversion of arbitrary HTML into production components
- Simultaneous full component parity on every platform
- Unreviewed automatic production deployment to consumer applications

## 7. Success measures

- PRD-KPI-001: Clean Next.js and Vite projects install and build the web packages without manual source copying.
- PRD-KPI-002: At least one real web application completes pilot adoption.
- PRD-KPI-003: Core visual regression baselines pass for light/dark and supported density modes.
- PRD-KPI-004: No critical automated accessibility violations in stable components.
- PRD-KPI-005: A patch release produces upgrade PRs and a tested rollback.
- PRD-KPI-006: Native pilots render the same semantic tokens with approved platform adaptations.
- PRD-KPI-007: Storybook/catalog documentation references the same released source as packages.

## 8. Delivery principles

1. Tokens and specifications are shared; component implementations are platform-native.
2. Existing `.td-*` and `--td-*` APIs remain compatible through web version 1.x unless a security or accessibility defect requires change.
3. Static components avoid unnecessary runtime dependencies.
4. Complex behavior uses established accessible platform primitives.
5. Release evidence distinguishes implemented, verified, prepared, blocked, and deferred states.

## 9. Stakeholders and governance

The organization must assign named owners for design approval, frontend API approval, mobile approval, registry administration, security, and release management. One individual may initially hold several roles, but responsibilities must be recorded in repository ownership files.

## 10. Product release definition

Version 1.0 of the web foundation is complete only when the acceptance checklist passes for core CSS, React, Next.js, private npm publishing, Storybook, accessibility, updates, and rollback. Other platform releases have independent readiness gates and must not block the first usable web release.

