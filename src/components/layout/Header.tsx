// src/components/layout/Header.tsx
import { useState, useEffect } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { useTheme } from "@/components/providers/theme-provider";
import { Menu, Home, Sun, Moon, Laptop, Shield } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";

export function Header() {
  const router = useRouterState();
  const { theme, setTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const currentPath = router.location.pathname;

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isActive = (path: string) => currentPath === path;

  const navItems = [
    { path: "/", icon: <Home className="h-4 w-4" />, label: "Dashboard" },
  ];

  return (
    <header
      className={`sticky top-0 z-50 w-full backdrop-blur transition-all ${
        scrolled ? "bg-background/95 border-b shadow-sm" : "bg-background/50"
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo & Desktop Navigation */}
          <div className="flex items-center gap-6">
            <Link
              to="/"
              className="flex items-center gap-2 transition-opacity hover:opacity-90"
            >
              <div className="rounded-md bg-gradient-to-br from-primary to-primary/80 p-1.5 text-primary-foreground">
                <Shield className="h-5 w-5" />
              </div>
              <span className="font-semibold text-lg hidden md:inline-block">
                ThermalWise
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`
                    relative flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors
                    ${
                      isActive(item.path)
                        ? "text-primary after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary"
                        : "text-foreground/70 hover:text-foreground hover:bg-accent"
                    }
                  `}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>
          </div>

          {/* Mobile Navigation Button */}
          <div className="flex md:hidden">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="flex flex-col">
                <SheetHeader className="text-left pb-4">
                  <SheetTitle className="flex items-center gap-2">
                    <div className="rounded-md bg-gradient-to-br from-primary to-primary/80 p-1.5 text-primary-foreground">
                      <Shield className="h-5 w-5" />
                    </div>
                    <span>ThermalWise</span>
                  </SheetTitle>
                </SheetHeader>
                <Separator />

                <nav className="flex flex-col gap-1 my-4 flex-1">
                  {navItems.map((item) => (
                    <SheetClose asChild key={item.path}>
                      <Link
                        to={item.path}
                        className={`
                          flex items-center gap-3 px-4 py-3 rounded-md
                          ${
                            isActive(item.path)
                              ? "bg-primary/10 text-primary font-medium"
                              : "hover:bg-accent text-foreground/80 hover:text-foreground"
                          }
                        `}
                        onClick={() => setMobileOpen(false)}
                      >
                        {item.icon}
                        <span>{item.label}</span>
                      </Link>
                    </SheetClose>
                  ))}
                </nav>

                <Separator />
                <SheetFooter className="flex flex-row items-center justify-between mt-4">
                  <div className="text-xs text-muted-foreground">
                    <span>© 2025 ThermalWise</span>
                  </div>

                  {/* Theme Toggle in Mobile Menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        {theme === "light" ? (
                          <Sun className="h-5 w-5" />
                        ) : theme === "dark" ? (
                          <Moon className="h-5 w-5" />
                        ) : (
                          <Laptop className="h-5 w-5" />
                        )}
                        <span className="sr-only">Toggle theme</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setTheme("light")}>
                        <Sun className="h-4 w-4 mr-2" />
                        Light
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setTheme("dark")}>
                        <Moon className="h-4 w-4 mr-2" />
                        Dark
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setTheme("system")}>
                        <Laptop className="h-4 w-4 mr-2" />
                        System
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="hidden md:flex">
                  {theme === "light" ? (
                    <Sun className="h-5 w-5" />
                  ) : theme === "dark" ? (
                    <Moon className="h-5 w-5" />
                  ) : (
                    <Laptop className="h-5 w-5" />
                  )}
                  <span className="sr-only">Toggle theme</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setTheme("light")}>
                  <Sun className="h-4 w-4 mr-2" />
                  Light
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")}>
                  <Moon className="h-4 w-4 mr-2" />
                  Dark
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("system")}>
                  <Laptop className="h-4 w-4 mr-2" />
                  System
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
