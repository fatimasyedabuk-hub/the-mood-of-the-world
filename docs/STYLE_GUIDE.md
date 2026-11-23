# THE MOOD OF THE WORLD — Visual Style Guide
**Project:** Data as Experience

## 1. Visual concept
Create the feeling of *entering* a city's weather, not reading an ordinary forecast. The overall atmosphere is cinematic, minimalist, immersive, soft, and quietly responsive. The sky is the main canvas; weather data changes the palette, particle motion, cloud opacity, and brightness. Avoid clutter, neon colours, playful cartoon art, and heavy borders.

## 2. Colour system
| Purpose | Hex | Application |
|---|---|---|
| Midnight navy | `#111D38` | default background, navigation |
| Twilight violet | `#695E91` | middle gradient stop |
| Dusky blush | `#E7A4A1` | atmospheric horizon |
| Soft ivory | `#F9F7F4` | main text on dark scenes |
| Muted lavender-white | `#E0DFE8` | secondary text |
| Warm peach | `#F5BFA9` | accents and highlights |
| Cold deep blue | `#102849` | cold scene top |
| Cold sky blue | `#477AA1` | cold scene middle |
| Frost blue | `#B8D5E9` | cold scene horizon |
| Warm plum | `#4D315A` | warm scene top |
| Warm rose | `#B57078` | warm scene middle |
| Warm amber | `#F3C084` | warm scene horizon |
| Night ink | `#07142B` | night scene top |

**Recommended design thresholds (not meteorological categories):** under 10°C = cold; 10–24°C = mild; 25°C and over = warm. If `is_day = 0`, use night tones or combine night brightness with the base temperature palette. Keep condition labels and values visible because colour alone cannot communicate weather. In `weather-theme.css`, night is a separate theme; choose the precedence explicitly in JavaScript.

## 3. Typography
- **Display headings & temperature:** Georgia (serif), normal weight. Headlines 48–80px desktop / 36–48px mobile. Temperature ~80–160px desktop / 64–96px mobile.
- **Body, buttons, navigation, metrics:** Arial or Helvetica (sans serif). Body 16–18px, line-height 1.5; buttons 14–16px, semibold.
- **Labels:** upper case, letter spacing 0.12–0.16em; avoid extremely small text (use at least 12px).
- **Why:** display serif feels editorial and atmospheric, and sans-serif labels keep the data readable. Both are system fonts; no external font downloads or licensing are required.

## 4. Imagery, icons, and sound
- Landing background: `assets/backgrounds/hero-atmosphere.png`.
- Weather backgrounds: `clear.webp`, `cloudy.webp`, `rain.webp`, `snow.webp`, `storm.webp`, and `night.webp`, in `assets/backgrounds/`.
- The six weather backgrounds share the same cinematic colour treatment. Use `background-size: cover; background-position: center` and an overlay behind text.
- Conditions should select the background; temperature should still update accent colour, wind speed should affect motion, and cloud cover should affect cloud-layer density. A background swap by itself does not cover all data-driven requirements.
- Prioritise day/night correctly. For example, choose the night image during night conditions, while keeping the actual weather condition in visible text and weather particles.
- `assets/icons/`: 11 original SVG weather and interface icons. `assets/brand-mark.svg`: globe symbol.
- Ambient audio: `assets/audio/gentle-rain.mp3`, `soft-wind.mp3`, and `distant-thunder.mp3`. These are synthesised sound effects, not meteorological recordings.
- Ambient audio is optional, **off by default**, and controlled with an obvious Sound on/off button. Play only after the user enables sound. Change sound when weather conditions change, pause it in Minimal mode if that is the chosen accessibility behaviour, and respect reduced-motion preferences independently.

## 5. Layout and UI components
- **Landing page:** full-height hero, short wordmark top left, ABOUT / EXPLORE top right, large editorial title, subtitle, single prominent rounded button.
- **Experience:** search and mode toggle at top; city name and big temperature in primary visual area; small condition text; a row of humidity/wind/cloud-cover metrics; refresh control below. Leave ~24–48px comfortable spacing on desktop.
- **Cards:** frosted-glass background (navy at ~48% opacity), 1px soft white border, 20px rounded corners; keep text contrast strong regardless of background.
- **Buttons:** full keyboard focus indication; at least 44×44 CSS px hit area. Search needs a visible label for accessibility.
- **Mobile (≤600px):** stack search, mode toggle, data cards and buttons; no horizontal scrolling; 16px side padding; primary actions full-width where needed.
- **Minimal mode:** same city/data, almost no animation, solid or subtle gradient, stronger contrast and readable labels.

## 6. Motion and responsiveness
- Wind speed influences *animation duration*, not layout movement; cap movement intensity to avoid extreme motion.
- More cloud cover = more visible/opaque clouds. Rain or snow use distinct particles; thunder uses dark scene with restrained effects (avoid flashing).
- Respect `prefers-reduced-motion`; disable decorative animations. Keep the same weather data in both modes.
- Provide explicit loading, error and empty-state messages consistent with the website content.

## 7. Implementation notes
1. Copy the entire `assets` directory to the website repository.
2. Add `<link rel="stylesheet" href="assets/weather-theme.css">` in the HTML `<head>` (adjust path if moved).
3. Apply `class="weather-scene"` on the sky container and `data-theme="cold|mild|warm|night"` plus `data-weather="rain|storm"` as appropriate. Clear stale weather attributes when city changes.
4. Use icon files by relative path: `<img src="assets/icons/wind.svg" alt="" aria-hidden="true">`; keep weather text labels next to decorative icons.
5. Select weather background files from the condition code and use CSS/data-driven effects on top. Keep the temperature palette, cloud density, and wind motion responsive to data.
6. Use the approved website copy and screen layouts for titles, labels and interactions.

## 8. Asset optimisation
- SVGs are tiny vector files and scale without blur; no raster export required.
- Hero is supplied as a PNG; weather scenes are compressed WebP images. Set `background-size: cover` and a dark overlay behind any white text.
- Ambient loops use compressed MP3 for broad browser compatibility. Keep original source files in the repository for versioning.
