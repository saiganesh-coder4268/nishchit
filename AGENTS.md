# NISHCHIT — GLOBAL WEB APP UI/UX WORKING PRINCIPLES
====================================================

Treat the following as the permanent design and interaction system for the entire Nishchit web application.

These rules apply to EVERY page, component, modal, drawer, popup, button, form, card, navigation element, notification, loading state, empty state, animation, and responsive layout.

Do not treat these as suggestions.
They are the application's design and interaction standards.

----------------------------------------------------
1. CORE DESIGN PHILOSOPHY
----------------------------------------------------

Nishchit must feel:

• Professional
• Modern
• Calm
• Trustworthy
• Warm
• Human
• Youthful without being childish
• Simple without looking empty
• Premium without looking expensive or flashy
• Designed intentionally, not AI-generated

The interface must never feel:

• Over-designed
• Cluttered
• Randomly colorful
• Like a generic SaaS dashboard
• Like an admin template
• Like a mobile app stretched onto desktop
• Like an AI-generated website
• Filled with unnecessary cards
• Filled with giant rounded elements
• Filled with excessive gradients
• Filled with unnecessary animations

The design should communicate confidence and safety.

When deciding between two designs:

PREFER:
clarity > decoration
hierarchy > density
consistency > novelty
function > visual gimmicks
subtlety > excessive animation


----------------------------------------------------
2. VISUAL HIERARCHY
----------------------------------------------------

Every screen must have a clear visual hierarchy.

A user should immediately understand:

1. Where am I?
2. What is the most important information?
3. What should I do next?
4. What happened / what is the current state?
5. What secondary information is available?

Do not give every element equal visual weight.

Use:

• Large text for page titles
• Medium text for sections
• Small text for metadata
• Strong contrast for primary actions
• Muted contrast for secondary information

Avoid:

• Multiple giant headings
• Multiple primary buttons competing with each other
• Everything being bold
• Everything inside cards
• Excessive badges


----------------------------------------------------
3. ALIGNMENT
----------------------------------------------------

Alignment must be deliberate.

Use a consistent page grid.

Elements belonging to the same section must share:

• left alignment
• right alignment
• baseline
• spacing system

Do not randomly center some elements and left-align others.

Forms, headings, buttons, cards, tables and content blocks should align to the same underlying container.

Never create:

• slightly misaligned buttons
• uneven card edges
• inconsistent content widths
• arbitrary margins
• floating elements with no relationship to the grid

If a design looks visually "almost aligned", fix it.


----------------------------------------------------
4. SPACING SYSTEM
----------------------------------------------------

Use a consistent spacing scale throughout the application.

Prefer multiples based around:

4px / 8px spacing.

Typical values:

4
8
12
16
20
24
32
40
48
64

Do not invent random spacing values unless there is a strong reason.

Use:

• 8–16px inside compact controls
• 16–24px between related elements
• 24–32px between sections
• 40–64px between major page sections

Whitespace is intentional.

Do not compress everything just because there is available screen space.


----------------------------------------------------
5. CONTAINERS AND PROPORTIONS
----------------------------------------------------

Content should have reasonable maximum widths.

Do not stretch text-heavy content across the entire screen.

Do not make cards unnecessarily wide.

Do not make important content extremely narrow.

Maintain balanced proportions between:

• navigation
• content
• side panels
• maps
• forms
• tables

For desktop:

Use a stable central content area with consistent horizontal margins.

For mobile:

Content should use nearly the full width while maintaining comfortable side padding.

Never allow text or controls to touch the screen edge.


----------------------------------------------------
6. BUTTON PRINCIPLES
----------------------------------------------------

Buttons are functional controls, not decorative objects.

Every button must have:

• clear purpose
• clear label
• consistent height
• consistent padding
• consistent typography
• predictable interaction
• appropriate hierarchy

Button hierarchy:

PRIMARY
→ Main action of the current screen.

SECONDARY
→ Supporting action.

TERTIARY / GHOST
→ Low-priority action.

DANGER
→ Destructive action.

Do not create five visually equal buttons.

A screen should normally have ONE obvious primary action.

Examples:

GOOD:
[ Start Trip ]

Secondary:
[ View Route ]

Tertiary:
[ More ]

