// src/components/layout/ModeToggle.tsx
import { useState, useEffect } from "react";
import { useTheme } from "@/components/providers/theme-provider";
import { Sun, Moon, Laptop } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function ModeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch by waiting until component is mounted
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="w-9 h-9">
        <span className="sr-only">Toggle theme</span>
      </Button>
    );
  }

  return (
    <div className="flex items-center">
      <DropdownMenu>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative w-9 h-9 rounded-full overflow-hidden"
                >
                  {/* Sun icon for light mode */}
                  <Sun
                    className={`h-[1.2rem] w-[1.2rem] transition-all absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                      ${
                        theme === "light"
                          ? "text-amber-500 scale-100 rotate-0 opacity-100"
                          : "scale-0 rotate-90 opacity-0"
                      }`}
                  />

                  {/* Moon icon for dark mode */}
                  <Moon
                    className={`h-[1.2rem] w-[1.2rem] transition-all absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                      ${
                        theme === "dark"
                          ? "text-blue-400 scale-100 rotate-0 opacity-100"
                          : "scale-0 -rotate-90 opacity-0"
                      }`}
                  />

                  {/* Laptop icon for system mode */}
                  <Laptop
                    className={`h-[1.2rem] w-[1.2rem] transition-all absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                      ${
                        theme === "system"
                          ? "scale-100 rotate-0 opacity-100"
                          : "scale-0 opacity-0"
                      }`}
                  />

                  <span className="sr-only">Toggle theme</span>
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Change theme</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <DropdownMenuContent
          align="end"
          className="animate-in zoom-in-90 duration-100"
        >
          <DropdownMenuItem
            onClick={() => setTheme("light")}
            className={`flex items-center gap-2 ${theme === "light" ? "bg-accent text-accent-foreground" : ""}`}
          >
            <Sun className="h-4 w-4 text-amber-500" />
            <span>Light</span>
            {theme === "light" && (
              <svg
                className="h-3.5 w-3.5 ml-auto"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            )}
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => setTheme("dark")}
            className={`flex items-center gap-2 ${theme === "dark" ? "bg-accent text-accent-foreground" : ""}`}
          >
            <Moon className="h-4 w-4 text-blue-400" />
            <span>Dark</span>
            {theme === "dark" && (
              <svg
                className="h-3.5 w-3.5 ml-auto"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            )}
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => setTheme("system")}
            className={`flex items-center gap-2 ${theme === "system" ? "bg-accent text-accent-foreground" : ""}`}
          >
            <Laptop className="h-4 w-4 text-muted-foreground" />
            <span>System</span>
            {theme === "system" && (
              <svg
                className="h-3.5 w-3.5 ml-auto"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            )}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
