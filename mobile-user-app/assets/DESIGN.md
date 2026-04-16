# Design System Specification

## 1. Overview & Creative North Star: "The Architectural Traveler"

This design system moves away from the "flat app" aesthetic toward a **High-End Editorial** experience. We define our Creative North Star as **"The Architectural Traveler."** Like a boutique airport lounge or a luxury travel journal, the UI focuses on intentionality, structural depth, and high-contrast clarity.

We break the standard "template" look by utilizing **intentional asymmetry** and **tonal layering**. Elements are not merely placed on a grid; they are curated on a stage. We use the tension between the vibrant, energetic `primary` (#b71416) and the deep, authoritative `on_background` (#131b2e) to guide the user’s eye through a narrative, rather than a list of features.

---

## 2. Colors & Surface Philosophy

The color palette is rooted in a sophisticated high-contrast relationship. The signature red is reserved for the "Pulse" of the app—actions and urgency—while the deep navy provides the "Ground."

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders to define sections. 
Boundaries must be created through:
*   **Background Shifts:** Transitioning from `surface` (#faf8ff) to `surface_container_low` (#f2f3ff).
*   **Tonal Transitions:** Using the `surface_dim` (#d2d9f4) to anchor the bottom of a page.

### Surface Hierarchy & Nesting
Treat the UI as physical layers of fine paper. 
*   **Base:** `surface` (#faf8ff).
*   **Sectioning:** Use `surface_container` (#eaedff) for large groupings.
*   **Cards:** Use `surface_container_lowest` (#ffffff) to provide a crisp, clean lift against a darker container.
*   **Interactive Elements:** Use `surface_bright` to draw the eye to input areas.

### The "Glass & Gradient" Rule
To add "soul" to the interface:
*   **Glassmorphism:** For floating navigation or modal overlays, use `on_secondary_container` at 80% opacity with a `20px` backdrop blur.
*   **Signature Textures:** Main CTAs should utilize a subtle linear gradient from `primary` (#b71416) to `primary_container` (#db322b) at a 135-degree angle to provide a tactile, premium feel.

---

## 3. Typography: Editorial Authority

We use **Inter** for its modern, neutral, yet high-legibility characteristics. The hierarchy is designed to feel like a high-end magazine.

*   **Display (lg/md):** Used for "Hero" moments. Large, bold, and tight tracking (-0.02em). This conveys speed and confidence.
*   **Headline (lg/md):** Used for primary section titles. Provides the "Friendly" voice of the brand.
*   **Body (lg/md):** Set with generous line height (1.6) to ensure the "Reliable" personality shines through in long-form descriptions.
*   **Labels (md/sm):** Always uppercase with slight letter spacing (+0.05em) when used for category tags, ensuring they feel like "stamps of quality."

---

## 4. Elevation & Depth

We achieve hierarchy through **Tonal Layering** rather than structural lines. 

### The Layering Principle
Depth is achieved by "stacking" tiers. A `surface_container_highest` (#dae2fd) element should house `surface_container_lowest` (#ffffff) cards to create a natural, soft lift.

### Ambient Shadows
Shadows must feel like natural light, not digital effects.
*   **Value:** `0px 12px 32px`
*   **Color:** Use `on_surface` (#131b2e) at **4% to 8% opacity**. 
*   **Integration:** Shadows are only permitted on "floating" elements like FABs or Bottom Sheets.

### The "Ghost Border" Fallback
If accessibility requires a container boundary, use a **Ghost Border**:
*   **Stroke:** `outline_variant` (#e5beb9)
*   **Opacity:** 15% 
*   **Rule:** Never use 100% opaque borders.

---

## 5. Components

### Buttons
*   **Primary:** Gradient of `primary` to `primary_container`. White text. `xl` roundedness (3rem) for a pill-shaped, friendly look.
*   **Secondary:** `surface_container_highest` background with `primary` text. No border.
*   **Tertiary:** Ghost style. Transparent background, `on_surface` text, interaction state uses `surface_variant`.

### Cards
*   **Style:** No borders. Use `md` (1.5rem) roundedness.
*   **Separation:** Instead of divider lines, use **Spacing Scale 6** (2rem) of white space between card groups. 
*   **Interactions:** On tap, the card should scale down slightly (0.98) and increase shadow opacity to 12%.

### Input Fields
*   **Background:** `surface_container_low`. 
*   **Focus State:** Shift background to `surface_container_lowest` and apply a 2px "Ghost Border" of `tertiary` (#4648d4).
*   **Typography:** Labels use `label-md` in `on_surface_variant`.

### Chips (Service Categories)
*   **Design:** Thin-line icons (0.5pt stroke) paired with `body-sm`. 
*   **Selection:** Use a background of `secondary_container` with `on_secondary_container` text to denote active filters.

### Navigation Bar
*   **Execution:** Use Glassmorphism. A semi-transparent `surface` background with a heavy backdrop blur. This allows content to bleed through as the user scrolls, creating an integrated, modern feel.

---

## 6. Do's and Don'ts

### Do
*   **Do** use asymmetrical margins. For example, a header might be offset to the left by `Spacing 8`, while the subtext is offset by `Spacing 12`.
*   **Do** use `tertiary` (#4648d4) for "System" feedback (e.g., info banners, tracking progress) to keep the primary red focused on conversion.
*   **Do** prioritize touch targets of at least 48x48dp, even if the visual element is smaller.

### Don't
*   **Don't** use standard grey shadows. Always tint shadows with the `on_surface` blue to maintain tonal harmony.
*   **Don't** use dividers or horizontal rules. Use background color blocks or white space.
*   **Don't** use `none` or `sm` roundedness for cards. The brand is "friendly"—keep corners at `DEFAULT` (1rem) or higher.
*   **Don't** center-align long blocks of text. Stick to editorial left-alignment for a premium look.