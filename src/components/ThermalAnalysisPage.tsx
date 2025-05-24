// src/components/ThermalAnalysisPage.tsx
import { useParams, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useThermalAnalysis } from "@/hooks/useThermalAnalysis";
import ReactMarkdown from "react-markdown";
import {
  ArrowLeft,
  RefreshCw,
  Share2,
  Copy,
  Bookmark,
  Thermometer,
  Building,
  Zap,
  StopCircle,
  CheckCircle,
  AlertCircle,
  FileText,
  Eye,
  Download,
  TrendingUp,
  Euro,
  Calendar,
  MapPin,
  Wifi,
  WifiOff,
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";

const fadeInAnimation = "animate-in fade-in-50 duration-500";
const slideUpAnimation = "animate-in slide-in-from-bottom-5 duration-500";

// Energy rating colors
const ratingColors = {
  A: "bg-green-600 text-white",
  B: "bg-green-500 text-white",
  C: "bg-yellow-500 text-white",
  D: "bg-orange-500 text-white",
  E: "bg-orange-600 text-white",
  F: "bg-red-500 text-white",
  G: "bg-red-600 text-white",
};

const severityColors = {
  minor: "bg-green-100 text-green-800 border-green-200",
  moderate: "bg-yellow-100 text-yellow-800 border-yellow-200",
  severe: "bg-red-100 text-red-800 border-red-200",
};

// Add type for anomaly
interface Anomaly {
  id: string;
  location: string;
  description: string;
  severity: "minor" | "moderate" | "severe";
  confidence: number;
  temperatureDifferential: string;
  probableCause: string;
  estimatedEnergyLoss: string;
  repairCost: string;
  repairPriority: string;
  coordinates: number[];
}

export function ThermalAnalysisPage() {
  const { analysisId } = useParams({ from: "/analysis/$analysisId" as const });
  const navigate = useNavigate();

  const {
    buildingInfo,
    imagePairs,
    analysisState,
    isAnalyzing,
    isConnected,
    error,
    isInitialized,
    startAnalysis,
    stopAnalysis,
    getDetectedAnomalies,
    refreshData,
  } = useThermalAnalysis(analysisId);

  const [copied, setCopied] = useState(false);
  const [detectedAnomalies, setDetectedAnomalies] = useState<Anomaly[]>([]);

  // Copy URL to clipboard
  const copyToClipboard = () => {
    if (navigator.clipboard && window.location.href) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Handle starting analysis
  const handleStartAnalysis = async () => {
    try {
      await startAnalysis();
    } catch (err) {
      console.error("Failed to start analysis:", err);
    }
  };

  // Handle refresh
  const handleRefresh = async () => {
    try {
      await refreshData();
    } catch (err) {
      console.error("Failed to refresh data:", err);
    }
  };

  // Load anomalies when analysis completes
  useEffect(() => {
    if (analysisState?.status === "completed") {
      getDetectedAnomalies().then(setDetectedAnomalies).catch(console.error);
    }
  }, [analysisState?.status, getDetectedAnomalies]);

  // Show loading state while connecting or initializing
  if (!isConnected || (isConnected && !isInitialized && !error)) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Link
            to="/upload"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Upload
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              {!isConnected
                ? "Connecting to Analysis Engine..."
                : "Initializing Analysis..."}
            </CardTitle>
            <CardDescription>
              {!isConnected
                ? "Establishing secure connection to thermal analysis service"
                : "Loading analysis data and preparing interface"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center py-8">
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  {!isConnected ? (
                    <WifiOff className="h-8 w-8 text-muted-foreground" />
                  ) : (
                    <Wifi className="h-8 w-8 text-primary animate-pulse" />
                  )}
                </div>
                <div>
                  <p className="font-medium">
                    {!isConnected ? "Connecting..." : "Initializing..."}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    This may take a few moments
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show error state if not initialized and has error
  if (!isInitialized && error) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Link
            to="/upload"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Upload
          </Link>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Analysis Not Found</AlertTitle>
          <AlertDescription>
            {error.message ||
              "This analysis session was not found or has expired. Please start a new analysis."}
          </AlertDescription>
        </Alert>

        <div className="flex gap-4">
          <Button
            onClick={() => navigate({ to: "/upload" })}
            className="flex-1"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Upload
          </Button>
          <Button variant="outline" onClick={handleRefresh} className="flex-1">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`max-w-7xl mx-auto space-y-6 ${fadeInAnimation}`}>
      {/* Breadcrumb Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/upload"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Upload
        </Link>

        <div className="flex items-center gap-2">
          {/* Connection Status */}
          <div className="flex items-center gap-1 text-xs">
            {isConnected ? (
              <>
                <Wifi className="h-3 w-3 text-green-500" />
                <span className="text-green-600">Connected</span>
              </>
            ) : (
              <>
                <WifiOff className="h-3 w-3 text-red-500" />
                <span className="text-red-600">Disconnected</span>
              </>
            )}
          </div>

          <Button variant="ghost" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Share2 className="h-4 w-4" />
                <span className="sr-only">Share</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={copyToClipboard}>
                <Copy className="h-4 w-4 mr-2" />
                {copied ? "Copied!" : "Copy link"}
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Bookmark className="h-4 w-4 mr-2" />
                Bookmark
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Error States */}
      {error && (
        <Alert variant="destructive">
          <AlertTitle className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Analysis Error
          </AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      )}

      {/* Connection Warning */}
      {!isConnected && (
        <Alert variant="destructive">
          <WifiOff className="h-4 w-4" />
          <AlertTitle>Connection Lost</AlertTitle>
          <AlertDescription>
            The connection to the analysis engine was lost. Some features may
            not work properly.
            <Button
              variant="outline"
              size="sm"
              className="ml-2"
              onClick={handleRefresh}
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Reconnect
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Header Card */}
      <Card className={`border shadow-sm ${slideUpAnimation} delay-100`}>
        <CardHeader className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Badge
                  variant="outline"
                  className="px-2.5 py-0.5 text-xs font-normal bg-primary/5 border-primary/20 text-primary"
                >
                  <Thermometer className="h-3 w-3 mr-1" />
                  Thermal Analysis
                </Badge>
                {analysisState?.energyRating && (
                  <Badge
                    className={`px-3 py-1 text-sm font-bold ${ratingColors[analysisState.energyRating]}`}
                  >
                    Rating: {analysisState.energyRating}
                  </Badge>
                )}
              </div>

              <CardTitle className="text-2xl font-semibold">
                {buildingInfo?.buildingName || "Thermal Analysis"}
              </CardTitle>

              <CardDescription className="space-y-1">
                {buildingInfo && (
                  <>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1">
                        <Building className="h-3 w-3" />
                        {buildingInfo.buildingType}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Built {buildingInfo.constructionYear}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {buildingInfo.location}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Inspector: {buildingInfo.inspector} •{" "}
                      {buildingInfo.inspectionDate} • Outside temp:{" "}
                      {buildingInfo.outsideTemp}°C
                    </div>
                  </>
                )}
              </CardDescription>
            </div>

            {/* Analysis Status */}
            <div className="text-right">
              {analysisState?.status === "completed" && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  Analysis Complete
                </div>
              )}
              {analysisState?.status === "analyzing" && (
                <div className="flex items-center gap-2 text-sm text-blue-600">
                  <Zap className="h-4 w-4 animate-spin" />
                  Analyzing...
                </div>
              )}
              {analysisState?.status === "error" && (
                <div className="flex items-center gap-2 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  Analysis Failed
                </div>
              )}
              {analysisState?.status === "stopped" && (
                <div className="flex items-center gap-2 text-sm text-orange-600">
                  <StopCircle className="h-4 w-4" />
                  Analysis Stopped
                </div>
              )}
            </div>
          </div>

          {/* Image Pairs Summary */}
          {imagePairs.length > 0 && (
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {imagePairs.length} image pairs
              </span>
              {detectedAnomalies.length > 0 && (
                <span className="flex items-center gap-1">
                  <Thermometer className="h-3 w-3" />
                  {detectedAnomalies.length} anomalies detected
                </span>
              )}
            </div>
          )}
        </CardHeader>
      </Card>

      {/* Main Content */}
      <Tabs defaultValue="analysis" className={`${slideUpAnimation} delay-200`}>
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="analysis" className="flex items-center gap-1.5">
              <Zap className="h-4 w-4" />
              Analysis
            </TabsTrigger>
            <TabsTrigger
              value="anomalies"
              className="flex items-center gap-1.5"
            >
              <Thermometer className="h-4 w-4" />
              Anomalies ({detectedAnomalies.length})
            </TabsTrigger>
            <TabsTrigger value="report" className="flex items-center gap-1.5">
              <FileText className="h-4 w-4" />
              Report
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Analysis Tab */}
        <TabsContent value="analysis" className="mt-0">
          <Card className="border">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Zap className="h-5 w-5 text-primary" />
                    Thermal Image Analysis
                  </CardTitle>
                  <CardDescription>
                    AI-powered analysis of {imagePairs.length} thermal image
                    pairs
                  </CardDescription>
                </div>

                {/* Action Buttons */}
                {analysisState?.status === "idle" && (
                  <Button
                    onClick={handleStartAnalysis}
                    className="h-9"
                    disabled={!isConnected}
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Start Analysis
                  </Button>
                )}

                {analysisState?.status === "completed" && (
                  <Button
                    variant="outline"
                    onClick={handleStartAnalysis}
                    className="h-9"
                    disabled={!isConnected}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Re-analyze
                  </Button>
                )}

                {isAnalyzing && (
                  <Button
                    variant="destructive"
                    onClick={stopAnalysis}
                    className="h-9"
                    disabled={!isConnected}
                  >
                    <StopCircle className="h-4 w-4 mr-2" />
                    Stop Analysis
                  </Button>
                )}
              </div>
            </CardHeader>
            <Separator />

            <CardContent className="pt-6">
              {/* Analysis Progress */}
              {isAnalyzing && analysisState && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium flex items-center gap-2">
                      <Zap className="h-5 w-5 text-primary animate-spin" />
                      Analyzing Thermal Images
                    </h3>
                    {analysisState.currentImagePair &&
                      analysisState.totalImagePairs && (
                        <div className="text-sm text-muted-foreground">
                          Processing {analysisState.currentImagePair} of{" "}
                          {analysisState.totalImagePairs} pairs
                        </div>
                      )}
                  </div>

                  <div className="w-full">
                    <div className="flex justify-between items-center mb-2 text-sm">
                      <span>Analysis Progress</span>
                      <span className="font-medium">
                        {analysisState.progress}%
                      </span>
                    </div>
                    <Progress value={analysisState.progress} className="h-2" />
                  </div>

                  {/* Live Analysis Log */}
                  {analysisState.analysisLog.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Analysis Log</h4>
                      <div className="bg-muted rounded-md p-3 text-xs font-mono h-[200px] overflow-auto">
                        {analysisState.analysisLog
                          .slice()
                          .reverse()
                          .map((log, index) => (
                            <div key={index} className="pb-1">
                              {log}
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Completed Analysis */}
              {analysisState?.status === "completed" && (
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <CheckCircle className="h-8 w-8 text-green-500" />
                    <div>
                      <h3 className="text-lg font-medium">Analysis Complete</h3>
                      <p className="text-muted-foreground">
                        Found {detectedAnomalies.length} thermal anomalies
                        across {imagePairs.length} image pairs
                      </p>
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="p-4">
                      <div className="flex items-center gap-2">
                        <Thermometer className="h-4 w-4 text-primary" />
                        <div>
                          <div className="text-2xl font-bold">
                            {detectedAnomalies.length}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Anomalies
                          </div>
                        </div>
                      </div>
                    </Card>

                    <Card className="p-4">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-red-500" />
                        <div>
                          <div className="text-2xl font-bold">
                            {
                              detectedAnomalies.filter(
                                (a) => a.severity === "severe"
                              ).length
                            }
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Severe
                          </div>
                        </div>
                      </div>
                    </Card>

                    <Card className="p-4">
                      <div className="flex items-center gap-2">
                        <Euro className="h-4 w-4 text-primary" />
                        <div>
                          <div className="text-2xl font-bold">
                            {analysisState.energyRating || "D"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Energy Rating
                          </div>
                        </div>
                      </div>
                    </Card>

                    <Card className="p-4">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        <div>
                          <div className="text-2xl font-bold">
                            {Math.round(
                              (detectedAnomalies.reduce(
                                (sum, a) => sum + a.confidence,
                                0
                              ) /
                                Math.max(detectedAnomalies.length, 1)) *
                                100
                            )}
                            %
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Avg Confidence
                          </div>
                        </div>
                      </div>
                    </Card>
                  </div>
                </div>
              )}

              {/* Error State */}
              {analysisState?.status === "error" && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
                  <h3 className="text-lg font-medium mb-2">Analysis Failed</h3>
                  <p className="text-muted-foreground max-w-md mb-4">
                    There was an error analyzing your thermal images. Please try
                    again.
                  </p>
                  {analysisState.error && (
                    <Alert variant="destructive" className="mb-4 max-w-md">
                      <AlertDescription>{analysisState.error}</AlertDescription>
                    </Alert>
                  )}
                  <Button onClick={handleStartAnalysis} disabled={!isConnected}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                </div>
              )}

              {/* Stopped State */}
              {analysisState?.status === "stopped" && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <StopCircle className="h-12 w-12 text-orange-500 mb-4" />
                  <h3 className="text-lg font-medium mb-2">Analysis Stopped</h3>
                  <p className="text-muted-foreground max-w-md mb-4">
                    The analysis was stopped. You can resume or start a new
                    analysis.
                  </p>
                  <Button onClick={handleStartAnalysis} disabled={!isConnected}>
                    <Zap className="h-4 w-4 mr-2" />
                    Resume Analysis
                  </Button>
                </div>
              )}

              {/* Idle State */}
              {analysisState?.status === "idle" && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Zap className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Ready to Analyze</h3>
                  <p className="text-muted-foreground max-w-md mb-4">
                    Click the button above to start analyzing your{" "}
                    {imagePairs.length} thermal image pairs with AI.
                  </p>
                  {!isConnected && (
                    <p className="text-sm text-red-600 mb-4">
                      ⚠️ Connection required to start analysis
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Anomalies Tab */}
        <TabsContent value="anomalies" className="mt-0">
          <Card className="border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Thermometer className="h-5 w-5 text-primary" />
                Detected Anomalies
              </CardTitle>
              <CardDescription>
                Thermal anomalies identified in the analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              {detectedAnomalies.length > 0 ? (
                <div className="space-y-4">
                  {detectedAnomalies.map((anomaly) => (
                    <Card key={anomaly.id} className="border">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h4 className="font-medium">{anomaly.location}</h4>
                            <p className="text-sm text-muted-foreground">
                              {anomaly.description}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Badge className={severityColors[anomaly.severity]}>
                              {anomaly.severity.toUpperCase()}
                            </Badge>
                            <Badge variant="outline">
                              {Math.round(anomaly.confidence * 100)}% confidence
                            </Badge>
                          </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="space-y-2">
                              <div>
                                <strong>Temperature Differential:</strong>{" "}
                                {anomaly.temperatureDifferential}
                              </div>
                              <div>
                                <strong>Probable Cause:</strong>{" "}
                                {anomaly.probableCause}
                              </div>
                              <div>
                                <strong>Energy Loss:</strong>{" "}
                                {anomaly.estimatedEnergyLoss}
                              </div>
                            </div>
                          </div>
                          <div>
                            <div className="space-y-2">
                              <div>
                                <strong>Repair Cost:</strong>{" "}
                                {anomaly.repairCost}
                              </div>
                              <div>
                                <strong>Priority:</strong>{" "}
                                {anomaly.repairPriority.toUpperCase()}
                              </div>
                              <div>
                                <strong>Coordinates:</strong> [
                                {anomaly.coordinates
                                  .map((c: number) => c.toFixed(2))
                                  .join(", ")}
                                ]
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Thermometer className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    No anomalies detected yet. Run analysis first.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Report Tab */}
        <TabsContent value="report" className="mt-0">
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
                {analysisState?.finalReport && (
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {analysisState?.finalReport ? (
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown>{analysisState.finalReport}</ReactMarkdown>
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
