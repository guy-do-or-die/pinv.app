import Header from "@/components/layout/Header";
import Hero from "@/components/layout/Hero";
import { Loader } from "@/components/shared/Loader";

export default function Loading() {
    return (
        <div className="min-h-screen font-sans selection:bg-primary/20 bg-background pattern-grid">
            <Header autoHide />
            <div className="app-container pt-32">
                <main className="mt-8 md:mt-12 space-y-16">
                    <div className="flex flex-col items-center justify-center pt-8 md:pt-16 space-y-4">
                        <img src="/logo.svg" alt="PinV Logo" className="w-40 h-40 md:w-72 md:h-72" />
                        <Hero isLoading />
                    </div>

                    <Loader variant="page" className="min-h-[400px]" />
                </main >
            </div >
        </div >
    );
}
