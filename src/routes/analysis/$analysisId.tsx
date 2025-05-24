// src/routes/analysis/$analysisId.tsx
import { createFileRoute } from "@tanstack/react-router";
import { ThermalAnalysisPage } from "@/components/ThermalAnalysisPage";

export const Route = createFileRoute("/analysis/$analysisId")({
  component: () => <ThermalAnalysisPage />,
});
