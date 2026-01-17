import { getPinataUploadUrl } from "@/app/actions/pinata";

/**
 * Uploads data to IPFS via a Signed URL (Client-Side).
 * This replaces the server-side proxy to avoid Vercel timeouts on large files.
 * Returns the CID provided by Pinata (usually CIDv1).
 */
export async function uploadToIpfs(data: any, filename = 'file.json'): Promise<string> {
    try {
        // 1. Get Signed Upload URL
        const { url: uploadUrl } = await getPinataUploadUrl();

        // 2. Prepare content
        let blob: Blob;

        if (data instanceof Blob) {
            blob = data;
        } else if (typeof data === 'string') {
            blob = new Blob([data], { type: 'text/plain' });
        } else {
            const jsonString = JSON.stringify(data);
            blob = new Blob([jsonString], { type: 'application/json' });
        }

        const file = new File([blob], filename, { type: blob.type });
        const formData = new FormData();

        // Metadata for Pinata Explorer
        const pinataMetadata = JSON.stringify({
            name: filename
        });
        formData.append('pinataMetadata', pinataMetadata);

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
        console.log("Pinata Upload Response:", uploadData);

        const pinataCid = uploadData?.IpfsHash || uploadData?.data?.cid;
        console.log(`Pinata Returned CID: ${pinataCid}`);

        if (!pinataCid) throw new Error("No CID returned from upload");

        return pinataCid;

    } catch (error) {
        console.error('Error uploading to IPFS:', error);
        throw error;
    }
}
