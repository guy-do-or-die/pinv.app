// Simple implementation of a "sandbox" for Lit Action code in Node.js
// using standard Function constructor (like client-side).
// TODO: harden with 'vm2' or independent isolated-vm if security is critical later.

import { NormalizedParams } from '../../lib/og-common';
import { LitNodeClient } from '@lit-protocol/lit-node-client';
import { LIT_NETWORK } from '@lit-protocol/constants';
import { LitActionResource, createSiweMessage } from '@lit-protocol/auth-helpers';
import { ethers } from 'ethers';

// Global client instance to avoid reconnecting on every request
let litClient: LitNodeClient | null = null;
let litWallet: ethers.Wallet | null = null;

const NETWORK = process.env.LIT_NETWORK || 'datil-dev';
const DEBUG = process.env.LIT_DEBUG === 'true';

async function getLitClient() {
    if (litClient) return litClient;

    console.log(`[OG] Connecting to Lit Network: ${NETWORK}`);
    litClient = new LitNodeClient({
        litNetwork: NETWORK as any,
        debug: DEBUG
    });

    await litClient.connect();

    // Create a random wallet for signing session requests
    // We reuse this wallet for the lifecycle of the server process
    if (!litWallet) {
        litWallet = ethers.Wallet.createRandom() as unknown as ethers.Wallet;
    }

    return litClient;
}

export async function executeLitAction(
    code: string,
    params: NormalizedParams
): Promise<{ result: Record<string, unknown> | null, logs: string[] }> {
    if (!code || !code.trim()) return { result: {}, logs: [] };

    const logs: string[] = [];

    try {
        const client = await getLitClient();
        if (!litWallet) throw new Error("Lit Wallet not initialized");

        // Prepare JS params
        const jsParams: Record<string, any> = {};
        for (const [k, v] of Object.entries(params)) {
            try {
                if (v.startsWith('{') || v.startsWith('[') || v === 'true' || v === 'false' || !isNaN(Number(v))) {
                    jsParams[k] = JSON.parse(v);
                } else {
                    jsParams[k] = v;
                }
            } catch {
                jsParams[k] = v;
            }
        }

        console.log(`[OG] Executing Lit Action on ${NETWORK}...`);

        // Generate Session Sigs (required for most actions in v6+)
        // For simple "executeJs" without signing, we still need auth context
        const sessionSigs = await client.getSessionSigs({
            chain: 'ethereum',
            expiration: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(), // 24 hours
            resourceAbilityRequests: [
                {
                    resource: new LitActionResource('*') as any,
                    ability: 'lit-action-execution' as any,
                },
            ],
            authNeededCallback: async ({
                uri,
                expiration,
                resourceAbilityRequests,
            }) => {
                const toSign = await createSiweMessage({
                    uri,
                    expiration,
                    resources: resourceAbilityRequests as any,
                    walletAddress: litWallet!.address,
                    nonce: await client.getLatestBlockhash(),
                    litNodeClient: client,
                });

                const signature = await litWallet!.signMessage(toSign);

                return {
                    sig: signature,
                    derivedVia: 'web3.eth.personal.sign',
                    signedMessage: toSign,
                    address: litWallet!.address,
                };
            },
        });

        // Execute on Lit Network
        // Nest params under 'jsParams' so it appears as a global variable in Lit Action
        // This matches the AI generator pattern: const main = async (jsParams) => ...
        const litParams = { jsParams: params };

        // Append runner to call 'main' and handling response
        const wrappedCode = `
${code}

if (typeof main === 'function') {
  main(jsParams).then((res) => {
    Lit.Actions.setResponse({ response: JSON.stringify(res) });
  }).catch((err) => {
    console.error("Execution failed:", err);
    Lit.Actions.setResponse({ response: JSON.stringify({ error: err.message }) });
  });
}
`;

        console.log(`[Executor] Executing wrapped code...`);
        // console.log(wrappedCode); 

        const res = await client.executeJs({
            code: wrappedCode,
            jsParams: litParams,
            sessionSigs
        });

        console.log('[Executor] Raw Lit Response:', JSON.stringify(res, null, 2));

        // Format logs
        const logs = (res.logs || "").split('\n');

        // Parse result
        let result = null;
        if (res.response) {
            try {
                // Lit Action response is stringified JSON
                result = typeof res.response === 'string' ? JSON.parse(res.response) : res.response;
                console.log('[Executor] Parsed Result:', result);
            } catch (e) {
                console.error('[Executor] Failed to parse response:', e);
                logs.push(`Error parsing response: ${e}`);
            }
        } else {
            console.warn('[Executor] No response field in result');
            // Attempt to extract from logs if panic?
        }

        return { result, logs };

    } catch (e: any) {
        console.error('[Executor] Execution failed:', e);
        return {
            result: null,
            logs: [e.message || String(e)]
        };
    }
}
