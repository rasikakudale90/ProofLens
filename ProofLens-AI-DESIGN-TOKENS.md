# ProofLens AI — Frontend Design Tokens

**Version:** 1.0  
**Status:** Approved design direction for frontend implementation  
**Product:** ProofLens AI — From Documents to Verifiable Answers  
**Primary reference:** Dribbble — “Chatbot UI – AI Web Assistant” by Ronas IT  
**Purpose:** Give the Antigravity agent concrete, implementation-ready visual and interaction rules for the ProofLens frontend.

---

## 1. Design Intent

Build ProofLens as a **document-first investigation workstation**, not a generic AI chatbot or generic AI SaaS dashboard.

The reference contributes a calm workspace structure, restrained warm-neutral surfaces, clear navigation, and contextual side panels. Adapt the concept to evidence analysis rather than copying the coding-assistant content.

### Product design principles

1. **Evidence before confidence:** source passages and citations must be visually prominent.
2. **Document-first:** the uploaded document and its evidence are primary; chat is only one way to query them.
3. **Traceability:** every displayed citation should be actionable and lead to the associated source page or excerpt.
4. **Analytical clarity:** claim states, disagreements, uncertainty, and limitations must be distinguishable without relying on color alone.
5. **Quiet confidence:** no neon gradients, glowing orbs, AI sparkles as decoration, oversized marketing gradients, or gratuitous glassmorphism.
6. **Information density with breathing room:** provide enough data for serious analysis without making the interface cramped.
7. **Responsive by design:** preserve evidence access on laptop, tablet, and mobile web.

### Visual personality

- Editorial, investigative, precise, understated, and trustworthy.
- Warm paper-like light mode paired with a charcoal/ink dark mode.
- Rust/copper accent for primary actions and active navigation; restrained blue for links and focus.
- Typography-led, thin dividers, modest radii, low-elevation surfaces.
- Functional transitions only; avoid distracting motion.

---

## 2. Product Scope and Navigation

The frontend should expose the six approved MVP capabilities, backed by the backend API:

1. Smart Document Library
2. Evidence-First AI Assistant
3. Claim Evidence Ledger
4. Contradiction Radar
5. Research Brief Generator
6. Trust & Evaluation Dashboard

### Recommended application navigation

Use a compact left sidebar on desktop:

- **Workspace**
  - Overview (optional only if useful; do not invent a complex dashboard)
- **Documents**
  - Document Library
- **Investigate**
  - Evidence Assistant
  - Claim Evidence Ledger
  - Contradiction Radar
- **Outputs**
  - Research Briefs
- **Quality**
  - Trust & Evaluation

Include:
- Workspace/document scope selector where relevant.
- Theme toggle (light/dark).
- User/workspace control only if the backend actually supports authentication/workspaces.
- Clear upload action.
- Consistent page titles and contextual descriptions.

Do not create non-functional navigation items or fabricate metrics/data. If an API capability is not implemented yet, clearly label the UI as unavailable/in development or keep it out of the active navigation.

---

## 3. Layout System

### 3.1 Desktop application shell

- Use a three-zone workspace when it improves the current task:
  1. **Left navigation:** stable, compact.
  2. **Main work area:** PDF, answer, claim table, or comparison content.
  3. **Evidence/context inspector:** citations, source excerpts, claim details, or metadata.
- Do not force every page into three columns. Library, brief, and evaluation pages may use a wider main canvas.
- Sidebar expanded width: `248px`.
- Sidebar collapsed width: `72px`.
- Main content max width for standard pages: `1440px`.
- Standard page padding: `28px` desktop, `20px` tablet, `16px` mobile.
- Header height: `64px`.
- Main grid gap: `20px`.
- Evidence inspector width: `320px` to `400px`.
- Use `min-width: 0` on flexible panels to prevent overflow.

### 3.2 Responsive behavior

**Desktop (≥ 1280px)**
- Show left sidebar and contextual inspector when useful.
- Document analysis may use document/answer area plus evidence inspector.
- Keep line lengths comfortable; avoid full-screen text lines.

**Laptop / small desktop (1024–1279px)**
- Sidebar may collapse to icon rail.
- Evidence inspector may become a drawer or narrower panel.
- Keep key actions visible without horizontal scrolling.