Avoid:

[ Start Trip ] [ View Route ] [ Message ] [ Edit ] [ Cancel ]

all having identical visual weight.


----------------------------------------------------
7. BUTTON SYMMETRY
----------------------------------------------------

Buttons must look geometrically intentional.

Maintain consistent:

• height
• horizontal padding
• icon size
• text baseline
• border radius
• gap between icon and label

Buttons placed beside each other should normally share the same height.

Icon + text spacing should be consistent.

Example:

[ icon  Label ]

not:

[icon      Label]

and another:

[icon Label]


Do not create unnecessarily huge buttons.

Do not use extremely pill-shaped buttons unless the component specifically benefits from it.


----------------------------------------------------
8. BUTTON STATES
----------------------------------------------------

EVERY interactive button must have appropriate states:

• Default
• Hover
• Active/pressed
• Focus
• Disabled
• Loading
• Success where appropriate
• Error where appropriate

Never let a button visually appear clickable if it does nothing.

Never show a loading spinner indefinitely.

When an action is being processed:

Button:
[ Save ]

becomes:

[ spinner Saving... ]

Then:

[ ✓ Saved ]

if a visible confirmation is useful.

Do not navigate away immediately if the user needs confirmation that the action succeeded.


----------------------------------------------------
9. ICON PRINCIPLES
----------------------------------------------------

Use one consistent icon family throughout the application.

Icons must have consistent:

• stroke weight
• visual size
• alignment
• spacing

Do not mix unrelated icon styles.

Icons should clarify meaning, not replace understandable labels unnecessarily.

Never use an icon merely because there is empty space.


----------------------------------------------------
10. TYPOGRAPHY
----------------------------------------------------

Typography must be restrained and hierarchical.

Use a modern UI font such as:

Inter / Geist / Manrope

Use a limited number of weights:

Regular
Medium
Semibold
Bold

Avoid excessive font-weight variation.

Recommended hierarchy:

Page title:
28–36px

Section heading:
18–24px

Body:
14–16px

Secondary text:
12–14px

Metadata:
11–13px

Do not make everything large.

Do not use decorative fonts.

Do not use ALL CAPS for large amounts of text.

Buttons should use short, action-oriented language.


----------------------------------------------------
11. TEXT CONTENT
----------------------------------------------------

UI copy must be:

• short
• direct
• human
• understandable
• grammatically correct

Prefer:

"Start your trip"

over:

"Click here to initiate the trip process"

Prefer:

"Driver hasn't started the trip yet."

over:

"Trip initiation status is currently pending."

Avoid technical language when talking to parents.

Technical terminology can be used where appropriate in admin/driver interfaces.

Never use placeholder text such as:

Lorem ipsum
Test
Demo
Sample
Coming soon

unless it is explicitly a development-only screen.


----------------------------------------------------
12. CARDS
----------------------------------------------------

Cards should group related information.

A card must have a reason to exist.

Do NOT put every piece of information inside its own card.

Avoid:

Card inside card inside card.

Use cards for:

• journeys
• vehicles
• driver applications
• important status summaries
• actionable groups

Prefer clean sections when a card does not add meaning.

Cards should use:

• consistent padding
• consistent border
• consistent radius
• subtle shadow only when useful


----------------------------------------------------
13. BORDER RADIUS
----------------------------------------------------

Use a consistent radius system.

Suggested:

Small controls:
6–8px

Cards:
10–14px

Large containers:
16–20px

Do not randomly use:

4px
7px
13px
19px
27px

throughout the application.

Consistency matters more than the exact number.


----------------------------------------------------
14. SHADOWS
----------------------------------------------------

Use shadows sparingly.

Prefer:

• borders
• contrast
• spacing

over heavy shadows.

Avoid:

• huge shadows
• glowing shadows
• colored shadows
• floating neon effects

A premium interface should not look like every component is floating.


----------------------------------------------------
15. COLORS
----------------------------------------------------

Use a restrained palette.

Base:

Light neutral background
White surfaces
Dark navy/charcoal primary text
Muted gray secondary text
Blue for primary interaction
Green for successful/active states
Amber for warnings
Red for destructive/error states

Suggested foundation:

