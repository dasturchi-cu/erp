# Theming — Dark & Light Mode

## Document Control

| Field | Value |
|-------|-------|
| Version | 1.0.0 |
| Status | Approved |
| Last Updated | 2026-06-17 |

---

## Implementation

### Desktop (CSS Variables)

```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 221.2 83.2% 53.3%;
  /* ... */
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  --primary: 217.2 91.2% 59.8%;
  /* ... */
}
```

- Theme class applied to `<html>` element
- Toggle in user menu: Light | Dark | System
- Preference saved to `user_settings.theme` in API
- Synced across devices via user profile

### Mobile (Flutter)

```dart
ThemeMode themeMode = ThemeMode.system; // light, dark, system
MaterialApp(theme: lightTheme, darkTheme: darkTheme, themeMode: themeMode);
```

Material 3 `ColorScheme.fromSeed()` for both themes.

---

## Rules

1. All components MUST use design tokens, never hardcoded colors
2. Charts adapt colors for dark mode (lighter lines on dark bg)
3. Images/logos: provide dark variant if needed
4. Status colors (success, error) remain consistent across themes
5. Currency colors (UZS blue, USD green) maintain contrast in both modes
6. Transition between themes: 200ms ease

---

## Related Documents

- [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md)