**Tablet (768–1023px)**
- Use collapsible navigation.
- Convert the evidence inspector to a drawer or a tabbed panel.
- Stack analysis sections when three columns become cramped.
- Use horizontal scrolling only for inherently tabular content, not for the whole page.

**Mobile (< 768px)**
- Single-column primary layout.
- Sidebar becomes a navigation drawer.
- Evidence inspector becomes a bottom sheet or full-screen panel.
- Show document, answer, and evidence as explicit tabs or stacked sections.
- Tables may scroll horizontally within their own container.
- Touch targets should be at least `44px`.
- Avoid fixed three-column layouts, tiny metadata, and hover-only actions.
- Respect reduced-motion preferences.

### 3.3 Spacing scale

Use a 4px base scale:

| Token | Value | Use |
|---|---:|---|
| `space-0` | `0px` | Reset |
| `space-1` | `4px` | Icon/text micro gap |
| `space-2` | `8px` | Tight inline spacing |
| `space-3` | `12px` | Compact control gap |
| `space-4` | `16px` | Standard control/card spacing |
| `space-5` | `20px` | Panel/grid gap |
| `space-6` | `24px` | Section spacing |
| `space-7` | `28px` | Desktop page padding |
| `space-8` | `32px` | Large section spacing |
| `space-10` | `40px` | Section separation |
| `space-12` | `48px` | Major layout separation |
| `space-16` | `64px` | Large page-level separation |

---

## 4. Color Tokens

Use semantic tokens throughout components. Do not hardcode colors repeatedly in components. Implement these as CSS custom properties and connect them to Tailwind/shadcn theme variables if those are used.

The palette below is a concrete design-system proposal based on the chosen reference direction; it is not a claim about the exact original Dribbble source colors.

### 4.1 Light theme

| Token | Hex | Purpose |
|---|---|---|
| `--background` | `#F5F1EA` | Warm paper app background |
| `--foreground` | `#252522` | Main text |
| `--surface` | `#FFFDFA` | Main cards/panels |
| `--surface-muted` | `#EEE8DF` | Secondary panels and selected rows |
| `--surface-raised` | `#FFFFFF` | Menus, popovers, dialogs |
| `--border` | `#DED7CC` | Dividers and panel outlines |
| `--border-strong` | `#C6BCAF` | Stronger separation |
| `--muted` | `#746F67` | Secondary text |
| `--muted-foreground` | `#746F67` | Metadata and helper text |
| `--primary` | `#A95532` | Rust/copper primary action |
| `--primary-hover` | `#8F4528` | Primary hover |
| `--primary-foreground` | `#FFFFFF` | Text on primary action |
| `--accent` | `#E8D5C8` | Soft rust-tinted emphasis |
| `--accent-foreground` | `#59311F` | Text on accent |
| `--link` | `#315C78` | Source links and citations |
| `--focus-ring` | `#527C98` | Keyboard focus |
| `--success` | `#426B50` | Supported/success |
| `--success-soft` | `#DDE8DF` | Supported background |
| `--warning` | `#91651B` | Partial/uncertain |
| `--warning-soft` | `#F2E2BE` | Warning background |
| `--danger` | `#963F38` | Contradiction/error |
| `--danger-soft` | `#EBD8D5` | Danger background |
| `--info` | `#315C78` | Informational states |
| `--info-soft` | `#DCE7ED` | Informational background |
| `--overlay` | `rgba(37, 37, 34, 0.42)` | Modal/backdrop |

### 4.2 Dark theme

| Token | Hex | Purpose |
|---|---|---|
| `--background` | `#191A19` | Main application background |
| `--foreground` | `#F0EDE7` | Main text |
| `--surface` | `#222421` | Main panels |
| `--surface-muted` | `#2A2C28` | Secondary panels |
| `--surface-raised` | `#30322E` | Menus and raised surfaces |
| `--border` | `#3A3C36` | Dividers and outlines |
| `--border-strong` | `#50534B` | Stronger separation |
| `--muted` | `#B0ADA4` | Secondary text |
| `--muted-foreground` | `#B0ADA4` | Metadata and helper text |
| `--primary` | `#D18A67` | Warm copper action |
| `--primary-hover` | `#E0A080` | Primary hover |
| `--primary-foreground` | `#211B17` | Text on primary |
| `--accent` | `#49352C` | Soft rust-tinted emphasis |
| `--accent-foreground` | `#F1D9CA` | Text on accent |
| `--link` | `#9FC6E0` | Source links and citations |
| `--focus-ring` | `#9FC6E0` | Keyboard focus |
| `--success` | `#8EC49A` | Supported/success |
| `--success-soft` | `#293B2E` | Supported background |
| `--warning` | `#E0BB6E` | Partial/uncertain |
| `--warning-soft` | `#443921` | Warning background |
| `--danger` | `#E39A91` | Contradiction/error |
| `--danger-soft` | `#472B29` | Danger background |
| `--info` | `#9FC6E0` | Informational states |
| `--info-soft` | `#293943` | Informational background |
| `--overlay` | `rgba(0, 0, 0, 0.62)` | Modal/backdrop |

