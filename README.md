# PinVᵅ [WIP]

**PinV** turns dynamic, AI-generated widgets into tradable, ownable assets (ERC1155 tokens). It allows users to "pin" live applications—showing real-time data like data lenses, markets, scores, news, or social feeds—directly to their profiles.

## 🌟 Vision & Mechanics

### 📌 The "Pin" Protocol
- **ERC1155 Tokens**: Each Pin is an ERC1155 token. Ownership grants the right to configure and display the widget.
- **Dynamic Content**: Unlike static NFTs, Pins display real-time data rendered on-demand.
- **Cast & Preview**: Pins are designed to be "casted" into the feed or "pinned" to a user's profile/channel.

### 🔐 PinV Box (Secure Runtime)
- **TEE Powered**: The "brain" of each Pin is a secure microservice running in a Trusted Execution Environment (PinV Box).
- **Private Secrets**: API keys and sensitive parameters are encrypted and only decrypted inside the secure enclave.
- **Verifiable Execution**: Code execution is isolated and verifiable.

### 📦 Storage & Versioning
- **IPFS Storage**: The widget's source code and metadata are stored on IPFS.
- **Immutability**: The IPFS hash (CID) is linked to the token, ensuring version history for both logic and UI.

## 📂 Monorepo Structure

This project is organized as a monorepo with the following workspaces:

- **[web](./web)**: Next.js frontend and Farcaster MiniApp/Frame.
- **[box](./box)**: Secure TEE runtime (Node.js/Bun) for executing private logic.
- **[og](./og)**: High-performance caching and image generation engine (Fastify/Satori).
- **[contracts](./contracts)**: Solidity smart contracts (Foundry).

## 🚀 Getting Started

### Prerequisites

*   **Bun** (Required for package management)
*   **Docker** (For local Box simulation)
*   **Farcaster Account** (For testing Frames)

### Installation

1.  **Clone**:
    ```bash
    git clone https://github.com/guy-do-or-die/pinv.app.git
    cd pinv.app
    ```

2.  **Install Dependencies**:
    ```bash
    bun install
    ```

3.  **Environment Setup**:
    Copy `.env.example` to `.env.local` and populate the necessary keys.
    ```bash
    cp .env.example .env.local
    ```

### Local Development

You can run individual services or the full stack.

**Run Web (Frontend):**
```bash
bun run dev:web
# -> http://localhost:3333
```

**Run OG Engine:**
```bash
bun run dev:og
# -> http://localhost:4444
```

**Run Box (Secure Runtime):**
```bash
bun run dev:box
# -> http://localhost:5555
```

## 🛠️ Deployment

- **Web**: Deploys to Vercel (Next.js).
- **OG**: Deploys to Fly.io (Docker).
- **Box**: Deploys to Phala Network (Docker).

## 📄 License
MIT