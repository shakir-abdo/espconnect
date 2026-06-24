# AGENTS.md

## Project scope
ESPConnect is a desktop application for connecting to and monitoring ESP devices, including serial communication and device management. Automated agents are authorized to modify code and assets within this repository.

## Code modification authority
Agents may create, edit, move, and delete files; refactor code when instructed; and apply migrations or architectural changes. Agents do not need confirmation for normal code changes. Do not modify or exfiltrate secrets, credentials, licenses, signing material, or CI/CD keys.

## Technology constraints
- Vue 3 Composition API only
- TypeScript required
- Vuetify UI
- No Options API
- No direct DOM manipulation
- No MutationObservers or DOM walkers

## Internationalization rules
- All UI text must use Vue I18n
- No hardcoded UI strings
- No DOM-based translation logic
- Serial/device output must never be translated
- Session log entries must remain English-only and must not be translated
- Translation keys must be namespaced (e.g., `common.*`, `serial.*`)
- Keep keys consistent with existing structure
- Preserve formatting/whitespace unless required
- Preserve placeholders exactly (e.g., `{fs}`, `{language}`, `{count}`)
- Do not translate technical terms unless the UI already does so consistently
- When adding a locale, mirror `en.ts`, register it in `src/plugins/i18n.ts`, extend `supportedLocales`, and add the language name in the `language` block

## Serial Monitor rules
- ANSI escape sequences must render as colors
- Raw ANSI codes must never be displayed
- Serial output must be preserved verbatim except for ANSI rendering

## Behavioral rules
- Prefer clarity over cleverness
- Keep diffs minimal and reviewable
- Keep changes focused (one feature/fix at a time)
- Do not introduce breaking changes unless explicitly instructed
- Follow existing project structure and naming

## Error handling philosophy
- Transport/probe failures should be non-fatal where possible
- Prefer graceful degradation over hard failure
- Improve error messages when upstream libraries are vague

## Acceptance criteria
- Changes must build successfully
- Typecheck, unit tests, and E2E tests must pass when applicable
- Existing functionality must not regress
- UI behavior must remain intuitive for end users
