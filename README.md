# Jstz Chrome extension wallet

This project is a Chrome web browser extension that acts as a wallet, allowing users to sign calls to [Jstz](https://jstz-dev.github.io/jstz/) smart functions.
The extension is built using React, TypeScript, and Vite.

This extension is not yet available on the Chrome Web Store, so you must build and install it locally.

## Warning

This extension is a development tool and is not yet ready for production deployments.
To avoid exposing your private keys, do not import keys for accounts that you are using on Tezos Mainnet into this extension.
This extension does not support integration with hardware wallets such as Ledger.

## Project structure

- `src/`: Source code for the extension
- `public/`: Static assets and manifest file
- `dist/`: Build output directory
- `examples/`: Example projects to interact with the extension

## Getting started

### Prerequisites

- Node.js (v22 or higher) - exact version specified in `.nvmrc`
- pnpm (v10 or higher) - exact version + hash specified in `package.json`
- Google Chrome browser - Chrome is the only supported browser
### Installation

1. Download the extension file from [here](https://github.com/jstz-dev/dev-wallet/raw/refs/heads/main/dist.zip)
2. Unzip the downloaded file to a directory of your choice.
3. Open Google Chrome and navigate to `chrome://extensions/`.
4. Enable "Developer mode" by toggling the switch in the top right corner.
5. Click the "Load unpacked" button.
6. Select the directory where you unzipped the extension files.
7. The extension should now appear in the extensions toolbar in the browser.

### Building from source

Follow these steps to build the extension and install it in Google Chrome:

1. Clone the repository:
   ```sh
   git clone git@github.com:jstz-dev/dev-wallet.git
   cd dev-wallet
   ```

2. Install dependencies:
   ```sh
   pnpm i
   ```

3. Build the extension:
   ```sh
   pnpm build
   ```
   The build output is in the `dist/` directory.

4. Add the extension to Chrome:

   1. Open Chrome and navigate to `chrome://extensions/`.
   2. Enable "Developer mode" by toggling the switch in the top right corner.
   3. Click the "Load unpacked" button.
   4. Select the `dist/` directory you have just built.

The extension appears in the extensions toolbar in the browser.

## Using the extension

You can click the extension icon to open it and create or import an account.

When you use a web application that sends requests to Jstz, it opens the extension and prompts you to sign the transaction with your active Jstz account.
You can start with the sample application in the `examples/web-call-to-jstz` directory.
To create your own implementation, see the attached [SNIPPET.md](SNIPPET.md) that shows how to prompt the wallet to sign a Jstz transaction.
