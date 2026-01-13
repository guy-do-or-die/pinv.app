
import { useState, useCallback, useRef } from 'react';
import { usePublicClient } from 'wagmi';
import { Pin } from '@/types';
import { pinVConfig, pinVStoreAbi } from './contracts';
import { fetchFromIpfs } from '@/lib/ipfs';
import { zeroAddress } from 'viem';

export function usePins() {
    const publicClient = usePublicClient();
    const [pins, setPins] = useState<Pin[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    // Keep track of the last processed ID for pagination
    const [lastId, setLastId] = useState<number | null>(null);

    // Use ref to track loading state synchronously to prevent race conditions
    const isFetchingRef = useRef(false);

    const loadMore = useCallback(async (limit = 9) => {
        if (!publicClient || isFetchingRef.current || !hasMore) return;

        isFetchingRef.current = true;
        setIsLoading(true);
        setError(null);

        try {
            const address = pinVConfig.address[publicClient.chain.id as keyof typeof pinVConfig.address];

            let startId: number;

            if (lastId === null) {
                const nextTokenId = await publicClient.readContract({
                    address,
                    abi: pinVConfig.abi,
                    functionName: 'nextTokenId',
                });
                startId = Number(nextTokenId) - 1;
            } else {
                startId = lastId - 1;
            }

            if (startId < 1) {
                setHasMore(false);
                setIsLoading(false);
                isFetchingRef.current = false;
                return;
            }



            const endId = Math.max(1, startId - limit + 1);
            console.log(`[usePins] Fetching range: ${startId} -> ${endId} (Limit: ${limit})`);

            const ids: number[] = [];
            for (let i = startId; i >= endId; i--) ids.push(i);

            // 1. Batch Fetch Stores (Parallel)
            const storeCalls = ids.map(id => ({
                address,
                abi: pinVConfig.abi,
                functionName: 'pinStores',
                args: [BigInt(id)]
            }));
            const storeResults = await publicClient.multicall({ contracts: storeCalls });

            const validStores = storeResults
                .map((res, i) => ({ id: ids[i], address: res.result as `0x${string}` }))
                .filter(s => s.address && s.address !== zeroAddress);

            console.log(`[usePins] Found ${validStores.length} valid stores out of ${ids.length} IDs checked.`);

            if (validStores.length === 0) {
                // Optimization: If empty batch, we update cursor but don't error.
                // The effect will trigger next batch automatically.
                console.log('[usePins] Batch empty, skipping metadata fetch.');
                setLastId(endId);
                if (endId <= 1) setHasMore(false);
                return;
            }

            // 2. Batch Fetch Metadata (Parallel)
            // Flatten calls: [Title1, Tag1, Ver1, Creator1, Title2, Tag2, Ver2, Creator2, ...]
            const metaCalls = validStores.flatMap(s => [
                { address: s.address, abi: pinVStoreAbi, functionName: 'title' },
                { address: s.address, abi: pinVStoreAbi, functionName: 'tagline' },
                { address: s.address, abi: pinVStoreAbi, functionName: 'latestVersion' },
                { address: s.address, abi: pinVStoreAbi, functionName: 'creator' }
            ]);

            const metaResults = await publicClient.multicall({ contracts: metaCalls });

            // 3. Process & Fetch IPFS (Concurrent)
            const newPins = (await Promise.all(validStores.map(async (store, i) => {
                const baseIdx = i * 4;
                const title = metaResults[baseIdx].result as string;
                const tagline = metaResults[baseIdx + 1].result as string;
                const latestVer = metaResults[baseIdx + 2].result as bigint;
                const creator = metaResults[baseIdx + 3].result as string;

                // console.log(`[usePins] Pin ${store.id}: ${title} (v${latestVer})`);

                let widgetData = {};
                if (latestVer > BigInt(0)) {
                    try {
                        // Optimally, we could batch fetch versions too, but keeping it simple for now as version is dependent on latestVer
                        const ipfsId = await publicClient.readContract({
                            address: store.address,
                            abi: pinVStoreAbi,
                            functionName: 'versions',
                            args: [latestVer]
                        });

                        if (ipfsId) {
                            widgetData = await fetchFromIpfs(ipfsId as string);
                        }
                    } catch (e) {
                        console.warn('Failed to fetch IPFS for pin', store.id);
                    }
                }

                return {
                    id: String(store.id),
                    title,
                    tagline,
                    creator,
                    lastUpdated: new Date().toISOString(),
                    version: latestVer.toString(),
                    widget: widgetData as any
                };
            }))).filter(Boolean) as Pin[];

            console.log(`[usePins] Hydrated ${newPins.length} pins.`);

            setPins(prev => {
                // Deduplicate pins just in case
                const existingIds = new Set(prev.map(p => p.id));
                const uniqueNewPins = newPins.filter(p => !existingIds.has(p.id));
                return [...prev, ...uniqueNewPins];
            });
            setLastId(endId);

            if (endId <= 1) {
                setHasMore(false);
            }

        } catch (err) {
            console.error('Error fetching pins:', err);
            setError(err instanceof Error ? err : new Error('Unknown error'));
            setHasMore(false); // Stop on error for safety
        } finally {
            setIsLoading(false);
            isFetchingRef.current = false;
        }
    }, [publicClient, hasMore, lastId]);

    return { pins, isLoading, hasMore, error, loadMore };
}
