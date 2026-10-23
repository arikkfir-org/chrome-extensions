# chrome-extensions

Small Chrome extensions, written here rather than installed from the Chrome Web Store so that each gets only the access it needs.

| Extension                           | What it does                                                                                            |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------- |
| [Tab Auto-Closer](tab-auto-closer/) | Closes tabs whose address matches your patterns (by default Slack's "open in app" pages) after a delay. |

## Tab Auto-Closer

Opening a Slack link (or a Zoom or Teams one) leaves a tab behind once the desktop app takes over. Tab Auto-Closer closes such tabs a few seconds after they load (3 by default), and shows a banner that counts down and lets you keep the tab open.

Its options page (the toolbar icon, or right-click it and pick **Options**) holds the delay and the list of URL patterns, one per line, as Chrome [match patterns](https://developer.chrome.com/docs/extensions/develop/concepts/match-patterns). The defaults cover Slack's hand-off pages, which leave Slack's web client (`app.slack.com/client`) alone:

```text
https://*.slack.com/archives/*
https://*.slack.com/app_redirect*
https://*.slack.com/ssb/redirect*
```

Other services' hand-off pages, to add if you use them:

```text
https://*.zoom.us/j/*
https://teams.microsoft.com/l/*
```

The extension installs with no access to any site. **Save** on the options page asks Chrome for access to the sites the patterns name, and gives up access to sites no pattern needs anymore; the **Sites** list shows which have it. Until you save once after installing, no tab gets closed. Settings sync with your Chrome profile.

Chrome asks "Open Slack?" the first time a page hands a link to the app. Tick **Always allow** in that prompt, or the tab may close before you answer it.

Design: [Tab Auto-Closer](docs/chrome-extensions/designs/tab-auto-closer.md).

## Install from this repository

1. Clone this repository.
2. Open `chrome://extensions` and turn on **Developer mode** (top right).
3. Click **Load unpacked** and pick the extension's directory, e.g. `tab-auto-closer/`.
4. On the options page that opens, click **Save** and allow access to the sites listed.

After pulling changes, click the extension's reload button on `chrome://extensions`. An unpacked extension stays on the machine it was loaded on: repeat these steps in every browser.

## Publish to the Chrome Web Store

Publishing lets every Chrome you sign in to install and update the extension, with no developer mode.

1. Register once at the [Chrome Web Store developer dashboard](https://chrome.google.com/webstore/devconsole) (a one-time fee).
2. Run `make package`, which writes `dist/<extension>.zip`.
3. In the dashboard, add a new item, upload the zip, and fill in its listing and privacy practices.
4. Under **Distribution**, pick a visibility: **Private** shows it only to the testers you list by email, **Unlisted** to anyone with its link, **Public** to everyone.
5. Submit it for review. A new version is the same zip with a higher `version` in `manifest.json`.

## Develop

`make test` runs the unit tests (Node.js 22 or later), and `npm ci && npm run format` formats everything with Prettier. Check `Continuous Integration` (`.tekton/ci.yaml`, run by Octomaton) runs both on every pull request and in the merge queue.
