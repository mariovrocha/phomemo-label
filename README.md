# Phomemo D30 Label Printer

A web app for designing and printing QR code labels on a **Phomemo D30** thermal label printer via **Web Bluetooth**.

**Live app:** [mariovrocha.github.io/phomemo-label](https://mariovrocha.github.io/phomemo-label/)

## Features

- Connect to a Phomemo D30 printer wirelessly via Bluetooth
- Create, edit, and delete labels with a live preview
- Each label renders a QR code (from line 1) alongside two text lines
- Select/deselect labels for batch printing
- Labels without a product name are excluded from printing
- Pre-populate labels via URL search params (see below)
- Fully responsive design

## Pre-populating labels via URL

You can pass labels as a JSON array in the `labels` query parameter. Each label object has two fields:

| Field   | Description                        | Required |
|---------|------------------------------------|----------|
| `text1` | Primary text (encoded in QR code)  | Yes      |
| `text2` | Secondary text (displayed below)   | No       |

### Example

```
https://mariovrocha.github.io/phomemo-label/?labels=[{"text1":"NLLP000001","text2":"SKU-111"},{"text1":"NLLP000002","text2":"SKU-222"},{"text1":"NLLP000003","text2":"SKU-333"},{"text1":"NLLP000004","text2":"SKU-444"}]
```

URL-encoded version:

```
https://mariovrocha.github.io/phomemo-label/?labels=%5B%7B%22text1%22%3A%22NLLP000001%22%2C%22text2%22%3A%22SKU-111%22%7D%2C%7B%22text1%22%3A%22NLLP000002%22%2C%22text2%22%3A%22SKU-222%22%7D%2C%7B%22text1%22%3A%22NLLP000003%22%2C%22text2%22%3A%22SKU-333%22%7D%2C%7B%22text1%22%3A%22NLLP000004%22%2C%22text2%22%3A%22SKU-444%22%7D%5D
```

## Requirements

- A browser that supports **Web Bluetooth** (Chrome, Edge, Opera — not Firefox or Safari)
- A **Phomemo D30** label printer
- Labels: 40x12mm at 203 DPI

## Enabling Web Bluetooth

### Desktop (Chrome / Edge)

Web Bluetooth may be disabled by default on some desktop platforms (e.g. Linux, older Windows builds). To enable it:

1. Open `chrome://flags` in the address bar
2. Search for **Web Bluetooth**
3. Set **Experimental Web Platform features** to **Enabled**
4. Restart the browser

> On macOS and Windows, Web Bluetooth is typically enabled by default in Chrome.

### Android (Chrome)

Web Bluetooth works out of the box on Chrome for Android. Just make sure:

1. **Bluetooth** is turned on in your device settings
2. **Location** is enabled (Android requires location access for Bluetooth scanning)
3. When the browser prompts to pair, select your **D30** printer from the list

### iOS / iPadOS

Web Bluetooth is **not supported** in Safari. As an alternative you can use the [Bluefy](https://apps.apple.com/app/bluefy-web-ble-browser/id1492822055) browser which adds Web Bluetooth support on iOS.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment

The app is automatically deployed to GitHub Pages on every push to `main` via GitHub Actions. It uses Next.js static export (`output: "export"`).

## Tech stack

- [Next.js](https://nextjs.org) (App Router, static export)
- [React](https://react.dev)
- [TypeScript](https://www.typescriptlang.org)
- [Tailwind CSS](https://tailwindcss.com)
- [Web Bluetooth API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Bluetooth_API)
- [qrcode](https://www.npmjs.com/package/qrcode) for QR code generation
