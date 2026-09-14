# LocalToolBox agent notes

Recurring defects this pass (kill at the source next time, don’t rediscover):

- **Chrome vs copy mismatch.** Sidebar says “Categories”; page copy invented “bays/Homebase”. Name things the same way the nav does.
- **Keyboard shortcuts vs editors.** Global `/` and Cmd/Ctrl+K must no-op when focus is in `input`, `textarea`, `select`, or `contenteditable` — every tool is an editor.
- **Blob URLs.** `URL.createObjectURL` in render (screen recorder) and slider-triggered preview resets without `revokeObjectURL` leak until the tab dies. Create URLs in state/effects; revoke on replace, unmount, and stale async completion.
- **Theme boot vs CSS `color-scheme`.** `data-theme` alone is not enough; set `data-appearance` + `color-scheme` in the inline boot script *and* `applyTheme`, or light themes flash dark scrollbars/form controls.