### 4.3 Color rules

- Default to light theme on first visit unless product settings specify otherwise.
- Provide a working light/dark toggle; persist preference only through an existing approved preference mechanism, otherwise use a sensible client-side default.
- Do not use gradients as the main background or primary brand effect.
- Do not use purple/blue neon glows, blurred color blobs, or decorative aurora effects.
- Status colors must always be paired with explicit text labels or icons; never rely on color alone.
- Use the rust primary color sparingly for primary actions and active states, not for every link or badge.
- Source citations should look interactive and clearly distinct from normal body text.

---

## 5. Typography

Use a restrained, editorial typographic system. Prefer installed project fonts if already configured; otherwise use a reliable sans-serif for the interface and a readable serif only where it materially improves document/brief reading. Avoid introducing external font dependencies without need.

Suggested stack:
- UI: `Inter`, `ui-sans-serif`, `system-ui`, `-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, sans-serif.
- Optional document/brief reading: `Georgia`, `ui-serif`, serif.

| Token | Size | Line height | Weight | Use |
|---|---:|---:|---:|---|
| `--text-xs` | `12px` | `16px` | 400–500 | Dense metadata |
| `--text-sm` | `13px` | `20px` | 400–500 | Labels, table metadata |
| `--text-base` | `14px` | `22px` | 400 | Standard app text |
| `--text-md` | `15px` | `24px` | 400 | Long-form workspace text |
| `--text-lg` | `18px` | `28px` | 500–600 | Card headings |
| `--text-xl` | `22px` | `30px` | 600 | Page subheadings |
| `--text-2xl` | `28px` | `36px` | 600 | Page title |
| `--text-3xl` | `36px` | `44px` | 600 | Landing/overview headline only |
| `--text-4xl` | `44px` | `52px` | 600 | Marketing-only hero, if one exists |

Rules:
- The authenticated/product workspace should use `14–15px` body text, not oversized landing-page typography.
- Use sentence case for labels and buttons.
- Avoid excessive uppercase labels and letter spacing.
- Use tabular numerals for counts, durations, and metrics.
- Citation numbers and page references should remain legible at `12px` minimum.
- Use semibold for hierarchy rather than heavy bold everywhere.

---

## 6. Shape, Borders, Elevation

| Token | Value | Use |
|---|---:|---|
| `--radius-sm` | `4px` | Small tags, compact controls |
| `--radius-md` | `7px` | Inputs, buttons, small cards |
| `--radius-lg` | `10px` | Panels, standard cards |
| `--radius-xl` | `14px` | Dialogs and large feature surfaces |
| `--radius-pill` | `999px` | Status pills only where appropriate |
| `--border-width` | `1px` | Standard borders |

- Prefer outlined panels and clear dividers over stacked floating cards.
- Use shadows sparingly: primarily for menus, dialogs, and draggable overlays.
- Avoid excessive rounding (`20px+`) on every element.
- Avoid glass panels, backdrop blur, and translucent card stacks as the default style.
- Separate surfaces with background and border changes rather than shadows everywhere.

---

## 7. Components and Interaction Tokens

### Buttons

- Minimum height: `40px` desktop, `44px` touch layouts.
- Horizontal padding: `14px`.
- Border radius: `7px`.
- Primary: solid `--primary` with `--primary-foreground`.
- Secondary: surface background, 1px border.
- Tertiary/ghost: transparent background, subtle hover.
- Destructive: danger semantic colors.
- Show loading state and prevent duplicate submission for network actions.
- Never leave visible buttons inert.

### Inputs and search

- Minimum height: `40px` desktop and `44px` on touch devices.
- Border: `1px solid var(--border-strong)`.
- Background: `--surface`.
- Focus: visible `2px` focus ring using `--focus-ring`.
- Search should support clear loading, empty, no-result, and error states.

### Panels and tables

- Panel padding: `16–20px`.
- Table row height: `44–52px`.
- Keep column labels visible and aligned.
- Use subtle row hover and selected states.
- Use monospace only for IDs, hashes, technical metadata, and code.
- On mobile, constrain horizontal scrolling to the table container.

### Status chips

Use explicit labels:
- `Supported`
- `Partially supported`
- `Contradicted`
- `Insufficient evidence`
- `Processing`
- `Ready`
- `Failed`

Use semantic background/foreground tokens and a small icon where helpful. Do not invent numeric confidence scores unless the backend supplies a defined, meaningful score.

### Citations and source excerpts

- Citation affordance: link-styled text or compact outlined chip, not a decorative badge.
- Include document title or short name and page number wherever available.
- Hover/focus can preview a short excerpt on desktop; clicking opens the evidence inspector or document page.
- Clearly differentiate a model-generated statement from its supporting source passage.
- Display the exact source excerpt without silently rewriting it.
- If no valid citation exists, do not render a fake citation placeholder as if it were real.

### Motion

- Standard transition: `120–180ms` for hover/focus and panel changes.
- Avoid bouncy motion, constant animation, animated gradients, and decorative particle effects.
- Respect `prefers-reduced-motion`.
- Use animation only when it clarifies state changes or navigation.

---

## 8. Core Screen Specifications

### 8.1 Document Library

- Main canvas should be a document list/table with a clear upload action.
- Each document row should show title, file type, page count if known, upload date if available, processing state, and available actions.
- Include search/filter only when backed by actual functionality.
- Upload flow must show validation, progress/processing state, success, and failure.
- Include an intentional empty state with a primary “Upload PDF” action.
- Support selecting one or more documents for scoped analysis if the backend supports it.
- Confirm destructive deletion and communicate what data will be removed.
- Never fabricate documents, processing progress, page counts, or dates.

### 8.2 Evidence Assistant — Primary Workspace

Use the signature three-zone layout on wide screens:

1. **Left navigation/document scope:** selected documents and quick navigation.
2. **Main conversation/answer canvas:** user question, answer, answer status, and follow-up input.
3. **Evidence inspector:** citations, page references, exact source excerpts, and selected-source metadata.

Behavior:
- The user must be able to choose the document scope before asking a question.
- Each answer should expose its citations close to the claims they support.
- Selecting a citation should open the corresponding page/excerpt in the evidence inspector or PDF viewer.
- Show an explicit insufficient-evidence response when returned by the API.
- Distinguish loading, success, partial answer, insufficient evidence, and API failure.
- Do not present fabricated typing indicators, source documents, citations, or confidence values.
- Do not make the chat column visually dominate the evidence panel.

### 8.3 Claim Evidence Ledger

- Use a readable table or structured list rather than a grid of oversized cards.
- Suggested columns: claim, status, evidence/source count, source references, and limitations.
- Selecting a claim opens its source passages and related document pages.
- Display the four canonical statuses exactly as defined by the backend.
- Make uncertainty and missing evidence explicit.
- Do not imply automated assessment is a guarantee of objective truth.

### 8.4 Contradiction Radar

- Begin with selection of at least two documents.
- Show candidate conflicting claims side by side, with a source excerpt and page reference for each side.
- Include context such as publication date, scope, definition, and methodology when available.
- Allow statuses such as potential disagreement or unresolved comparison if the backend supports them.
- Do not force a contradiction where sources are compatible or insufficient.
- Use a comparison table or aligned evidence panels, not decorative network graphs by default.

### 8.5 Research Brief Generator

- Present a structured, readable report: summary, findings, supporting citations, disagreements, and limitations.
- Keep citations accessible and linked to evidence.
- Offer Markdown export only when implemented by the backend/UI.
- If PDF export is not implemented, do not display a misleading working export button; browser print-to-PDF may be offered if properly supported.
- Provide a clear empty state before a brief is generated.

### 8.6 Trust & Evaluation Dashboard

- Show only metrics that the backend actually computes and returns.
- Label metric definitions, evaluation sample size, and evaluation time where available.
- Distinguish unavailable data from a zero score.
- Include retrieval quality, citation validity, abstention behavior, latency, and provider/API errors as supported by the backend.
- Do not create decorative charts with mock values in production screens.
- For development previews, any fixture data must be explicitly labeled as sample/demo data.

---

## 9. Shared States and Feedback

Every data-driven screen should handle:

- Initial loading.
- Empty state.
- Partial data.
- Success.
- Validation error.
- Network/API error.
- Permission/unauthorized state if auth exists.
- Processing state for long-running ingestion.
- Retry where the operation is safe.

Use concise, human-readable messages. Do not expose raw stack traces, provider secrets, or sensitive document content in errors.

For long-running ingestion:
- Show the real backend status when available.
- If polling is implemented, use bounded polling and stop when a terminal status is reached.
- Do not simulate completion or invent percentage progress when the backend provides no progress metric.

---

## 10. Accessibility

- Use semantic HTML and correct heading hierarchy.
- All actions must be keyboard accessible.
- Provide visible keyboard focus.
- Meet WCAG AA contrast for normal text where practical.
- Do not rely on color alone for evidence statuses.
- Use labels for inputs and accessible names for icon-only buttons.
- Announce important asynchronous state changes to assistive technology.
- Support zoom and narrow viewports without clipping core actions.
- Respect reduced-motion settings.

---

## 11. Implementation Rules for Antigravity

1. **Inspect before implementing.** Read the PRD, `ProofLens-AI-Backend-SRS-v1.0.md`, repository structure, current package versions, and existing components.
2. **Backend is the current priority.** Do not begin frontend implementation until the owner authorizes frontend work or confirms the backend milestone is ready.
3. When frontend implementation is authorized, implement these tokens as shared CSS variables and semantic component tokens; do not scatter hex values across components.
4. Reuse the project's installed component library if it exists. If shadcn/ui is installed, adapt its semantic tokens rather than creating a parallel design system.
5. Follow the installed Next.js version's local documentation and the repository's `AGENTS.md`; do not assume APIs from memory.
6. Build responsive layouts from the start. Test desktop, tablet, and mobile behavior.
7. Connect UI states to actual backend responses. Never fabricate API data, metrics, citations, progress, or success messages.
8. Use realistic fixture data only in clearly marked development/demo states.
9. Implement light and dark modes and verify contrast in both.
10. Keep components modular and domain-oriented: documents, evidence, citations, claims, comparisons, briefs, and evaluation.
11. Do not add decorative gradients, neon glows, floating AI orbs, excessive glassmorphism, or generic AI landing-page visuals.
12. Before reporting completion, run the available lint/type-check/tests and report exact results. Do not claim tests were run if they were not.

---

## 12. Acceptance Checklist

The frontend design implementation is acceptable only when:

- [ ] It feels like a professional investigation/research workstation, not a generic AI dashboard.
- [ ] Light mode uses warm paper-like neutrals and ink typography.
- [ ] Dark mode uses charcoal/ink surfaces with appropriate contrast.
- [ ] Rust/copper is restrained to primary actions and key active states.
- [ ] No neon gradients, glowing orbs, or gratuitous glassmorphism dominate the UI.
- [ ] The evidence/source panel is first-class and citations are actionable.
- [ ] Claim statuses are text-labeled and not communicated by color alone.
- [ ] Document scope is clear before a question is submitted.
- [ ] The six MVP areas are represented only to the degree their backend functionality exists.
- [ ] Loading, empty, error, insufficient-evidence, and success states are designed.
- [ ] Layout adapts to desktop, tablet, and mobile web.
- [ ] Keyboard focus and reduced-motion preferences are supported.
- [ ] No fabricated data or fake functionality is present.
- [ ] The owner is told about any deviations or unfinished states.

---

## 13. Source and Assumptions

- The supplied Dribbble reference is a visual/information-architecture inspiration, not a requirement to clone its exact screen.
- The exact source design tokens are not provided by the Dribbble link. The hex values in this file are a concrete proposed palette for ProofLens based on the agreed warm-neutral/rust/ink direction.
- Product requirements and API capabilities must follow the current ProofLens PRD and Backend SRS.
- If an API endpoint or feature is not available, do not fake the behavior. Implement the backend first, show a clearly disabled/unavailable state, or ask the owner which scope to prioritize.

## 14. Calling Me by My Name

- Address the user as **Rasika** when speaking directly to them.
- Use the name naturally and respectfully; do not force it into every sentence.
