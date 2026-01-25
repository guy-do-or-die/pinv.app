"use client";

import PinParams from "@/components/shared/PinParams";

interface EditorConfigProps {
    encryptedParams?: any; // Pass through
    parameters: any[];
    values: Record<string, any>;
    onChange: (values: Record<string, any>) => void;
    onParametersChange: (params: any[]) => void;
}

export function EditorConfig({
    encryptedParams,
    parameters,
    values,
    onChange,
    onParametersChange,
    sessionKey // Add prop
}: EditorConfigProps & { sessionKey?: CryptoKey | null }) {
    return (
        <div className="space-y-4 p-2">
            <PinParams
                encryptedParams={encryptedParams}
                parameters={parameters}
                values={values}
                onChange={onChange}
                onParametersChange={onParametersChange}
                sessionKey={sessionKey}
                hideUnlockBanner={true}
            />
        </div>
    );
}