Background: #F7F8FA
Surface: #FFFFFF
Primary text: #172033
Secondary text: #667085
Border: #E4E7EC
Primary action: #2563EB
Success: #16A34A
Warning: #D97706
Danger: #DC2626

Do not use rainbow colors to differentiate roles.

Do not use:

• neon cyan
• excessive purple gradients
• glowing buttons
• random gradients
• excessive glassmorphism


----------------------------------------------------
16. FORMS
----------------------------------------------------

Forms must feel calm and easy.

Every input needs:

• visible label
• consistent height
• consistent border
• clear focus state
• validation state
• helpful error message

Do not rely only on placeholder text as the label.

Example:

Full Name
[ Sai Ganesh                    ]

not:

[ Enter your name... ]

after typing, where the user no longer knows what the field means.

Group related fields together.

Do not create unnecessarily long forms without sectioning.


----------------------------------------------------
17. INPUT STATES
----------------------------------------------------

Every form control should support:

• Empty
• Focused
• Filled
• Disabled
• Error
• Valid where useful
• Loading where applicable

Validation errors must explain:

WHAT is wrong
and
HOW to fix it

Bad:

"Invalid input"

Good:

"Enter a valid 10-digit phone number."


----------------------------------------------------
18. MODALS
----------------------------------------------------

A modal should only be used when the user must focus on a specific task.

Use modals for:

• confirmation
• critical actions
• short forms
• focused information

Do not use modals for entire application pages.

Modal structure:

Title
Short explanation
Content
Actions

Example:

End Trip?

Your current trip will be marked as completed.

[ Cancel ] [ End Trip ]

The destructive action must be visually distinguishable.


----------------------------------------------------
19. MODAL ANIMATION
----------------------------------------------------

EVERY modal/popup should enter and exit smoothly.

Preferred behavior:

• backdrop fades in
• modal slightly scales from ~98% to 100%
• modal moves upward a few pixels
• opacity increases

Keep animation subtle.

Approximate duration:

180–250ms

Exit slightly faster than entrance.

Never use:

• bouncing
• spinning
• dramatic zoom
• excessive spring effects

Unless the specific interaction intentionally requires it.


----------------------------------------------------
20. DRAWERS / SIDE PANELS
----------------------------------------------------

Drawers should:

• slide naturally from their edge
• maintain consistent width
• preserve page context
• have a clear close action

Use a subtle backdrop.

The underlying page should remain recognizable.

Do not make drawers feel like separate websites.


----------------------------------------------------
21. DROPDOWNS / POPOVERS
----------------------------------------------------

Dropdowns must appear close to the control that opened them.

Animation:

opacity + slight vertical movement.

Do not make dropdowns fly across the screen.

Maintain consistent:

• padding
• item height
• hover state
• selected state
• separators where necessary


----------------------------------------------------
22. TOOLTIPS
----------------------------------------------------

Tooltips should only explain unfamiliar icons or controls.

Do not tooltip obvious text.

Tooltip should:

• appear after a short delay
• disappear naturally
• remain readable
• never cover the control's essential context

Never use tooltips as a replacement for proper UI labels.


----------------------------------------------------
23. TOASTS / NOTIFICATIONS
----------------------------------------------------

Toasts should communicate short-lived events.

Examples:

"Trip started successfully."
"Application submitted."
"Message sent."

They should:

• appear smoothly
• remain long enough to read
• disappear automatically
• be dismissible when appropriate

Do not use huge notification banners for tiny events.


----------------------------------------------------
24. LOADING STATES
----------------------------------------------------

Never leave users staring at a blank screen.

Use appropriate loading states:

• skeletons for content-heavy areas
• spinners for short actions
• progress indicators for long processes

Do not animate entire pages unnecessarily while loading.

Skeletons should resemble the final layout.


----------------------------------------------------
25. EMPTY STATES
----------------------------------------------------

Empty states must explain:

1. What is missing?
2. Why is it empty?
3. What can the user do?

Example:

No active trips

There are currently no buses sharing live location.

instead of:

"No data"


----------------------------------------------------
26. ERROR STATES
----------------------------------------------------

Errors must be understandable.

Never expose raw Firebase/API errors directly to normal users.

Bad:

FirebaseError: PERMISSION_DENIED

Good:

"We couldn't load your trip. Please try again."


