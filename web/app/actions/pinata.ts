"use server";

import { PinataSDK } from "pinata";

const pinata = new PinataSDK({
    pinataJwt: process.env.PINATA_JWT!,
    pinataGateway: process.env.NEXT_PUBLIC_IPFS_GATEWAY,
});

export async function getPinataUploadUrl() {
    try {
        const url = await pinata.upload.public.createSignedURL({
            expires: 120, // 2 minutes
            maxFileSize: 10 * 1024 * 1024, // 10MB
        });

        return { url };
    } catch (error: any) {
        console.error("Pinata Token Error:", error);
        throw new Error("Failed to generate upload token: " + error.message);
    }
}
