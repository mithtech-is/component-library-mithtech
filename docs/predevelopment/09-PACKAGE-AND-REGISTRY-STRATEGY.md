# Package and registry strategy

## 1. JavaScript packages

Publish privately to GitHub Packages under the exact lowercase organization namespace:

```text
@ORG/tonaldepth-tokens
@ORG/tonaldepth-core
@ORG/tonaldepth-react
@ORG/tonaldepth-vue
@ORG/tonaldepth-angular
@ORG/tonaldepth-svelte
@ORG/tonaldepth-nativewind
@ORG/tonaldepth-react-native
@ORG/tonaldepth-icons
@ORG/tonaldepth-charts
```

React supports Next.js; Vue supports Nuxt; Svelte supports SvelteKit. Optional framework modules may be added only for configuration automation.

## 2. Other platforms

| Platform | Initial distribution |
|---|---|
| Flutter | Private Git dependency pinned to tag/commit |
| iOS | Swift Package Manager from private repository |
| Android | Private Maven-compatible GitHub Package |

## 3. npm configuration

Committed project configuration contains only the scope mapping:

```ini
@ORG:registry=https://npm.pkg.github.com
always-auth=true
```

Developer credentials remain in user-level configuration/environment. Tokens shall never be committed.

## 4. Package metadata

Every package declares name, version, description, license status, repository, files allowlist, exports, types, side-effects policy, engines, peer dependencies, and publish configuration. Package contents are inspected before publication.

## 5. Dependency versions

- Exact versions are captured by the lockfile.
- Consumer ranges follow compatibility policy.
- Framework runtimes are peers.
- Experimental framework releases are not stable-package requirements without an ADR.

## 6. Package access

Recommended teams:

| Team | Access |
|---|---|
| Organization owners | Admin |
| TonalDepth maintainers | Write |
| Approved developers | Read |
| Consumer CI repositories | Read |
| External collaborators | None unless explicitly approved |

## 7. Installation experience

Each package documents authentication, install, import, theme setup, minimum versions, peer dependencies, and troubleshooting. Clean-consumer smoke tests execute the documented commands.

## 8. shadcn-style registry

A private shadcn registry is deferred for source-owned blocks and templates. Stable primitives remain npm packages so fixes and updates flow through normal dependency upgrades. Registry-copied files are never assumed to update automatically.

