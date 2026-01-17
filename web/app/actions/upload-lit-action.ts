"use server";

import { PinataSDK } from "pinata";
import { env } from "@/env";

const pinata = new PinataSDK({
    pinataJwt: env.PINATA_JWT,
    pinataGateway: env.NEXT_PUBLIC_IPFS_GATEWAY,
});

/**
 * Uploads Public Lit Action Code to IPFS via Server.
 * 
 * SECURITY NOTE: 
 * This function handles ONLY the public logic template (code).
 * It DOES NOT and SHOULD NOT handle any encrypted parameters or user secrets.
 * Secrets are encrypted client-side and passed to the Lit Node during execution.
 * 
 * Motivation:
 * Pinata V3 Client-Side Signed Uploads force 'Raw' encoding (CIDv1).
 * Lit Nodes validate content using 'DAG-PB' encoding (CIDv0).
 * This Server Action forces 'cidVersion: 0' (DAG-PB) to ensure compatibility.
 */
export async function uploadLitAction(code: string): Promise<string> {
    try {
        const file = new File([code], "lit-action.js", { type: "text/javascript" });
        // @ts-ignore - SDK types might be strict, but runtime error says 'v0' is expected
        const upload = await pinata.upload.public.file(file).cidVersion("v0");
        console.log("Lit Action Uploaded (Server-Side). CID:", upload.cid);
        return upload.cid;
    } catch (error) {
        console.error("Failed to upload Lit Action:", error);
        throw new Error("Failed to upload Lit Action to IPFS");
    }
}
