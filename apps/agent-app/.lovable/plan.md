

## Challenging the Priority Logic

Your proposed order has a subtle issue worth flagging:

**Manual override should be checked first, not last.** The way you described it, localStorage "always takes priority" — so in code, the resolution order should actually be:

1. **localStorage** (manual override) — if set, use it, skip everything else
2. **Device language** (`navigator.language`) — if `es-*`, default to Spanish
3. **Business entity country** — if the user's org is in Spain, use Spanish
4. **IP geolocation** — if IP resolves to Spain, use Spanish
5. **Fallback** — English

Also worth noting:
- **IP geolocation** is unreliable (VPNs, roaming, corporate proxies). For a prototype, I'd simulate this with a mock value. In production, this would come from the backend (user profile or session metadata), not a client-side IP lookup.
- **Business entity** is also backend data — for now I'll mock it as a constant.
- Criteria 2 and 3 (entity and IP) are both "server knows the user is in Spain" — in practice these likely collapse into a single backend flag like `user.defaultLocale` or `user.country`. Worth simplifying for the real API.

## Implementation Plan

### 1. Create a Language Context (`src/contexts/language-context.tsx`)
- `LanguageProvider` wrapping the app
- Exposes `language` (`'en' | 'es'`), `setLanguage`, and `t()` translation helper
- Resolution logic on mount: localStorage → `navigator.language` → mock entity country → mock IP → fallback `'en'`
- On `setLanguage`, persist to localStorage

### 2. Create a Translations File (`src/lib/translations.ts`)
- Key-value map for `en` and `es`
- Cover all profile sheet labels: "Work documents", "Personal details", "Support", "Privacy policy", "Log out", "Language", "Name", "Location", "Phone number", "Email address", plus the language option labels themselves

### 3. Add Language Switcher to Profile Sheet (`src/components/layout/top-bar.tsx`)
- Add a new card row in the main profile menu (between "Personal details" and "Support") with a `Globe` icon and label "Language" / "Idioma"
- Tapping it navigates to a sub-panel (same animated pattern as Personal details) showing two selectable options: English and Español
- Active language gets a checkmark
- Selecting a language calls `setLanguage`, updates localStorage, and the UI re-renders

### 4. Wire Up the Context
- Add `LanguageProvider` in `src/App.tsx` (or `main.tsx`) wrapping the app
- Update the profile sheet to use `t()` for all visible labels

### Technical Details

- The `t()` function signature: `t(key: string) => string`
- localStorage key: `huspy-language`
- Mock constants for entity country and IP country (both set to `'ES'` to simulate Spain defaults)
- No external i18n library — lightweight custom implementation matching the app's pattern of simple React contexts

