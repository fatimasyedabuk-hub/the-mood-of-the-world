# Test report (development)

**How it was tested:** automated browser tests (Playwright, headless Chromium) against the site served over http, at 1440x900, 768x1024, 390x844, 375x812 and 320x568, plus a `file://` load. The Open-Meteo responses were **simulated** in the real API format (the test environment could not reach api.open-meteo.com), so these tests prove the interface logic. The live API still needs a final check on the published site (see the last section).

## Results: 103 checks, all passed

| Area | What was checked |
|---|---|
| Copy | Title, subtitle, intro, button, section heading, placeholder, loading, empty, search-error and API-error text match the content document |
| Navigation | Explore button, nav links, brand link, About open/close (button, Esc), browser Back and Forward |
| City search | Enter and Search button, quick-pick chips, other matches, blank search ignored, late answers from an older search ignored |
| API request | Forecast request asks for all 6 fields: temperature, humidity, wind speed, cloud cover, weather code, is_day |
| Temperature to colour | 8 C cold, 12 C mild, 35 C warm; night palette keeps a temperature hint |
| Weather code to scene | Clear, cloudy, rain, snow, storm, night and an unknown code (falls back to cloudy); matching icon, label and message |
| Wind to motion | Cloud drift is faster at 55 km/h than at 8 km/h; rain and snow particles are drawn on the canvas |
| Cloud cover to density | 5% gives no clouds, 90% gives 8 clouds, 100% gives 9 |
| Humidity, day/night | Haze and sun glow values set; night image used after dark |
| Minimal mode | Same data, picture and particles removed, choice remembered after reload |
| Refresh | One new request per click, loading line shown, button disabled while loading, timestamp updated; quiet automatic refresh after 10 minutes |
| Loading and errors | Loading state; city not found (no Retry); HTTP 500, broken JSON and offline all show the API error with Retry; Retry recovers; a request that never answers times out after 10 s |
| Sound | Off by default; nothing plays before the click; clear sky is silent; storm plays thunder only; cloudy and snow play wind only; rain plays rain only; no overlapping loops; off pauses; leaving the experience pauses |
| Accessibility | Keyboard-only use of search, mode, sound and refresh; touch targets at least 44 px; reduced-motion setting stops particles and cloud drift |
| Responsive | No horizontal scrolling at 320, 375, 390, 768 and 1440 px |
| Console | No JavaScript errors and no missing files |

## Not covered by these tests (do by hand on the live site)

- The real Open-Meteo API (search Toronto, Lahore, Reykjavik, Sydney and compare the visuals).
- Safari, Firefox and a real phone.
- How the ambient sounds actually sound by ear. They were measured at about -16 LUFS with no click at the loop point, but listening is still needed.
- Picture sharpness: the six weather backgrounds are 826 x 303 px and are enlarged to fit the main visual.
