# Knit/Crochet Log

[한국어](README.ko.md) · [Open the app](https://jinalee-soc.github.io/crochet/)

Track crochet and knitting projects, needle sizes and notes. Keep photos of finished work and create project cards or a year-in-review image. Existing projects and bulk-added finished projects default to crochet; change the type in the project editor.

Optionally record the yarn name, color, and pattern link for each project. Search finished projects by name, yarn, or color. Project cards include yarn and color when supplied; pattern links are not included in shared images.

New installations start with two fictional examples and cartoon illustrations. Use **Remove examples** to delete them or **Show examples** to add them again. Examples are not automatically added to existing databases. Saving an edited example turns it into your own project. Projects still marked as examples are not included in backups.

## Your records stay on your device

GitHub Pages serves the app files. Your project records and photos are stored in **IndexedDB in your browser**, not in this repository or an application database on a server.

Everyone can open the same address and keep their own collection. Other visitors cannot see your records through the app. No account or local server is required.

Records do not automatically sync between devices or browsers. Use **Backup → Create backup file** to export records and photos. Use **Import** to restore them elsewhere. Matching projects are replaced by the imported backup.

Keep a backup before clearing browser data or changing devices. Browser storage can be cleared or evicted. Private browsing may not retain it. Store backups somewhere safe, such as iCloud Drive. Sharing a card or backup sends that file to the destination you select.

## Korean and English

Use **국문** at the top of the English interface to switch to Korean. Use **ENG** in the Korean interface to switch to English. The first visit uses your browser language: Korean for Korean browsers, English otherwise. Your choice is remembered when browser storage is available.

The interface, messages, dates and generated card labels follow that choice. Project names and notes remain exactly as you entered them. Changing language does not move, translate or delete your records or photos.

## Use it like an app

On iPhone, open the site in Safari. Choose **Share → Add to Home Screen**. After the initial app files are cached, you can use the app offline. Open it online to receive updates.

Select your preferred language before adding it to the home screen. An existing home-screen icon may keep its original name after you change the in-app language.

## Development

This is a static app. No build step or backend is required.

```sh
python3 -m http.server 8000
node tests/i18n.test.cjs
```

Open `http://localhost:8000`. Translations are in `i18n.js`. Increment the cache version in `sw.js` when publishing changes. Keep new offline dependencies in its `SHELL` list. Both manifests use the same application identity and storage.
