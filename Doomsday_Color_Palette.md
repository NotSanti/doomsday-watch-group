# Doomsday Color Palette

## Creative direction

This palette is based on the shared visual language of the supplied Doomsday imagery: near-black armor, deep Latverian greens, oxidized metal, antique bronze, warm mural gold, and a restrained trace of multiversal violet.

The intended result is dark, imperial, cinematic, and sophisticated. It should feel inspired by Doctor Doom without turning the interface into a bright radioactive-green gaming theme.

## Complete palette

| Role | Name | Hex | Recommended use |
| --- | --- | --- | --- |
| Main background | Void Black | `#0D1210` | Page background and deepest shadows |
| Dark surface | Iron Shadow | `#171E1A` | Navigation, footer, and elevated sections |
| Elevated surface | Doom Armor | `#29342E` | Cards, dialogs, panels, and menus |
| Dark brand green | Latverian Green | `#31563B` | Brand color, active navigation, and muted progress |
| Primary green | Arcane Green | `#4D7A4D` | Primary buttons, selected states, and progress |
| Bright green | Reactor Green | `#74B85A` | Focus rings, glows, and small highlights |
| Metallic neutral | Doom Silver | `#929B94` | Borders, icons, and secondary text |
| Light neutral | Vibranium Mist | `#D5DBD4` | Primary text and high-contrast labels |
| Dark warm accent | Ancient Bronze | `#855A2C` | Decorative accents, dividers, and milestones |
| Primary warm accent | Throne Gold | `#C49A50` | Ratings, countdown accents, and important details |
| Light warm accent | Mural Light | `#E5C990` | Highlighted text and illuminated details |
| Secondary accent | Royal Violet | `#493B5E` | Multiverse, series, or alternate-category accents |

## Core brand combination

These five colors should carry most of the interface:

- **Background:** Void Black — `#0D1210`
- **Surface:** Iron Shadow — `#171E1A`
- **Primary:** Arcane Green — `#4D7A4D`
- **Highlight:** Reactor Green — `#74B85A`
- **Accent:** Throne Gold — `#C49A50`

Reactor Green should be used sparingly. Reserve it for focus, progress, active elements, and subtle atmospheric glow. Using it across large surfaces would make the product feel radioactive rather than cinematic.

## Recommended interface hierarchy

### Backgrounds

| Layer | Color |
| --- | --- |
| Application background | `#0D1210` |
| Navigation or dark section | `#171E1A` |
| Standard card | `#1D2621` |
| Elevated card or dialog | `#29342E` |
| Hovered surface | `#33443A` |

### Typography

| Text role | Color |
| --- | --- |
| Primary text | `#E6EBE5` |
| Secondary text | `#A5AFA8` |
| Muted text | `#737D76` |
| Text on green buttons | `#081009` |
| Gold highlighted text | `#E5C990` |

### Borders and controls

| Role | Color |
| --- | --- |
| Subtle border | `#35423A` |
| Strong border | `#59645E` |
| Focus ring | `#8ACB6D` |
| Disabled foreground | `#667069` |
| Disabled surface | `#242C27` |

### Semantic colors

| State | Color | Notes |
| --- | --- | --- |
| Success | `#74B85A` | Completed titles and successful actions |
| Warning | `#D1A04E` | Schedule warnings and expiring invitations |
| Danger | `#A94B42` | Destructive actions and errors |
| Rating | `#C49A50` | Rating stars, scores, and distributions |
| Multiverse | `#493B5E` | Optional category accent |

## CSS semantic tokens

```css
:root {
  --background: #0d1210;
  --surface: #171e1a;
  --surface-card: #1d2621;
  --surface-elevated: #29342e;
  --surface-hover: #33443a;

  --primary: #4d7a4d;
  --primary-hover: #5d9257;
  --primary-emphasis: #74b85a;
  --primary-muted: #31563b;

  --accent: #c49a50;
  --accent-hover: #d5ae64;
  --accent-muted: #855a2c;
  --accent-light: #e5c990;

  --text-primary: #e6ebe5;
  --text-secondary: #a5afa8;
  --text-muted: #737d76;
  --text-on-primary: #081009;

  --border: #35423a;
  --border-strong: #59645e;
  --focus: #8acb6d;

  --rating: #c49a50;
  --success: #74b85a;
  --warning: #d1a04e;
  --danger: #a94b42;
  --multiverse: #493b5e;
}
```

## Tailwind theme tokens

For a Tailwind configuration that supports theme extension:

```ts
colors: {
  doom: {
    950: "#0D1210",
    900: "#171E1A",
    850: "#1D2621",
    800: "#29342E",
    750: "#33443A",
    700: "#31563B",
    600: "#4D7A4D",
    500: "#74B85A",
    300: "#A5AFA8",
    100: "#E6EBE5",
  },
  metal: {
    700: "#515C56",
    500: "#929B94",
    200: "#D5DBD4",
  },
  throne: {
    700: "#855A2C",
    500: "#C49A50",
    300: "#E5C990",
  },
  multiverse: {
    600: "#493B5E",
  },
}
```

For Tailwind CSS versions that use CSS-first configuration, expose the same values through theme variables:

