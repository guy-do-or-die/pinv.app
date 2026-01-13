
"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"

export function ModeToggle() {
    const { setTheme, theme } = useTheme()

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            className="rounded-full hover:bg-transparent group relative"
            title="Toggle theme"
        >
            <Sun className="h-4 w-4 text-foreground rotate-90 scale-0 transition-all duration-500 dark:rotate-0 dark:scale-100 group-hover:text-yellow-600" />
            <Moon className="absolute h-4 w-4 text-foreground rotate-0 scale-100 transition-all duration-500 dark:-rotate-90 dark:scale-0 group-hover:text-blue-600" />

            <span className="sr-only">Toggle theme</span>
        </Button>
    )
}