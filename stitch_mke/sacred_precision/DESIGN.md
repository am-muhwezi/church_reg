```markdown
# Design System Strategy: Sacred Precision

## 1. Overview & Creative North Star
The Creative North Star for this design system is **"The Illuminated Manuscript."** This concept bridges the ancient authority of sacred texts with the sharp, uncompromising clarity of modern architectural minimalism. We are moving away from the "generic SaaS" look of rounded bubbles and heavy borders. Instead, we embrace a high-end editorial feel characterized by expansive white space, intentional asymmetry, and the surgical use of vibrant amber.

The layout should feel "curated" rather than "templated." Use the provided spacing scale to create rhythmic breathing room—don't be afraid of large `spacing.24` gaps between sections to signify a change in thought or importance. This is a system built on dignity and intentionality.

---

## 2. Colors: Tonal Architecture
Our palette is anchored by the vibrant Amber of the logo, grounded by deep neutrals.

### The "No-Line" Rule
To achieve a premium, editorial feel, **1px solid borders for sectioning are strictly prohibited.** Boundaries must be defined through:
- **Background Shifts:** Use `surface-container-low` (#f0f1f1) sections adjacent to `surface` (#f6f6f6) backgrounds.
- **Tonal Transitions:** Vertical white space from our spacing scale serves as the primary separator.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers. 
- **Base Layer:** `surface` (#f6f6f6) or `surface-container-lowest` (#ffffff).
- **Secondary Layer:** `surface-container` (#e7e8e8) for grouped content.
- **The Glass & Gradient Rule:** For hero sections or high-impact CTAs, use a subtle linear gradient transitioning from `primary` (#835000) to `primary-container` (#fca21e) at a 135-degree angle. This adds "soul" and prevents the vibrant orange from feeling flat or "plastic."

| Token | Value | Role |
| :--- | :--- | :--- |
| `primary` | #835000 | Deep amber for text and high-contrast iconography. |
| `primary-container` | #fca21e | The "Vibrant Orange" from the logo. Primary actions only. |
| `secondary` | #515d69 | Deep Navy/Charcoal. Use for grounding navigation or utility text. |
| `tertiary-fixed` | #ffd709 | Warm Gold highlights for accolades or secondary status. |
| `surface` | #f6f6f6 | The primary canvas for the application. |

---

## 3. Typography: Editorial Authority
We use **Manrope** exclusively. It provides a geometric skeleton with a humanist soul, perfect for a modern ministry feel.

- **Display Scales (`display-lg` to `display-sm`):** These are your "statements." Use them with tight letter-spacing (-0.02em) and generous bottom margins (`spacing.8`).
- **Headline Scales:** Use for section titles. Ensure they are always `on-surface` (#2d2f2f) to maintain "Sacred Precision."
- **Body Scales:** `body-lg` is your workhorse. Use a line-height of 1.6 for long-form content to ensure an effortless reading experience.
- **The Hierarchy Strategy:** Contrast is king. Pair a large `display-md` headline with a much smaller `label-md` uppercase subtitle to create a professional, architectural tension in the layout.

---

## 4. Elevation & Depth: Tonal Layering
Traditional shadows are often a crutch for poor layout. In this system, we prioritize **Tonal Layering.**

- **The Layering Principle:** Place a `surface-container-lowest` (#ffffff) card on a `surface-container-low` (#f0f1f1) background. This creates a soft, natural "lift" that feels integrated into the page.
- **Ambient Shadows:** When a floating element (like a Modal or Dropdown) is required, use a shadow with a blur of 32px and a color of `secondary` (#515d69) at **4% opacity**. It should feel like a soft glow of light, not a dark stain.
- **The "Ghost Border" Fallback:** If a container sits on a background of the same color, use a `outline-variant` (#acadad) at **15% opacity**. This "Ghost Border" provides just enough definition without breaking the minimal aesthetic.
- **Glassmorphism:** For top navigation bars, use `surface` (#f6f6f6) at 80% opacity with a `backdrop-blur: 12px`. This allows the vibrant primary accents of the content to bleed through as the user scrolls.

---

## 5. Components: Precision Elements

### Buttons
- **Primary:** `primary-container` (#fca21e) background with `on-primary-fixed` (#2e1900) text. Corner radius: `md` (0.375rem).
- **Secondary:** Transparent background with a `Ghost Border` and `primary` (#835000) text.
- **Tertiary:** No background or border. `primary` text with an underline that appears only on hover.

### Cards & Lists
- **Forbid Divider Lines:** Use `spacing.4` to `spacing.6` to separate list items. Use a `surface-container` background on hover to indicate interactivity.
- **Structure:** Cards should have a `none` border and a `sm` (0.125rem) or `md` (0.375rem) corner radius. Keep them sharp; avoid "bubble" corners (`xl` or `full`).

### Input Fields
- **Default State:** `surface-container-highest` (#dbdddd) background, no border, `md` corner radius.
- **Focused State:** A 2px "Ghost Border" using `primary` at 40% opacity. No heavy outlines.
- **Error State:** Use `error` (#b02500) for the text and a subtle `error-container` (#f95630) tint for the background.

### Signature Component: The "Sacred" Feature Card
For highlight content, use an asymmetrical layout: a `primary-container` top-border (4px) on a `surface-container-lowest` card, with `display-sm` typography and `spacing.10` internal padding.

---

## 6. Do's and Don'ts

### Do
- **Do** use `primary-container` (#fca21e) for "Moment of Truth" actions (Donate, Submit, Join).
- **Do** allow content to overflow its container slightly or use asymmetrical margins to break the "grid" feel.
- **Do** use the full range of the spacing scale to create a sense of luxury and importance.

### Don't
- **Don't** use 100% black text. Always use `on-surface` (#2d2f2f) for better readability and a premium feel.
- **Don't** use high-contrast drop shadows. They look commercial and dated.
- **Don't** use 1px solid borders to "box in" your content. Let the surfaces do the work.
- **Don't** use `primary-container` for low-priority items like "Cancel" or "Back." Keep the vibrant orange for what matters most.```