Provide:

• explanation
• recovery action
• retry button when appropriate


----------------------------------------------------
27. ANIMATION SYSTEM
----------------------------------------------------

Animation should communicate change.

It must NOT exist merely to show off.

Use animation for:

• navigation
• modal opening
• dropdowns
• state changes
• loading
• success feedback
• expanding/collapsing sections
• first-load brand introduction

Default UI animation:

150–250ms

Larger transitions:

300–500ms

Use:

opacity
transform
translate
scale

preferably GPU-friendly CSS properties.

Avoid animating:

width
height
top
left

when transform can achieve the same result.


----------------------------------------------------
28. PAGE TRANSITIONS
----------------------------------------------------

When navigating between related views:

Use subtle fade/slide transitions.

Do not make every page perform a dramatic transition.

The user should feel:

"I moved to the next screen."

not:

"The website is performing an animation."


----------------------------------------------------
29. NEW CONTENT / POPUPS
----------------------------------------------------

Whenever something NEW appears:

• modal
• drawer
• dropdown
• notification
• expanded section
• new panel
• inline form
• confirmation
• success state

it must have an intentional entrance.

Never make content suddenly appear with no visual transition unless instant feedback is specifically preferable.

Default:

fade + small movement.

Example:

opacity: 0 → 1
translateY: 4–8px → 0


----------------------------------------------------
30. NAVIGATION
----------------------------------------------------

Navigation must remain consistent.

Users should always know:

• where they are
• where they can go
• how to go back

Do not change navigation structure randomly between pages.

Active navigation item must be visually obvious but subtle.

Avoid excessive sidebar items.

If an item is not actually functional, do not display it.


----------------------------------------------------
31. RESPONSIVE DESIGN
----------------------------------------------------

The application must not be:

"desktop UI squeezed into mobile."

Design intentionally for:

• Desktop
• Tablet
• Mobile

At smaller widths:

• navigation may collapse
• grids become stacks
• tables may become cards
• sidebars may become drawers
• buttons may become full-width where appropriate

Maintain hierarchy at every breakpoint.

Never allow:

• horizontal overflow
• clipped buttons
• overlapping text
• broken maps
• tiny unreadable controls


----------------------------------------------------
32. MOBILE TOUCH TARGETS
----------------------------------------------------

Interactive controls must be comfortably tappable.

Avoid tiny clickable icons.

Keep adequate spacing between neighboring actions to prevent accidental taps.

Destructive actions should not sit immediately beside primary actions without separation.


----------------------------------------------------
33. MAPS
----------------------------------------------------

Maps must support the experience rather than dominate it unnecessarily.

Parent:

Map can be a major visual element.

Driver:

Map should support the trip but not overwhelm the action of starting/stopping.

Admin:

Map should appear when fleet/location information actually exists.

Never show fake map movement.

Never fabricate GPS coordinates.

Never fabricate ETA.

If real location is unavailable, communicate that honestly.


----------------------------------------------------
34. REAL DATA PRINCIPLE
----------------------------------------------------

Never create fake values merely to make a UI look populated.

Do NOT fabricate:

• buses
• students
• drivers
• locations
• routes
• ETAs
• timestamps
• notifications
• attendance
• analytics
• trip history
• GPS data

If real data does not exist:

show an intentional empty state.

A beautiful empty state is better than fake data.


----------------------------------------------------
35. STATUS DESIGN
----------------------------------------------------

Statuses must be immediately understandable.

Use:

LIVE
SCHEDULED
COMPLETED
PENDING
APPROVED
REJECTED
GPS UNAVAILABLE
OFFLINE

Use color carefully.

Status should never depend solely on color.

Include:

• text
• icon where useful
• color as secondary reinforcement


----------------------------------------------------
36. REAL-TIME DATA
----------------------------------------------------

When real-time information changes:

Update only the relevant component.

Do not unnecessarily reload the entire page.

Avoid visual jumps.

Example:

If bus location changes:

Update the bus marker and journey progress.

Do NOT:

reload the whole dashboard.


----------------------------------------------------
37. CONFIRMATION PRINCIPLE
----------------------------------------------------

Ask for confirmation before destructive or irreversible actions.

Examples:

