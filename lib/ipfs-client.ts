import { getPinataUploadUrl } from "@/app/actions/pinata";

/**
 * Uploads data to IPFS via a Signed URL (Client-Side).
 * This replaces the server-side proxy to avoid Vercel timeouts on large files.
 */
export async function uploadToIpfs(data: any, filename = 'file.json'): Promise<string> {
    try {
        // 1. Get Signed Upload URL
        const { url: uploadUrl } = await getPinataUploadUrl();

        // 2. Prepare content
        let blob: Blob;
        if (typeof data === 'string') {
            blob = new Blob([data], { type: 'text/plain' });
        } else {
            blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
        }

        const file = new File([blob], filename, { type: blob.type });
        const formData = new FormData();
        formData.append("file", file);

        // 3. Upload directly to Pinata
        const uploadRes = await fetch(uploadUrl, {
            method: 'POST',
            body: formData,
        });

        if (!uploadRes.ok) {
            throw new Error(`Upload failed: ${uploadRes.statusText}`);
        }

        const uploadData = await uploadRes.json();
        const cid = uploadData?.data?.cid || uploadData?.IpfsHash;

        if (!cid) throw new Error("No CID returned from upload");

        return cid;

    } catch (error) {
        console.error('Error uploading to IPFS:', error);
        throw error;
    }
}
