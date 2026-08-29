# Local documentation decision

## Decision

The custom TonalDepth app in `apps/docs` is the primary local developer experience. It provides installation guidance, live React examples, copyable source snippets, component status, and API summaries.

## Status

- Confirmed: the offline HTML remains the canonical visual baseline.
- Implemented: a local documentation shell using the real TonalDepth React package.
- Verified: TypeScript and Vite production build, desktop rendered state, component navigation, search filtering, dark theme, mobile collapse, and browser console checks.
- Prepared: framework guides can expand as their packages mature.
- Deferred: Storybook integration and package publishing.
- Blocked: none for local documentation.

The app must not present prepared or deferred platform work as production-ready. Registry installation becomes canonical only after packed-consumer and GitHub Packages verification.

## Registry direction

TonalDepth follows a hybrid distribution model inspired by Watermelon UI:

- Package mode keeps components centrally maintained.
- Registry mode copies selected component source into the consuming project.
- The Button registry item is the first local end-to-end slice.
- Expanding registry coverage is required before claiming the full catalog is Watermelon-style ready.
