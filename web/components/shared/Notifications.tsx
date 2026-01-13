"use client"

import { ReactNode } from "react";
import { toast, Toaster, ToasterProps } from "sonner";

import { useTheme } from "next-themes"
import { AlertCircleIcon, CheckCircleIcon, Info, XCircleIcon } from "lucide-react";

import { Loader } from "@/components/ui/loader";


export function parseError(error: any) {
    const templates = [
        /(The total cost (.+?) exceeds the balance of the account)/,
        /(Execution reverted for an unknown reason)/,
        /(The contract function (.+?) reverted)/,
        /(User rejected the request)/,
        /following reason:\n(.*?)\n/s,
        /(RPC Error)/,
        /(RPC error)/,
        /(Invalid parameters were provided to the RPC method)/,
        /(max address transaction sponsorship count reached)/,
    ]

    let msg: string | undefined
    if (error) {
        console.log(error)
        msg = error.message

        console.log(msg)

        if (typeof msg === 'string') {
            templates.some((template) => {
                const matches = (msg as string).match(template)

                if (matches && matches[1]) {
                    msg = matches[1].trim()
                    return true
                }
            })
        }
    }

    return msg
}


export const notify = (
    message: string | ReactNode,
    type: 'success' | 'error' | 'warning' | 'info' | 'loading',
    options?: any
) => {
    toast[type](message, {
        className: "group border border-border bg-background text-foreground font-mono text-xs uppercase tracking-wider shadow-lg",
        descriptionClassName: "text-muted-foreground",
        duration: 5000,
        ...options,
    })
}

export const hide = (id: string | number) => {
    toast.dismiss(id)
}

export default function Notifications() {
    const { theme = "system" } = useTheme()

    return <Toaster
        theme={theme as ToasterProps['theme']}
        position="top-center"
        icons={
            {
                success: <CheckCircleIcon />,
                error: <XCircleIcon />,
                warning: <AlertCircleIcon />,
                info: <Info />,
                loading: <Loader />,
            }
        }
        toastOptions={{
            classNames: {
                toast: "group border-border bg-background text-foreground font-mono uppercase tracking-wider shadow-lg rounded-none",
                description: "text-muted-foreground",
                actionButton: "bg-primary text-primary-foreground",
                cancelButton: "bg-muted text-muted-foreground",
            }
        }}
        style={
            {
                "--normal-bg": "var(--background)",
                "--normal-text": "var(--foreground)",
                "--normal-border": "var(--border)",
                "--border-radius": "var(--radius)",
            } as React.CSSProperties
        }
    />
}