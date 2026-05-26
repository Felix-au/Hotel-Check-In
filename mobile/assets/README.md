# assets/ — Mobile App Static Assets

Required image files for building the APK. These are **not committed** to git — generate them before building.

| File | Dimensions | Format | Purpose |
|---|---|---|---|
| `icon.png` | 1024×1024 | PNG, no transparency | App icon |
| `adaptive-icon.png` | 1024×1024 | PNG, transparent bg ok | Android adaptive icon foreground |
| `splash.png` | 1284×2778 | PNG | Splash screen (iPhone 14 Pro Max baseline) |

## Quick Generation (using sharp or ImageMagick)

```bash
# Using ImageMagick — create a solid dark icon with hotel emoji
magick -size 1024x1024 xc:'#0a0a0f' -fill '#6c63ff' \
  -font "Segoe-UI-Emoji" -pointsize 500 -gravity center \
  -annotate 0 "🏨" icon.png

# Splash (dark background)
magick -size 1284x2778 xc:'#0a0a0f' splash.png

# Adaptive icon (same as icon for simplicity)
cp icon.png adaptive-icon.png
```

Or use the [Expo icon generator](https://www.expo.dev/tools/icon-generator).
