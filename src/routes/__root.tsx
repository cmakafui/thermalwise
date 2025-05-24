// src/routes/__root.tsx
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { Header } from "@/components/layout/Header";
import { NotFound } from "@/components/NotFound";

export const Route = createRootRoute({
  component: () => (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-6">
          <Outlet />
        </div>
      </main>
      {process.env.NODE_ENV === "development" && <TanStackRouterDevtools />}
    </div>
  ),
  notFoundComponent: () => <NotFound />,
});
