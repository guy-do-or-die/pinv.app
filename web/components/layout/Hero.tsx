import Link from "next/link";
import { Zap, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import MintButton from "@/components/features/mint/MintButton";
import { cn } from "@/lib/utils";

interface HeroProps {
    isLoading?: boolean;
}

export default function Hero({ isLoading = false }: HeroProps) {
    return (
        <div className="flex flex-col items-center justify-center text-center space-y-8 py-6 md:py-12 relative px-4 md:px-0">
            <h1 className="text-3xl sm:text-5xl md:text-8xl font-black tracking-tight text-foreground uppercase drop-shadow-sm">
                Pinned Casts
                <span className="block text-primary">Dynamic View</span>
            </h1>

            <p className="text-lg md:text-2xl text-muted-foreground max-w-[700px] leading-relaxed font-sans font-medium">
                Earn from personalized live content{' '}
                <span className="whitespace-nowrap">
                    on{' '}
                    <Link
                        href="https://farcaster.xyz"
                        className="text-foreground hover:text-primary transition-colors underline decoration-primary/50 underline-offset-4"
                    >
                        Farcaster
                    </Link>{' '}
                    and{' '}
                    <Link
                        href="https://join.base.app"
                        className="text-foreground hover:text-primary transition-colors underline decoration-primary/50 underline-offset-4"
                    >
                        Base&nbsp;App
                    </Link>
                </span>
            </p>

            <div className={cn("flex flex-col sm:flex-row gap-6 w-full sm:w-auto pt-4", isLoading && "opacity-50 pointer-events-none")}>
                <MintButton disabled={isLoading} className="w-full sm:w-auto" />
                <Link href="https://docs.pintv.app" className="w-full sm:w-auto" target="_blank">
                    <Button variant="outline" className="w-full sm:w-auto" icon={Info} disabled={isLoading}>
                        How it works
                    </Button>
                </Link>
            </div>
        </div>
    );
}
