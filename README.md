# PinV ᵅ [WIP]

**PinV** turns dynamic, AI-generated widgets into tradable, ownable assets (ERC1155 tokens) on Farcaster. It creates a new economy for interactive content, allowing users to "pin" live applications—showing real-time data like weather, markets, or social feeds—directly to their profiles.

## 🌟 Vision & Mechanics

### 📌 The "Pin" Protocol
- **ERC1155 Tokens**: Each Pin is an ERC1155 token. Ownership grants the right to configure and display the widget.
- **Dynamic Content**: Unlike static NFTs, Pins display real-time data (weather, prices, commit history) rendered on-demand.
- **Cast & Preview**: Pins are designed to be "casted" into the feed or "pinned" to a user's Farcaster profile/channel, providing a live window into dynamic content.

### 🧠 Decentralized Logic (Lit Protocol)
- **Lit Actions**: The "brain" of each Pin. This is the javascript code responsible for fetching data and logic.
- **Owner-Only Updates**: The Lit Action logic is bound to the token. Only the current token owner can authorize changes to the widget's configuration or parameters via Lit Protocol.
- **Secret Management**: API keys and secrets are encrypted and attached to the token, accessible only by the Lit Action during execution.

### 📦 Storage & Versioning
- **IPFS Storage**: The widget's source code (Lit Action + React UI) is encoded and stored on IPFS.
- **Metadata Link**: The IPFS hash (CID) is stored in the token's metadata, ensuring immutability and version history for both the logic and the System Prompt used to generate it.

### 💸 Economy & Incentives
- **Minting & Cloning**: Anyone can "mint" a copy of a popular Pin to use on their own profile (with their own parameters, e.g., their own City or FID).
- **Fee Sharing**:
  - **Platform Fees**: Sustainable revenue for the protocol.
  - **Creator Royalties**: The original creator (minter) of a Pin receives a share of fees from subsequent mints and trading volume, incentivizing high-quality, useful widgets.

## 🛠️ Current Status: Work In Progress

This project is currently in active development.

- ✅ **AI Generation**: Robust generation of Lit Actions and React UI.
- ✅ **Base Mini App**: Integrated and configured as a Farcaster Frame v2.
- 🚧 **Smart Contracts**: ERC1155 integration and Fee Sharing logic (In Design).
- 🚧 **IPFS Integration**: Storage adapter for code and metadata (In Progress).
- 🚧 **Lit Protocol**: Full decentralized execution environment (In Progress).

## Getting Started

### Prerequisites

*   **Base App Account** (for Mini App features)
*   **Farcaster Account**
*   Node.js & npm

### Installation

1.  **Clone**: `git clone https://github.com/guy-do-or-die/pinv.app.git`
2.  **Install**: `npm install`
3.  **Env**: Copy `.env.example` to `.env.local` and add your keys (e.g., `AI_API_KEY`).

### Development & Verification

Run the local development server:

```bash
npm run dev
```

**Verify Farcaster/Base Integration**:
1.  Run the app locally or tunnel with `ngrok`.
2.  Visit the [Base Build Preview](https://www.base.dev/preview).
3.  Enter your app URL to validate the Manifest and metadata.

## Configuration

All application settings (metadata, image URLs, Base address) are centralized in `lib/config.ts`.
- Update `ownerAddress` with your Base Account address.
- Ensure `accountAssociation` signature is set in `app/.well-known/farcaster.json/route.ts` for production.
