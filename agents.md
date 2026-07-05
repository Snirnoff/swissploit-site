# AGENTS.md

## Project
Swissploit marketing website.
Stack is plain HTML, CSS, and vanilla JavaScript.
Do not introduce frameworks, bundlers, or heavy dependencies unless explicitly requested.

## Goals
The site should feel premium, modern, calm, and trustworthy.
Improve perceived quality through layout, hierarchy, motion, spacing, and consistency.
Prefer subtle, high-end interactions over flashy effects.

## Working style
Before changing code:
1. Inspect the relevant HTML, CSS, and JS.
2. Explain the plan briefly.
3. Make focused edits.
4. Keep the codebase simpler after changes, not more complex.

## Constraints
- Keep the site static and easy to deploy.
- Preserve existing brand identity and dark/light theme support.
- Preserve performance and accessibility.
- Avoid unnecessary JavaScript.
- Avoid scroll-jank and heavy animation libraries.
- Respect `prefers-reduced-motion`.
- Do not add effects just for novelty.

## Design direction
Target feel:
- premium
- minimal
- confident
- Swiss / precise
- technical but not cold

Use:
- stronger spacing rhythm
- better section hierarchy
- cleaner typography
- subtle depth, glow, blur, and motion
- more editorial layouts where appropriate

Avoid:
- clutter
- too many bright accents
- too many competing animations
- oversized paragraphs
- generic feature-card repetition

## Code conventions
- Reuse existing classes and structure where possible.
- Prefer small, targeted CSS additions over large rewrites.
- Remove duplicate logic when touching a related area.
- Keep animation code centralized and readable.
- Keep selectors maintainable and avoid deep nesting.

## Performance and UX
- Animations must feel smooth on mid-range mobile devices.
- Prefer transform and opacity over layout-triggering animation.
- Avoid heavy parallax.
- Any parallax must be subtle and optional.
- Do not autoplay large media unnecessarily.

## Accessibility
- Maintain semantic HTML.
- Preserve keyboard usability.
- Maintain contrast in both themes.
- Ensure motion has a reduced-motion fallback.

## When working on sections
For major section redesigns:
- first improve structure and content hierarchy
- then improve styling
- then add subtle motion only if it supports the section