"use client";

import PinParams from "@/components/shared/PinParams";

interface EditorConfigProps {
    parameters: any[];
    values: Record<string, any>;
    onChange: (values: Record<string, any>) => void;
    onParametersChange: (params: any[]) => void;
}

export function EditorConfig({
    parameters,
    values,
    onChange,
    onParametersChange
}: EditorConfigProps) {
    return (
        <div className="space-y-4 p-2">
            <PinParams
                parameters={parameters}
                values={values}
                onChange={onChange}
                onParametersChange={onParametersChange}
            />
        </div>
    );
}
