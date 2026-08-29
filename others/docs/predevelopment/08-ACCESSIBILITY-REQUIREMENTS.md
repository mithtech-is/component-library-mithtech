# Accessibility requirements

## 1. Standard

Web targets WCAG 2.2 AA. Native implementations target equivalent Apple and Android accessibility expectations. Accessibility requirements may justify documented visual deviations from the source artifact.

## 2. Universal requirements

- Meaning is not conveyed by colour alone.
- Every interactive control has an accessible name, role, state, and value where applicable.
- Disabled, loading, error, success, expanded, and selected states are exposed to assistive technology.
- Content remains usable under supported text scaling and localization expansion.
- Motion respects reduced-motion settings.
- Touch targets meet approved platform minimums.
- Decorative icons are hidden from accessibility APIs; meaningful icons have labels.

## 3. Web requirements

- Full keyboard operation without traps
- Logical focus order
- Visible `:focus-visible` styling
- Focus trapping and restoration for modal dialogs
- Escape and outside-dismiss behavior documented per overlay
- Form labels and error descriptions programmatically associated
- Live regions used only when required and without duplicate announcements
- Reflow at minimum supported viewport without two-dimensional scrolling except legitimate data regions
- Contrast checked per theme and interaction state

## 4. React Native requirements

- Correct `accessibilityRole`, `accessibilityState`, and `accessibilityValue`
- VoiceOver and TalkBack testing
- Dynamic font scaling
- Platform focus order
- Accessible actions for gesture-only interactions
- Reduced motion and screen-reader-aware animation behavior

## 5. Flutter requirements

- `Semantics` coverage
- Traversal/focus order verification
- Text scaling and high-contrast behavior
- TalkBack and VoiceOver testing
- Tooltip or label equivalents for icon-only controls

## 6. iOS requirements

- VoiceOver
- Dynamic Type
- Increase Contrast
- Reduce Motion and Reduce Transparency where relevant
- Button Shapes and differentiate-without-colour considerations
- Switch Control and hardware keyboard for applicable interfaces

## 7. Android requirements

- TalkBack
- Font and display scaling
- Switch Access and keyboard/D-pad where applicable
- Content descriptions and state descriptions
- Minimum touch targets and adequate spacing

## 8. Release blocking

Critical or serious accessibility defects block stable release. Moderate findings require an owner and deadline. Automated checks do not replace manual keyboard and assistive-technology verification.

## 9. Component accessibility record

Each component specification records semantic role, keyboard/touch model, focus behavior, announcements, minimum target, contrast evidence, scaling behavior, reduced-motion behavior, and manual-test date.

