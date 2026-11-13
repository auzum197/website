# Rules for agents

- Inline comments are banned: no `//` comments and no plain `/* */` block comments. Doc comments (`/** */`) are permitted.
- TypeScript only. No JavaScript files.
- Dark mode only. Other hues are permitted only as a project's own colors, and only on hover.
- Colors and sizes are tokens in `:root`. Do not repeat a value at the point of use.
- `/about` is unlinked on purpose. Do not add a link to it.
- Icons: Tabler Icons only. Do not use text glyphs as icons.
- Contrast: check text with APCA. Do not put text below Lc 75.
- Sample data in card graphics is invented. Do not present it as real.
- Style: simple, hacker-like, compact. Few lines, round corners on surfaces.
- Copy: minimum text. It must not read like a pitch: we sell nothing. Say only what is. Do not define by negation ("not X"), and do not add clarifications. No all-caps labels.
- Run `pnpm check` before you finish a change.
