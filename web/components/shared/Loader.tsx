import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const loaderVariants = cva(
    "flex items-center justify-center w-full",
    {
        variants: {
            variant: {
                default: "min-h-[300px]",
                page: "min-h-[50vh] flex-col gap-4",
                thumbnail: "absolute inset-0 min-h-0 bg-background/60 backdrop-blur-sm z-10",
                tiny: "h-auto w-auto inline-flex",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
);

const iconVariants = cva(
    "text-muted-foreground animate-pulse",
    {
        variants: {
            variant: {
                default: "w-12 h-12 md:w-16 md:h-16",
                page: "w-24 h-24 md:w-32 md:h-32 opacity-80",
                thumbnail: "w-24 h-24 md:w-32 md:h-32",
                tiny: "w-4 h-4",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
);

interface LoaderProps extends VariantProps<typeof loaderVariants> {
    className?: string;
    iconClassName?: string;
}

export function Loader({ className, iconClassName, variant }: LoaderProps) {
    return (
        <div className={cn(loaderVariants({ variant, className }))}>
            <img
                src="/icon_loading.svg"
                alt="Loading..."
                className={cn(iconVariants({ variant }), iconClassName)}
            />
        </div>
    );
}
