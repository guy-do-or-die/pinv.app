import { cn } from "@/lib/utils";

interface DataEnclaveProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    className?: string;
}

export function DataEnclave({ children, className, ...props }: DataEnclaveProps) {
    return (
        <div
            className={cn(
                "data-enclave bg-[hsl(var(--data-bg))] text-white p-4 relative overflow-auto font-mono text-sm",
                "shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]",
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}
