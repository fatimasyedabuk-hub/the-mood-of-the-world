# The Mood of the World

CCT360 Interactive Discovery, project 2: **Data as Experience**.
Group: Fatima Bukhari, Lama Hamdan, Dima Hamdan.

An interactive website that turns live weather into an atmosphere. Type a city and the page changes its colour, picture, movement, clouds, haze and sound to match that city's current weather, instead of just listing numbers.

- **Live site:** https://fatimasyedabuk-hub.github.io/the-mood-of-the-world/
- **Repository:** https://github.com/fatimasyedabuk-hub/the-mood-of-the-world

## What it does

1. **Landing page:** title, subtitle, intro and an **Explore the world** button.
2. **Experience:** search a city (or tap a quick pick), and the scene updates from the weather API.
3. **Data row:** humidity, wind speed and cloud cover, plus temperature and conditions in the main view.

### Public API (no key needed)

| API | Used for |
|---|---|
| [Open-Meteo Geocoding](https://open-meteo.com/en/docs/geocoding-api) | City name to coordinates (up to 5 matches) |
| [Open-Meteo Forecast](https://open-meteo.com/en/docs) | `current`: `temperature_2m`, `relative_humidity_2m`, `wind_speed_10m`, `cloud_cover`, `weather_code`, `is_day` |

### How the data drives the interface

| Data | Interface property | Rule (in `js/app.js`) |
|---|---|---|
| Temperature | **Colour** of the scene, buttons and bars | Under 10 °C cold blues, 10 to 24 °C violet and blush, 25 °C and over amber |
| Weather code | **Picture, animation, text, sound** | Clear, cloudy, rain, snow or storm picks the background, rain or snow particles, message and ambient loop |
| Wind speed | **Motion speed** | Clouds drift in 220 s (calm) down to 30 s (60 km/h or more); rain and snow slant with the wind |
| Cloud cover | **Layout density** | 0 to 9 cloud shapes, more opaque as cover rises |
| Humidity | **Haze** | A soft white haze, up to 40% opacity at 100% |
| Day or night | **Brightness and imagery** | Night uses the night picture and a darker palette; the temperature keeps a hint of colour |

The thresholds are design choices, not official weather categories.

### User interactions

1. **Search / change city** (type and press Enter or Search, tap a quick pick, or choose another match).
2. **Change experience:** Atmospheric or Minimal (less motion, plain gradient, stronger contrast). Remembered with `localStorage`.
3. **Refresh atmosphere:** fetches the same city again. Data also quietly re-checks every 10 minutes.
4. **Ambient sound on/off:** off until the visitor turns it on.
5. About panel and the landing/experience navigation.

### Loading, error and empty states

Uses the project copy: loading ("The atmosphere is taking shape..."), city not found, connection error with **Retry**, and an empty state. Requests time out after 10 seconds. Answers that arrive late for an old search are ignored.

### Accessibility and responsiveness

Labelled search field, visible focus, 44 px touch targets, keyboard-operable controls, live status messages, text labels beside every icon (colour is never the only signal), `prefers-reduced-motion` respected, layout works from 320 px wide up.

## Run it locally

The page calls a live API, so it needs an internet connection.

```
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Files

```
index.html            page structure and all copy
css/styles.css        layout, states, minimal mode, responsive rules
js/app.js             API calls, data to visuals, interactions
assets/               backgrounds, icons, audio, weather-theme.css (visual design)
docs/                 concept and UX document, style guide, visual testing checklist, test report
CREDITS.md            sources and attribution
```

## Credits

The sky backgrounds are AI-generated; icons are original vector graphics; the ambient sounds are synthesised. See [CREDITS.md](CREDITS.md). Weather data by [Open-Meteo](https://open-meteo.com/) under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
