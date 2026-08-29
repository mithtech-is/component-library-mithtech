# Acceptance checklist

## A. Pre-development gate

- [ ] Exact GitHub organization handle recorded
- [ ] Private repository created
- [ ] Maintainer/read teams configured
- [ ] Design, API, security, and release approvers named
- [ ] Supplied HTML archived with checksum
- [ ] Version-one component scope approved
- [ ] Font-role conflict assigned for decision

## B. Extraction gate

- [ ] All embedded resources inventoried
- [ ] Full token report generated
- [ ] Selector/component candidate report generated
- [ ] Fonts and licenses mapped to exact binaries
- [ ] Page-only styles separated
- [ ] Conflicts documented without silent resolution
- [ ] Reference screenshots stored

## C. Core package gate

- [ ] Canonical token schema validates
- [ ] Generated outputs are deterministic
- [ ] Core CSS package installs privately
- [ ] Existing `td-` compatibility fixture renders
- [ ] Light/dark modes pass
- [ ] Compact/comfortable modes pass
- [ ] Fonts load without unintended external requests
- [ ] Package contains only allowed files

## D. Web 1.0 gate

- [ ] P0/P1 components meet completion criteria
- [ ] Storybook uses package/workspace production source
- [ ] Vite React clean build passes
- [ ] Next.js App Router clean build passes
- [ ] Accessibility release checks pass
- [ ] Visual baselines approved
- [ ] Real web pilot accepted
- [ ] Patch upgrade PR and rollback demonstrated

## E. Framework adapter gate

- [ ] Vue and Nuxt production builds pass
- [ ] Angular production build and forms integration pass
- [ ] Svelte and SvelteKit production builds pass
- [ ] Public APIs and platform differences documented

## F. Cross-platform mobile gate

- [ ] NativeWind supported-subset mapping approved
- [ ] React Native iOS/Android catalogs pass
- [ ] Flutter iOS/Android catalogs pass
- [ ] Text scaling and screen-reader checks pass
- [ ] Native depth adaptations approved

## G. Native platform gate

- [ ] Swift package installs in clean iOS application
- [ ] Compose package installs from private Maven registry
- [ ] Supported OS matrices pass
- [ ] VoiceOver and TalkBack checks pass
- [ ] Snapshot/golden baselines approved

## H. Security and operations gate

- [ ] Storybook rejects unauthenticated access
- [ ] Registry permissions follow least privilege
- [ ] CI publishing credentials are protected
- [ ] Secret/dependency scans pass
- [ ] Release runbook tested
- [ ] Offboarding and access revocation tested

No unchecked section may be represented as complete for its corresponding release.

