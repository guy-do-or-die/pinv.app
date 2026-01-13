'use client';

import { ReactNode } from 'react';

import WalletProvider from '../features/wallet';
import MiniappProvider from './MiniappProvider';
import ThemeProvider from './ThemeProvider';


export default function Providers({ children }: { children: ReactNode; }) {
    return (
        <WalletProvider>
            <MiniappProvider>
                <ThemeProvider>
                    {children}
                </ThemeProvider>
            </MiniappProvider>
        </WalletProvider>
    );
}
