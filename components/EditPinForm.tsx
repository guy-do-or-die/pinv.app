'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { useAccount } from "wagmi";
import { Pin } from "@/types";

interface EditPinFormProps {
    fid: number;
    pin: Pin;
}

export default function EditPinForm({ fid, pin }: EditPinFormProps) {
    const router = useRouter();
    const { isConnected } = useAccount();

    const [prompt, setPrompt] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [hasGenerated, setHasGenerated] = useState(false);

    // Mock AI Generation
    const handleUpdate = async () => {
        if (!prompt) return;
        setIsGenerating(true);
        // Simulate delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        setIsGenerating(false);
        setHasGenerated(true);
    };

    const handleSave = () => {
        // In a real app, this would save to IPFS/Chain
        alert("Pin updated!");
        router.push(`/p/${fid}`);
    };

    if (!pin) return <div className="p-8">Pin not found</div>;

    return (
        <div className="min-h-screen bg-background p-8">
            <div className="max-w-2xl mx-auto space-y-8">
                <Header />

                <Card>
                    <CardHeader>
                        <CardTitle>Edit Your Pin</CardTitle>
                        <CardDescription>Describe how you want your Pin content to look. AI will generate the widgets for you.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Textarea
                            placeholder="e.g. Show my 3 most popular repos and a 'Hire Me' button..."
                            className="min-h-[200px] text-lg p-4"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            disabled={isGenerating || hasGenerated || !isConnected}
                        />

                        {!isConnected && <div className="text-red-500 text-sm">Please connect your wallet to edit.</div>}
                    </CardContent>
                    <CardFooter className="flex justify-end gap-4">
                        <Button variant="outline" onClick={() => router.back()}>Cancel</Button>

                        {!hasGenerated ? (
                            <Button
                                onClick={handleUpdate}
                                disabled={!prompt || isGenerating || !isConnected}
                                className="w-32"
                            >
                                {isGenerating ? "Generating..." : "Update"}
                            </Button>
                        ) : (
                            <Button onClick={handleSave} className="w-32 bg-green-600 hover:bg-green-700">
                                Save & Publish
                            </Button>
                        )}
                    </CardFooter>
                </Card>

                {hasGenerated && (
                    <div className="p-4 bg-muted rounded-lg text-center text-sm text-muted-foreground animate-in fade-in slide-in-from-bottom-4">
                        Preview updated! (Mock) Click Save to apply changes.
                    </div>
                )}
            </div>
        </div>
    );
}
