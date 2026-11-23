# Weather Asset Mapping

| Open-Meteo `weather_code` | Condition | Visual file | Optional audio |
|---|---|---|---|
| 0, 1 | Clear / mostly clear | `backgrounds/clear.webp` | none |
| 2, 3, 45, 48 | Cloudy / fog | `backgrounds/cloudy.webp` | `audio/soft-wind.mp3` (if desired) |
| 51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82 | Drizzle / rain / showers | `backgrounds/rain.webp` | `audio/gentle-rain.mp3` |
| 71, 73, 75, 77, 85, 86 | Snow | `backgrounds/snow.webp` | `audio/soft-wind.mp3` |
| 95, 96, 99 | Thunderstorm | `backgrounds/storm.webp` | `audio/distant-thunder.mp3` |
| Nighttime (`is_day === 0`) | Night visual treatment | `backgrounds/night.webp` | keep the actual condition's audio |

The night image can override the visual background while particles and labels still represent rain, snow, or other actual conditions. Open-Meteo may add more codes; use `cloudy.webp` as a neutral fallback. Select image using both `weather_code` and `is_day`, and continue using temperature, wind, and cloud cover to control other visuals.

**Relative URL example:** `assets/backgrounds/rain.webp` and `assets/audio/gentle-rain.mp3` from the website root.

## Sound behaviour
- Sound begins muted; never autoplay sound on page load.
- A labelled Sound on/off button is available in the main experience.
- Changing city/condition changes the selected loop after the weather API updates.
- Pause and reset previous loop before playing a different sound; use gentle volume.
- Some browsers block playback until a user clicks sound on. Keep the site fully functional without audio.
