// src/components/ThermalReport.tsx
import ReactMarkdown from "react-markdown";
import { Download, FileText } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ThermalReportProps {
  finalReport?: string;
}

export function ThermalReport({ finalReport }: ThermalReportProps) {
  const downloadPDF = () => {
    if (!finalReport) return;

    // Create a blob with the markdown content
    const blob = new Blob([finalReport], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);

    // Create download link
    const a = document.createElement("a");
    a.href = url;
    a.download = `thermal-analysis-report-${new Date().toISOString().split("T")[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Energy Efficiency Report
            </CardTitle>
            <CardDescription>
              Comprehensive analysis report with recommendations
            </CardDescription>
          </div>
          {finalReport && (
            <Button variant="outline" onClick={downloadPDF}>
              <Download className="h-4 w-4 mr-2" />
              Download Report
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {finalReport ? (
          <div className="prose prose-sm max-w-none">
            <ReactMarkdown>{finalReport}</ReactMarkdown>
          </div>
        ) : (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Report will be generated after analysis is complete.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
