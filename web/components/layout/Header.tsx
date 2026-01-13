'use client';

import { useConnect } from 'wagmi';

import Link from "next/link";

import { useAccount } from '@/components/features/wallet';
import { Connection } from '@/components/features/wallet/Connection';
import { Button } from "@/components/ui/button";
import { ModeToggle } from "./ModeToggle";

import { useState, useEffect } from 'react';

interface HeaderProps {
    autoHide?: boolean;
}

export default function Header({ autoHide = false }: HeaderProps) {
    const { loggedIn, address } = useAccount();
    const { connect, connectors } = useConnect();
    const [isVisible, setIsVisible] = useState(!autoHide);

    useEffect(() => {
        if (!autoHide) {
            setIsVisible(true);
            return;
        }

        const handleScroll = () => {
            const threshold = window.innerWidth > 768 ? 500 : 300;
            setIsVisible(window.scrollY > threshold);
        };

        handleScroll();
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [autoHide]);

    return (
        <header className={`fixed top-0 z-50 w-full mb-4 md:mb-8 bg-background/80 backdrop-blur-md border-b border-border transition-transform duration-300 ${isVisible ? 'translate-y-0' : '-translate-y-full'}`}>
            <div className="app-container h-16 flex justify-between items-center px-4 md:px-6 lg:px-8 mx-auto max-w-[1600px]">
                {/* Left: Brand - Geometric & Sharp */}
                <Link href="/" className="flex items-center gap-2 cursor-pointer group">
                    <img src="/icon.svg" alt="PinV Logo" className="w-10 h-10 dark:brightness-125 transition-all" />
                    <span className="text-xl md:text-2xl font-bold font-orbitron tracking-widest group-hover:text-primary transition-colors">
                        PinV<span className="text-muted-foreground" title="WIP">ᵅ</span>
                    </span>
                </Link>

                {/* Right: Controls */}
                <div className="flex justify-end items-center gap-2 mr-2">
                    <ModeToggle />
                    <Connection />
                </div>
            </div>
        </header>
    );
}
