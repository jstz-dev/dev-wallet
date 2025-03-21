# Jstz Chrome Extension Wallet

This project is a Jstz Chrome extension that allows users to sign calls to a smart function using their wallet. 
The extension is built using React, TypeScript, and Vite.

## Project Structure

- `src/`: Source code for the extension
- `public/`: Static assets and manifest file
- `dist/`: Build output directory
- `examples/`: Example projects to interact with the extension

## Getting Started

### Prerequisites

- Node.js (v22 or higher) - exact version specified in `.nvmrc`
- pnpm (v10 or higher) - exact version + hash specified in `package.json`

### Installation

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
   The build output will be in the `dist/` directory.

## Adding the Extension to Chrome in Dev Mode
1. Open Chrome and navigate to chrome://extensions/.
2. Enable "Developer mode" by toggling the switch in the top right corner.
3. Click on the "Load unpacked" button.
4. Select the `dist/` directory you have just built.
5. The extension should now be added to Chrome and ready for testing.

## Interacting

- wallet can be generated or imported from the extension pop-up, or you will be prompted with a dialog when trying to sign
a smart function call.
- example project can be found in the `examples/web-call-to-jstz` directory.
- if you want to create your own implementation please find the attached [SNIPPET.md](SNIPPET.md)
