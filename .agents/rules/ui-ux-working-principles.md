# NISHCHIT — GLOBAL WEB APP UI/UX WORKING PRINCIPLES

Treat the following as the permanent design and interaction system for the entire Nishchit web application.
These rules apply to EVERY page, component, modal, drawer, popup, button, form, card, navigation element, notification, loading state, empty state, animation, and responsive layout.

## 1. Core Design Philosophy
- Professional, Modern, Calm, Trustworthy, Warm, Human.
- Never over-designed, cluttered, AI-slop, rainbow colored, or SaaS template.
- Clarity > decoration, hierarchy > density, function > visual gimmicks.

## 2. Visual Hierarchy
- 1 clear primary action per screen.
- Large text for page titles (28–36px), medium for sections (18–24px), body (14–16px), secondary (12–14px), metadata (11–13px).
- Strong contrast for primary actions, muted for secondary information.

## 3. Alignment & Grid
- Strict underlying container grid. Elements in the same section must share left/right alignment, baseline, and spacing.
- No floating or misaligned buttons, uneven card edges, or arbitrary margins.

## 4. Spacing System (4px / 8px Scale)
- `4px`, `8px`, `12px`, `16px`, `20px`, `24px`, `32px`, `40px`, `48px`, `64px`.
- 8–16px inside controls, 16–24px between related elements, 24–32px between sections, 40–64px between major page sections.

## 5. Proportions & Max Widths
- Content should never stretch uncomfortably across ultrawide monitors.
- Mobile: comfortable side padding; text/controls must never touch the screen edge.

## 6. Button Principles & Hierarchy
- Hierarchy: `PRIMARY` (main action, max 1 prominent per screen) | `SECONDARY` | `TERTIARY/GHOST` | `DANGER`.
- Never create 5 competing equal-weight buttons.

## 7. Button Symmetry & Consistency
- Consistent height, horizontal padding, icon size, text baseline, and border radius.
- Paired buttons must share the same height.

## 8. Button States
- Must support: `Default`, `Hover`, `Active/pressed`, `Focus`, `Disabled`, `Loading` (spinner + label), `Success` confirmation.
- Never show an infinite spinner or leave a button looking clickable when inactive.

## 9. Icon Principles
- Lucide icon family throughout.
- Consistent stroke weight, visual size (14–20px), alignment, and spacing.

## 10. Typography
- Modern UI font: Inter. Limited weights: Regular (400), Medium (500), Semibold (600), Bold (700).
- No ALL CAPS text blocks. Short, action-oriented button text.

## 11. Human Copywriting
- Short, direct, clear, human, grammatically correct.
- No technical jargon for parents ("Driver hasn't started the trip yet" vs "Trip initiation status is pending").
- Zero placeholder text (`Lorem ipsum`, `Test`, `Sample`).

## 12. Cards
- Use cards only to group genuinely related information (journeys, vehicles, driver applications, status summaries).
- Never do cards inside cards inside cards.

## 13. Border Radius System
- Small controls: `6–8px`.
- Cards: `10–14px`.
- Large containers & dialogs: `16–20px`.

## 14. Shadows
- Subtle and sparingly used (`--shadow-xs`, `--shadow-sm`, `--shadow-md`).
- Prefer borders, contrast, and spacing over heavy or glowing shadows.

## 15. Color Palette
- Background: `#F7F8FA`
- Surface: `#FFFFFF`
- Primary text: `#172033`
- Secondary text: `#667085`
- Border: `#E4E7EC`
- Primary action: `#2563EB` (hover: `#1D4ED8`)
- Success: `#16A34A`
- Warning: `#D97706`
- Danger: `#DC2626`
- No neon cyan, excessive purple gradients, glowing buttons, or glassmorphism.

## 16 & 17. Forms & Inputs
- Always visible labels above controls (never placeholder-only).
- Validation errors explain WHAT is wrong and HOW to fix it.
- Full state coverage: Empty, Focused, Filled, Disabled, Error, Valid, Loading.

## 18 & 19. Modals & Popups
- Focused tasks only (confirmation, critical actions, short forms).
- Structure: Title + Short explanation + Content + Actions.
- Smooth subtle entrance (180–250ms fade + scale 98%→100% + translateY 4–8px→0).

## 20, 21, 22. Drawers, Dropdowns, Tooltips
- Natural edge slide, context preserved, clear close action.
- Dropdowns appear close to triggers with opacity + slight vertical movement.
- Tooltips only for unfamiliar icons; never replace proper labels.

## 23, 24, 25, 26. Feedback, Skeletons, Empty & Error States
- Toasts for short-lived events (auto-dismiss, dismissible).
- Skeletons resembling final layout; spinners for short actions.
- Empty states explain: 1. What is missing? 2. Why is it empty? 3. What can the user do?
- Error states: Human explanation, recovery action, retry button. Never raw `FirebaseError: PERMISSION_DENIED`.

## 27, 28, 29. Animation & Transitions
- GPU-friendly properties only (`opacity`, `transform: translate/scale`).
- Standard transitions: `150–250ms`. Larger transitions: `300–500ms`.
- Subtle page navigation transitions. Every new piece of content has an intentional entrance.

## 30, 31, 32. Responsive Design & Mobile Touch
- Deliberate layouts for Desktop, Tablet, Mobile.
- Min 44px touch targets. No horizontal overflow, no clipped text, no broken maps.
- Strict `overflow-x: hidden` globally.

## 33, 34, 35, 36. Maps, Real Data, and Status Design
- Maps support the journey, never dominate or fabricate movement/ETA.
- Zero fake data in production. Beautiful empty states instead of mock telemetry.
- Status design uses text + icon + color (`LIVE`, `SCHEDULED`, `COMPLETED`, `PENDING`, `APPROVED`, `REJECTED`, `GPS UNAVAILABLE`, `OFFLINE`).
- Real-time updates isolate to the affected component without reloading the page.

## 37, 38, 39, 40. Confirmation, Feedback, Accessibility & Reduced Motion
- Confirm destructive actions (`End trip`, `Delete vehicle`, `Reject driver`).
- Every action produces visual pressed/loading/success feedback.
- Accessible keyboard nav, visible focus rings, sufficient contrast, and `prefers-reduced-motion` compliance.

## 41, 42. Brand Entrance & Seamless Auth
- Startup brand entrance runs once per session on public root entry; returning and authenticated users bypass it directly to dashboard.
- Auth feels native to the app with consistent typography, branding, and styling.

## 47, 48. Role-Tailored Information Density
- Parent: Calm, simple, journey-focused.
- Driver: Clean, high-contrast, action-oriented duty cockpit.
- Admin: Structured, operational, and telemetry-focused.

## 50, 51. Design Tokens & Layering
- All design tokens centralized in CSS variables.
- Strict z-index hierarchy: Base → Sticky Nav (50) → Dropdowns (100) → Drawers (200) → Modal Backdrop (500) → Modal (600) → Toasts (1000).

## 54, 55, 56. No AI-Slop & No Dead UI
- Zero gradient blobs, glowing borders, floating neon glass, or meaningless charts.
- Every visible button MUST do something.
- Zero simulated GPS or fake product behavior in production.