```css
@theme {
  --color-doom-950: #0d1210;
  --color-doom-900: #171e1a;
  --color-doom-850: #1d2621;
  --color-doom-800: #29342e;
  --color-doom-750: #33443a;
  --color-doom-700: #31563b;
  --color-doom-600: #4d7a4d;
  --color-doom-500: #74b85a;
  --color-doom-300: #a5afa8;
  --color-doom-100: #e6ebe5;

  --color-metal-700: #515c56;
  --color-metal-500: #929b94;
  --color-metal-200: #d5dbd4;

  --color-throne-700: #855a2c;
  --color-throne-500: #c49a50;
  --color-throne-300: #e5c990;

  --color-multiverse-600: #493b5e;
}
```

## Gradient treatments

### Cinematic hero background

This combines green atmospheric light with a restrained antique-gold undertone.

```css
.hero-background {
  background:
    radial-gradient(
      circle at 72% 18%,
      rgba(116, 184, 90, 0.22),
      transparent 34%
    ),
    radial-gradient(
      circle at 20% 90%,
      rgba(133, 90, 44, 0.16),
      transparent 40%
    ),
    linear-gradient(145deg, #18231c 0%, #0d1210 48%, #080b09 100%);
}
```

### Metallic title treatment

Use for large display text, countdown numerals, or small decorative title details. Avoid using metallic text for body copy.

```css
.metallic-text {
  color: transparent;
  background: linear-gradient(
    180deg,
    #e1e5df 0%,
    #929b94 42%,
    #515c56 68%,
    #bcc4bd 100%
  );
  background-clip: text;
  -webkit-background-clip: text;
}
```

### Gold mural treatment

Useful for ratings, achievements, or important countdown information.

```css
.gold-text {
  color: transparent;
  background: linear-gradient(
    180deg,
    #f0d8a5 0%,
    #c49a50 48%,
    #855a2c 100%
  );
  background-clip: text;
  -webkit-background-clip: text;
}
```

## Glow and elevation

### Doom green glow

```css
.doom-glow {
  box-shadow:
    0 0 0 1px rgba(116, 184, 90, 0.32),
    0 0 24px rgba(116, 184, 90, 0.18);
}
```

### Gold rating glow

```css
.rating-glow {
  box-shadow:
    0 0 0 1px rgba(196, 154, 80, 0.28),
    0 0 20px rgba(196, 154, 80, 0.14);
}
```

### Elevated card shadow

```css
.elevated-card {
  background: #1d2621;
  border: 1px solid #35423a;
  box-shadow:
    0 18px 50px rgba(0, 0, 0, 0.32),
    inset 0 1px rgba(230, 235, 229, 0.025);
}
```

## Recommended component applications

| Component | Palette treatment |
| --- | --- |
| Primary button | `#4D7A4D` background, `#081009` text, `#5D9257` hover |
| Secondary button | Transparent or `#1D2621` background, `#59645E` border |
| Destructive button | `#A94B42` background with light neutral text |
| Navigation | `#171E1A` background with `#74B85A` active indicator |
| Standard card | `#1D2621` background and `#35423A` border |
| Modal | `#29342E` background with deep black overlay |
| Progress bar | `#29342E` track and green `#4D7A4D`–`#74B85A` fill |
| Rating control | `#C49A50` active and `#515C56` inactive |
| Countdown | Metallic neutral numbers with green or gold emphasis |
| Current-title hero | Dark gradient with restrained green atmospheric glow |
| Member avatar ring | Green for active/current; gold for group owner |
| Essential badge | Gold `#C49A50` with dark text |
| Watched badge | Green `#74B85A` with very dark text |
| Watching badge | Muted green `#31563B` with light text |
| Not-started badge | Doom Silver `#929B94` with dark surface |

## Usage proportions

A practical distribution for the website:

- **60% dark neutrals:** backgrounds, navigation, cards, and modal surfaces.
- **20% metallic neutrals:** text, borders, dividers, and icons.
- **12% Latverian greens:** interactions, progress, selection, and focus.
- **6% antique gold:** ratings, milestones, and important countdown details.
- **2% violet or danger colors:** special categories and exceptional states.

These proportions keep the interface atmospheric without reducing readability or making every element compete for attention.

## Accessibility guidance

- Use `#E6EBE5` for primary text on `#0D1210`, `#171E1A`, and `#29342E`.
- Do not use Reactor Green as small body text on light or mid-green surfaces.
- Prefer very dark text (`#081009`) on solid Reactor Green buttons.
- Use the gold palette primarily for larger labels, icons, and decorative emphasis. Test smaller gold text for contrast before shipping.
- Always pair semantic colors with text, icons, or labels. Do not communicate status using color alone.
- Keep visible keyboard focus rings even when green glow effects are used elsewhere.
- Validate final combinations against WCAG AA once exact typography, font weights, and component sizes are known.

## Design summary

Use green for interactive progress and selected states, gold for ratings and countdown highlights, and metallic silver for typography, borders, and icon details. Keep large surfaces nearly black or deep graphite-green.

The final interface should feel like a dark Latverian command center: ancient, technological, controlled, and imposing—not neon, playful, or overloaded with glow.
