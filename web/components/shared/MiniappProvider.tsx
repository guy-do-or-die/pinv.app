'use client';

import { sdk } from '@farcaster/miniapp-sdk';
import { useEffect } from 'react';

export default function MiniappProvider({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        const init = async () => {
            console.log('MiniappProvider: calling sdk.actions.ready()');
            try {
                await sdk.actions.ready();
                console.log('MiniappProvider: sdk.actions.ready() called successfully');
            } catch (err) {
                console.error('MiniappProvider: failed to call sdk.actions.ready()', err);
            }
        };
        init();
    }, []);

    return <>{children}</>;
}
