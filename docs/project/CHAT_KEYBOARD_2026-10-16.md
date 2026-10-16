# Message composer and mobile keyboards

Flutter home intake, home conversation, clarification and case chat now reserve a composer outside scrollable history. The scaffold resizes above the keyboard, temporarily hides the bottom navigation, and uses a compact header while typing. The arrow and microphone are part of the field. The keyboard Send/Enter action invokes the same guarded send function. Existing controllers retain unsent text and normal error/retry behavior.

Web home/case chat listens to visual-viewport resize/scroll events. When the keyboard covers the layout viewport (Safari), its measured offset positions the composer above it; when the viewport itself resizes, the offset is zero. The navigation and large header give way while typing. A 16px message font prevents Safari's small-input auto-zoom. Enter sends once; Shift+Enter inserts a newline. The normal closed-keyboard page layout remains available.

Validation: full project check passed (151 API tests, 60 Flutter tests, seven AI tests), web production build and Docker configuration passed. Added Flutter regressions exercise keyboard insets from 260 to 410px, a 320×568 screen and the actual IME Send action against the case API fixture. Chromium and WebKit layout/key-event checks use simulated visual viewports at 320×568 and 390×844, with long history, changing keyboard heights and viewport offsets. They check field/arrow bounds, navigation restoration, Enter/arrow exactly-once delivery and Shift+Enter. These are layout fixtures, separate from live OpenAI/source/document verification. CI runs both browser engines against the deployed site.

No physical iPhone or signed App Store build was tested/uploaded in this cloud environment. The native change needs a new signed build on the user's Mac. A website deployment does not update an installed native binary.

Latest scope: the user requested web only; no Mac action or iOS upload was performed. Release 2092f21 was installed by workflow 38911850010 and passed its public health check. A separate Chromium/WebKit run against the actual public site passed all simulated keyboard/Enter/arrow/Shift+Enter checks (`/tmp/aizan-web-only-keyboard-proof.log`). This proves the deployed web layout with simulated viewport changes, not a physical iPhone keyboard. Final local checks passed 160 API tests, 60 Flutter tests and seven AI tests.

On the Mac, run the following from the existing repository. The isolated checkout preserves local work and uses the existing signing identity and App Store Connect key from the Mac (or its configured environment variables). It builds, uploads and selects an editable App Store draft; it does not submit for review or publish. After installing the new build, check a long conversation with the keyboard open, the send arrow, the keyboard Send action and dictation on the physical iPhone.

```bash
git fetch origin deploy/aizan-server
AIZAN_RELEASE_DIR=$(mktemp -d /tmp/aizan-release.XXXXXX)
git archive FETCH_HEAD | tar -x -C "$AIZAN_RELEASE_DIR"
cd "$AIZAN_RELEASE_DIR"
node scripts/release/build-ios-on-mac.mjs --upload
```
