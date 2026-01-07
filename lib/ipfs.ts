
const DEFAULT_PIN_GATEWAY = 'https://gateway.pinata.cloud/ipfs/';

export async function fetchFromIpfs(cid: string): Promise<any> {
    if (!cid) return {};

    const gateway = process.env.NEXT_PUBLIC_IPFS_GATEWAY || DEFAULT_PIN_GATEWAY;

    try {
        const res = await fetch(`${gateway}${cid}`);
        if (!res.ok) {
            throw new Error(`IPFS Fetch Failed: ${res.status} ${res.statusText}`);
        }
        return await res.json();
    } catch (e) {
        console.error(`Failed to fetch IPFS CID ${cid} from ${gateway}:`, e);
        throw e;
    }
}