• End trip
• Reject driver
• Delete vehicle
• Delete route
• Remove child
• Sign out if unsaved work exists

Do not ask confirmation for trivial actions.

Example:

Opening a route should NOT require confirmation.


----------------------------------------------------
38. FEEDBACK PRINCIPLE
----------------------------------------------------

Every meaningful user action should produce feedback.

Examples:

Click:
→ visual pressed state

Save:
→ loading → success

Error:
→ clear error

Navigation:
→ transition

Trip started:
→ status changes

Trip ended:
→ completion state

Never leave the user wondering:

"Did that button actually work?"


----------------------------------------------------
39. ACCESSIBILITY
----------------------------------------------------

Maintain:

• keyboard navigation
• visible focus states
• sufficient contrast
• readable text
• semantic buttons
• semantic links
• proper labels
• accessible form errors
• reduced-motion support

Never remove focus outlines without providing an equivalent focus indicator.


----------------------------------------------------
40. REDUCED MOTION
----------------------------------------------------

Respect:

prefers-reduced-motion

If enabled:

• minimize transitions
• remove cinematic animations
• avoid parallax
• avoid unnecessary movement

The application must remain fully usable.


----------------------------------------------------
41. FIRST-LOAD / BRAND ANIMATION
----------------------------------------------------

The Nishchit first-load experience may contain a cinematic brand introduction.

However:

It must be short.

It must not delay application functionality unnecessarily.

The logo should transition naturally into its final position.

Do not repeatedly show a giant splash screen on every reload.

First visit:
→ full introduction.

Returning visitor:
→ subtle logo entrance.

Authenticated user:
→ go directly toward their dashboard without unnecessary interruption.


----------------------------------------------------
42. AUTHENTICATION EXPERIENCE
----------------------------------------------------

Authentication should feel like part of the same application.

Do not make login pages feel disconnected from the main product.

If a user selects:

Parent
Driver
Admin

the authentication content may transition inside the existing portal panel rather than navigating to an entirely unrelated-looking page.

Maintain:

• same background
• same branding
• same layout language

Only the content changes.


----------------------------------------------------
43. MICROINTERACTIONS
----------------------------------------------------

Use subtle microinteractions for:

• button hover
• checkbox selection
• toggle changes
• tab selection
• navigation selection
• successful submission
• status changes
• expanding content

Microinteractions should reinforce cause and effect.

Never animate every element simply because animation is possible.


----------------------------------------------------
44. TABLES
----------------------------------------------------

Tables should prioritize readability.

Use:

• consistent column alignment
• clear headers
• adequate row height
• subtle row separation
• hover state
• status indicators
• predictable actions

Do not overload every row with ten actions.

Use a contextual menu for secondary actions where necessary.


----------------------------------------------------
45. LISTS
----------------------------------------------------

Lists should have consistent:

• item height
• icon placement
• text hierarchy
• spacing
• dividers

Primary information should be visually stronger.

Metadata should be quieter.


----------------------------------------------------
46. SIDEBARS
----------------------------------------------------

Sidebars should not become storage areas for every feature.

Only include frequently used navigation.

Group related items.

Maintain:

• clear active state
• consistent icon size
• consistent item height
• comfortable spacing

Avoid 15–20 navigation items when 5–8 meaningful sections are enough.


----------------------------------------------------
47. DASHBOARD PRINCIPLE
----------------------------------------------------

A dashboard should answer:

"What do I need to know?"
and
"What do I need to do?"

It should NOT attempt to display everything the system knows.

Avoid KPI walls unless the metrics genuinely help the user.

Prefer:

important status
→ current task
→ relevant information
→ secondary details


----------------------------------------------------
48. INFORMATION DENSITY
----------------------------------------------------

Use different density levels for different users.

Parent:
calm, simple, journey-focused.

Driver:
focused, action-oriented.

Admin:
structured and information-dense.

Do not give every role the same UI.


----------------------------------------------------
49. CONSISTENCY
----------------------------------------------------

If a component already exists, reuse it.

Do not create:

ButtonA
ButtonB
ButtonC

that all visually perform the same function differently.

Create reusable design primitives for:

• buttons
• inputs
• cards
• badges
• modals
• drawers
• tabs
• navigation
• alerts
• loading states
• empty states


