import Header from "@/components/layout/Header";
import PinGrid from "@/components/features/grid/PinGrid";
import Hero from "@/components/layout/Hero";

export default async function Home() {
  const initialPins: any[] = [];

  return (
    <div className="min-h-screen font-sans selection:bg-primary/20 bg-background pattern-grid">
      <Header autoHide />
      <div className="app-container">

        <main className="mt-8 md:mt-12 space-y-16">
          {/* Logo & Hero / CTA */}
          <div className="flex flex-col items-center justify-center pt-8 md:pt-16 space-y-4">
            <img src="/logo.svg" alt="PinV Logo" className="w-40 h-40 md:w-72 md:h-72" />
            <Hero />
          </div>

          {/* Grid of Pins (Client Component) */}
          <PinGrid initialPins={initialPins} />
        </main >
      </div >
    </div >
  );
}
