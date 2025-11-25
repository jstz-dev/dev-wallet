# Jstz Chrome extension wallet

This project is a Chrome web browser extension that acts as a wallet, allowing
users to sign calls to [Jstz](https://jstz-dev.github.io/jstz/) smart functions.
The extension is built using React, TypeScript, and Vite.

This extension is not yet available on the Chrome Web Store, so you must build
and install it locally.

> [!WARNING]
> This extension is a development tool and is not yet ready for production deployments.
> To avoid exposing your private keys, do not import keys for accounts that you are
> using on Tezos Mainnet into this extension. This extension does not support
> integration with hardware wallets such as Ledger.

## Installation of the pre-built extension

1. Get the newest [release](https://github.com/jstz-dev/dev-wallet/releases/latest)
2. Unzip the downloaded file to a directory of your choice.
3. Open Google Chrome and navigate to `chrome://extensions/`.
4. Enable "Developer mode" by toggling the switch in the top right corner.
5. Click the "Load unpacked" button.
6. Select the directory where you unzipped the extension files.
7. The extension should now appear in the extensions toolbar in the browser.

## Project structure

- `apps/signer/`: Source code for the extension
- `apps/signer/public/`: Static assets and manifest file
- `apps/signer/dist/`: Build output directory
- `apps/examples/`: Example projects to interact with the extension
- `packages`: Dependencies

## Building from source

### Prerequisites

- Node.js (v22 or higher) - exact version specified in `.nvmrc`
- pnpm (v10 or higher) - exact version + hash specified in `package.json`
- Google Chrome browser - Chrome is the only supported browser

### Building

Follow these steps to build the extension and install it in Google Chrome:

1. Clone the repository:

   ```sh
   git clone git@github.com:jstz-dev/dev-wallet.git
   cd dev-wallet
   ```

2. Clone the required submodules:

   ```sh
   git submodule update --init
   ```

3. Go to the folder with the extension:

   ```sh
   cd apps/signer
   ```

4. Install the dependencies:

   ```sh
   pnpm i
   ```

   We also have a `postinstall` hook in the root `package.json` that builds `packages/passkey-signer` and `packages/passkey-signer-react`.

   Both of those packages have to be rebuilt after each change in their codebase.

5. Build the extension:

   ```sh
   pnpm build
   ```

   The build output is in the `dist/` directory.

### Installation

1. Open Chrome and navigate to `chrome://extensions/`.
2. Enable "Developer mode" by toggling the switch in the top right corner.
3. Click the "Load unpacked" button.
4. Select the `apps/signer/dist/` directory that you have just built.

The extension appears in the extensions toolbar in the browser.

## Using the extension

You can click the extension icon to open it and create or import an account.

When you use a web application that sends requests to Jstz, it opens the
extension and prompts you to sign the transaction with your active Jstz account.
You can start with the sample application in the `apps/examples/web-call-to-jstz` directory.
To create your own implementation, see the attached [SNIPPET.md](SNIPPET.md) that
shows how to prompt the wallet to sign a Jstz transaction.
