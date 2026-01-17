import { LitNodeClient } from '@lit-protocol/lit-node-client';
import { EncryptedParam } from './og-common';
import { toV0 } from './cid';
import { encryptString, decryptToString } from '@lit-protocol/encryption';
import { createSiweMessage, LitActionResource } from '@lit-protocol/auth-helpers';
import { ethers } from 'ethers';
import { env } from '../web/env';

// Singleton instance
let litClient: LitNodeClient | null = null;

const connectLit = async () => {
    if (litClient) return litClient;

    const client = new LitNodeClient({
        litNetwork: 'datil-dev', // or 'cayenne', 'manzano', 'habanero' based on env. Using hardcoded for now or env?
        debug: false
    });

    await client.connect();
    litClient = client;
    return client;
};

/**
 * Encrypts a parameter string so that:
 * 1. The specified Lit Action (via CID) can decrypt it.
 * 2. OR the Creator (userAddress) can decrypt it (for editing).
 * 
 * @param value The plaintext value to encrypt
 * @param litActionCid The IPFS CID of the Lit Action that is allowed to decrypt this
 * @param creatorAddress The address of the user creating/encrypting the parameter
 */
export async function encryptParam(value: string, litActionCid: string, creatorAddress: string): Promise<EncryptedParam> {
    const client = await connectLit();

    // Access Control Condition:
    // (Current Action CID == Expected CID) OR (Creator Address)

    // We use the ":currentActionIpfsId" substitution variable which Lit Nodes 
    // populate with the CID of the currently executing code.
    const cidV0 = toV0(litActionCid);

    const accessControlConditions = [
        {
            contractAddress: '',
            standardContractType: '',
            chain: 'ethereum',
            method: '',
            parameters: [':currentActionIpfsId'],
            returnValueTest: {
                comparator: '=',
                value: cidV0
            }
        },
        { operator: "or" },
        {
            contractAddress: '',
            standardContractType: '',
            chain: 'ethereum',
            method: '',
            parameters: [':userAddress'],
            returnValueTest: {
                comparator: '=',
                value: creatorAddress
            }
        }
    ];

    const { ciphertext, dataToEncryptHash } = await encryptString(
        {
            accessControlConditions,
            dataToEncrypt: value,
        },
        client
    );

    return {
        ciphertext,
        dataToEncryptHash,
        accessControlConditions
    };
}

/**
 * Decrypts a parameter.
 * Used by the client-side editor when the user (creator) wants to view/edit the secret.
 */
export async function decryptParam(encryptedParam: EncryptedParam): Promise<string> {
    const client = await connectLit();

    // Trigger signature request via wallet
    // decryptToString requires explicit authSig.
    // We implement checkAndSignAuthMessage manually since it's missing from the client instance.

    // 1. Get Wallet (Browser)
    if (typeof window === 'undefined' || !window.ethereum) {
        throw new Error("No wallet provider found");
    }
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const address = await signer.getAddress();

    // 2. Prepare SIWE Message
    // Lit requires specific resources/abilities for decryption? 
    // Actually, for simple decryption, a standard login signature is often enough if the ACC checks for address.
    // The standard checkAndSignAuthMessage generates a message for URI.

    const latestBlockhash = await client.getLatestBlockhash();

    // 3. Create SIWE Message using auth-helpers
    const siweMessage = await createSiweMessage({
        uri: window.location.origin,
        expiration: new Date(Date.now() + 1000 * 60 * 10).toISOString(), // 10 mins
        resources: [
            {
                resource: new LitActionResource('*'),
                ability: 'lit-action-execution', // We are technically "executing" decryption? Or just 'decryption'?
                // For ACC checking "userAddress", any valid signature from that address works.
                // Standard login usually requests access to '*'.
            }
        ],
        walletAddress: address,
        nonce: latestBlockhash,
        litNodeClient: client,
    });

    // 4. Sign Message
    const signature = await signer.signMessage(siweMessage);

    const authSig = {
        sig: signature,
        derivedVia: 'web3.eth.personal.sign',
        signedMessage: siweMessage,
        address: address,
    };

    const decryptedString = await decryptToString(
        {
            accessControlConditions: encryptedParam.accessControlConditions,
            ciphertext: encryptedParam.ciphertext,
            dataToEncryptHash: encryptedParam.dataToEncryptHash,
            chain: 'ethereum',
            authSig: authSig
        },
        client
    );

    return decryptedString;
}