----------------------------------------------------
50. DESIGN TOKENS
----------------------------------------------------

Centralize:

• colors
• typography
• spacing
• radius
• shadows
• transitions
• breakpoints

Do not scatter random values throughout CSS.

If the primary button radius changes, it should be possible to change it globally.


----------------------------------------------------
51. Z-INDEX / LAYERING
----------------------------------------------------

Maintain a clear layering hierarchy.

Example:

Base content
→ sticky navigation
→ dropdown
→ drawer
→ modal
→ modal backdrop
→ critical overlay

Do not solve layering problems by randomly assigning:

z-index: 99999;


----------------------------------------------------
52. SCROLLING
----------------------------------------------------

Scrolling should feel natural.

Avoid unnecessary nested scrolling containers.

Do not create:

page scroll
inside panel scroll
inside card scroll
inside modal scroll

unless genuinely necessary.

Always make the primary content's scroll behavior obvious.


----------------------------------------------------
53. PERFORMANCE
----------------------------------------------------

Animations should not cause unnecessary re-renders.

Prefer:

CSS transforms
opacity
GPU-friendly transitions

Avoid unnecessary animation libraries for tiny interactions.

Images should be optimized.

Maps and large components should load intelligently.

Do not sacrifice application performance for visual effects.


----------------------------------------------------
54. NO AI-SLOP RULE
----------------------------------------------------

NEVER automatically add:

• gradient blobs
• glowing borders
• floating glass cards
• neon colors
• excessive rounded pills
• random illustrations
• giant text
• excessive shadows
• fake statistics
• decorative dashboards
• meaningless charts
• unnecessary 3D objects
• excessive emoji
• generic AI-generated illustrations

Every visual element must have a reason.


----------------------------------------------------
55. NO DEAD UI
----------------------------------------------------

Every visible interactive element must work.

If a button exists:

IT MUST DO SOMETHING.

If functionality is not implemented:

Do not pretend it exists.

Either:

• implement it
• hide it
• clearly mark it as unavailable

Never create fake interactions for presentation purposes.


----------------------------------------------------
56. NO FAKE PRODUCT BEHAVIOR
----------------------------------------------------

Never simulate:

• GPS
• vehicle movement
• ETA
• trip status
• notifications
• attendance
• analytics

unless explicitly running an isolated development/testing environment.

Production UI must reflect actual application state.


----------------------------------------------------
57. BEFORE CREATING A NEW COMPONENT
----------------------------------------------------

Ask internally:

1. Does this component need to exist?
2. Does an existing component already solve this?
3. Does it follow the existing spacing?
4. Does it follow the existing typography?
5. Does it follow the existing button hierarchy?
6. Does it follow the existing animation system?
7. Does it work on mobile?
8. Does it have loading/error/empty states where necessary?
9. Does it use real data?
10. Does it introduce unnecessary visual complexity?


----------------------------------------------------
58. BEFORE FINISHING A PAGE
----------------------------------------------------

Verify:

□ Alignment is consistent
□ Spacing is consistent
□ Typography hierarchy is clear
□ Primary action is obvious
□ Buttons have correct states
□ Icons are aligned
□ No unnecessary cards
□ No fake data
□ Loading state exists
□ Empty state exists where relevant
□ Error state exists where relevant
□ Responsive layout works
□ Keyboard interaction works
□ Animations are subtle
□ Modals animate correctly
□ New content does not appear abruptly
□ No horizontal overflow
□ No dead buttons
□ No console errors
□ No broken navigation


----------------------------------------------------
59. FINAL QUALITY STANDARD
----------------------------------------------------

Before considering any screen complete, evaluate it as if it were being released to a real product.

Ask:

"Would a real parent trust this?"

"Would a real driver understand what to do immediately?"

"Would a transport administrator understand what requires attention?"

"Does anything look unnecessary?"

"Does anything look fake?"

"Does anything feel visually inconsistent?"

"Does anything look like an AI-generated template?"

If yes:

FIX IT.

Do not simply add more decoration.

The goal is not to make the interface look impressive in a screenshot.

The goal is to make the interface feel like a coherent, professionally designed product.

====================================================
END OF NISHCHIT UI/UX WORKING PRINCIPLES
====================================================
