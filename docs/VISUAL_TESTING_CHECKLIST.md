# Visual and Mobile Testing Checklist
**Status:** Testing to be completed once the website is available.

| Check | What to inspect | Result / note |
|---|---|---|
| Branding | Same logo, headline and visual voice on landing/experience pages | Not tested |
| Typography | Consistent Georgia headings and Arial text, no unreadable type | Not tested |
| Visual consistency | Navy/violet/blush default; temperature/day/night themes change as intended | Not tested |
| Accurate scene | Weather icon and visual match API conditions (not a fixed hero) | Not tested |
| Readable contrast | Main headings, metric labels, buttons visible over bright/dark backgrounds | Not tested |
| Desktop | 1440×900: no clipping and clear hierarchy | Not tested |
| Tablet | 768×1024: navigation, search, controls do not overlap | Not tested |
| Mobile | 390×844: stacked controls, no horizontal scrolling | Not tested |
| Small mobile | 320×568: labels wrap and all controls fit | Not tested |
| Interactions | City search, mode toggle, refresh all visually distinguishable | Not tested |
| Loading/errors | Text and status remain visible and accessible | Not tested |
| Reduced motion | With OS reduced motion on, decorative particles do not animate | Not tested |
| Asset quality | All SVG icons render; hero is sharp; no broken paths | Not tested |
| Accessibility | Keyboard focus visible, touch targets 44×44px, informative labels | Not tested |
| Attribution | Open-Meteo acknowledgement visible on live site | Not tested |

## Testing feedback

**What worked:**

**Issues identified:**

**Changes recommended:**

**Results after fixes:**

## Weather image and sound review
- [ ] Clear, cloudy, rain, snow, storm and night files all load without broken images.
- [ ] Weather codes choose the appropriate background; night mode still displays correct condition labels.
- [ ] Temperature, wind, and cloud cover visibly influence the experience independently of the background.
- [ ] Weather backgrounds crop properly on desktop and mobile without obscuring text.
- [ ] Sound is muted on first load; audio never starts without user action.
- [ ] Sound on/off works on mobile; sound changes when the conditions change; no overlapping loops.
- [ ] The page works normally when sound is disabled or unavailable.
