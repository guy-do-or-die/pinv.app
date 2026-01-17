const { ethers } = require("ethers");

async function main() {
    const wallet = ethers.Wallet.createRandom();

    // Strict SIWE Format with Expiration
    // Expiration is required by Lit Node validators. MAX 30 DAYS allowed.
    const expiration = new Date(Date.now() + 1000 * 60 * 60 * 24 * 29).toISOString(); // 29 days

    const message = `localhost:3000 wants you to sign in with your Ethereum account:
${wallet.address}

Lit Action Dummy Session

URI: https://localhost:3000
Version: 1
Chain ID: 1
Nonce: 000000000000000000
Issued At: ${new Date().toISOString()}
Expiration Time: ${expiration}`;

    const sig = await wallet.signMessage(message);

    console.log("Address:", wallet.address);
    console.log("Signature:", sig);
    console.log("Signed Message:", JSON.stringify(message));
}

main();
