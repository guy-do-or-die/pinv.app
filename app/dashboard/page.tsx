'use client';

import { MOCK_PINS } from "@/lib/mock-data";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Header from "@/components/Header";

export default function DashboardPage() {
    const pins = Object.values(MOCK_PINS);

    return (
        <div className="min-h-screen bg-background p-8">
            <div className="max-w-4xl mx-auto space-y-8">
                <Header />

                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold tracking-tight">Your Pins</h1>
                    <Button>Create New Pin</Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {pins.map((pin) => (
                        <Card key={pin.fid}>
                            <CardHeader>
                                <CardTitle>{pin.title}</CardTitle>
                                <CardDescription>@{pin.handle}</CardDescription>
                            </CardHeader>
                            <CardFooter className="flex justify-between">
                                <Button variant="outline" asChild>
                                    <Link href={`/p/${pin.fid}`}>View</Link>
                                </Button>
                                <span className="text-xs text-muted-foreground">
                                    Updated: {new Date(pin.lastUpdated).toLocaleDateString()}
                                </span>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}
