// src/components/ApprovalModal.tsx - Enhanced with image display
import { useState } from "react";
import {
  Check,
  X,
  Loader2,
  Clock,
  User,
  Eye,
  Thermometer,
  AlertTriangle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ApprovalContext {
  imagePairCount?: number;
  buildingName?: string;
  estimatedCost?: string | number;
  severeCount?: number;
  totalAnomalies?: number;
  imagesAnalyzed?: number;
  imagesRemaining?: number;
  // Enhanced with image data
  associatedImages?: Array<{
    label?: string;
    rgbUrl?: string;
    thermalUrl?: string;
  }>;
  criticalAnomalies?: Array<{
    location: string;
    description: string;
    severity: string;
    confidence: number;
    temperatureDifferential?: string;
    probableCause?: string;
    estimatedEnergyLoss?: string;
    repairCost?: string;
    repairPriority?: string;
  }>;
  anomalyCount?: number;
  reportType?: string;
}

interface ApprovalDecision {
  approvalId: string;
  approved: boolean;
  reason?: string;
}

interface Approval {
  id: string;
  type: string;
  title: string;
  description: string;
  context: ApprovalContext;
  timestamp: number;
}

interface ApprovalModalProps {
  approval: Approval;
  isOpen: boolean;
  onClose: () => void;
  onDecision: (decision: ApprovalDecision) => void;
  isProcessing?: boolean;
}

export function ApprovalModal({
  approval,
  isOpen,
  onClose,
  onDecision,
  isProcessing,
}: ApprovalModalProps) {
  const [reason, setReason] = useState("");
  const [mode, setMode] = useState<"view" | "approve" | "deny">("view");

  const handleApprove = () => {
    onDecision({
      approvalId: approval.id,
      approved: true,
      reason: reason.trim() || undefined,
    });
    handleClose();
  };

  const handleDeny = () => {
    onDecision({
      approvalId: approval.id,
      approved: false,
      reason: reason.trim() || undefined,
    });
    handleClose();
  };

  const handleClose = () => {
    setMode("view");
    setReason("");
    onClose();
  };

  const hasImages =
    approval.context.associatedImages &&
    approval.context.associatedImages.length > 0;
  const hasCriticalAnomalies =
    approval.context.criticalAnomalies &&
    approval.context.criticalAnomalies.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <DialogTitle>
              {mode === "approve"
                ? "Approve Request"
                : mode === "deny"
                  ? "Deny Request"
                  : "Human Approval Required"}
            </DialogTitle>
          </div>
          <DialogDescription className="flex items-center gap-1 text-xs">
            <Clock className="h-3 w-3" />
            {new Date(approval.timestamp).toLocaleString()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Request details */}
          <div className="p-3 bg-muted rounded-lg">
            <h4 className="font-medium text-sm mb-1">{approval.title}</h4>
            <p className="text-xs text-muted-foreground">
              {approval.description}
            </p>
          </div>

          {/* Enhanced content based on approval type */}
          {approval.type === "anomaly_detection" &&
            (hasImages || hasCriticalAnomalies) && (
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  {hasImages && (
                    <TabsTrigger value="images">
                      Images ({approval.context.associatedImages?.length})
                    </TabsTrigger>
                  )}
                  {hasCriticalAnomalies && (
                    <TabsTrigger value="anomalies">Critical Issues</TabsTrigger>
                  )}
                </TabsList>

                <TabsContent value="overview" className="mt-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                      <div className="text-red-600 font-semibold text-lg">
                        {approval.context.severeCount || 0}
                      </div>
                      <div className="text-red-700 text-xs">Severe Issues</div>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                      <div className="text-blue-600 font-semibold text-lg">
                        {approval.context.totalAnomalies || 0}
                      </div>
                      <div className="text-blue-700 text-xs">
                        Total Anomalies
                      </div>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                      <div className="text-green-600 font-semibold text-lg">
                        {approval.context.imagesAnalyzed || 0}
                      </div>
                      <div className="text-green-700 text-xs">
                        Images Analyzed
                      </div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                      <div className="text-gray-600 font-semibold text-lg">
                        {approval.context.imagesRemaining || 0}
                      </div>
                      <div className="text-gray-700 text-xs">Remaining</div>
                    </div>
                  </div>
                </TabsContent>

                {hasImages && (
                  <TabsContent value="images" className="mt-4">
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Images where critical thermal anomalies were detected:
                      </p>
                      <div className="grid gap-4">
                        {approval.context.associatedImages?.map(
                          (image, index) => (
                            <Card key={index} className="overflow-hidden">
                              <CardHeader className="pb-2">
                                <CardTitle className="text-sm flex items-center gap-2">
                                  <Thermometer className="h-4 w-4" />
                                  {image.label || `Image Pair ${index + 1}`}
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="grid md:grid-cols-2 gap-4">
                                  {image.rgbUrl && (
                                    <div>
                                      <p className="text-xs font-medium mb-2 flex items-center gap-1">
                                        <Eye className="h-3 w-3" />
                                        RGB (Visual)
                                      </p>
                                      <img
                                        src={image.rgbUrl}
                                        alt="RGB view"
                                        className="w-full h-48 object-cover rounded border"
                                      />
                                    </div>
                                  )}
                                  {image.thermalUrl && (
                                    <div>
                                      <p className="text-xs font-medium mb-2 flex items-center gap-1">
                                        <Thermometer className="h-3 w-3" />
                                        Thermal (Infrared)
                                      </p>
                                      <img
                                        src={image.thermalUrl}
                                        alt="Thermal view"
                                        className="w-full h-48 object-cover rounded border"
                                      />
                                    </div>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          )
                        )}
                      </div>
                    </div>
                  </TabsContent>
                )}

                {hasCriticalAnomalies && (
                  <TabsContent value="anomalies" className="mt-4">
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">
                        Severe thermal anomalies detected:
                      </p>
                      {approval.context.criticalAnomalies?.map(
                        (anomaly, index) => (
                          <Card
                            key={index}
                            className="border-red-200 bg-red-50"
                          >
                            <CardContent className="pt-4">
                              <div className="flex items-start justify-between mb-3">
                                <div>
                                  <h4 className="font-medium text-sm flex items-center gap-2">
                                    <AlertTriangle className="h-4 w-4 text-red-500" />
                                    {anomaly.location}
                                  </h4>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {anomaly.description}
                                  </p>
                                </div>
                                <div className="flex gap-2">
                                  <Badge
                                    variant="destructive"
                                    className="text-xs"
                                  >
                                    {anomaly.severity.toUpperCase()}
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    {Math.round(anomaly.confidence * 100)}%
                                    confidence
                                  </Badge>
                                </div>
                              </div>

                              <div className="grid md:grid-cols-2 gap-3 text-xs">
                                <div className="space-y-1">
                                  {anomaly.temperatureDifferential && (
                                    <div>
                                      <strong>Temperature Diff:</strong>{" "}
                                      {anomaly.temperatureDifferential}
                                    </div>
                                  )}
                                  {anomaly.probableCause && (
                                    <div>
                                      <strong>Probable Cause:</strong>{" "}
                                      {anomaly.probableCause}
                                    </div>
                                  )}
                                  {anomaly.estimatedEnergyLoss && (
                                    <div>
                                      <strong>Energy Loss:</strong>{" "}
                                      {anomaly.estimatedEnergyLoss}
                                    </div>
                                  )}
                                </div>
                                <div className="space-y-1">
                                  {anomaly.repairCost && (
                                    <div>
                                      <strong>Repair Cost:</strong>{" "}
                                      {anomaly.repairCost}
                                    </div>
                                  )}
                                  {anomaly.repairPriority && (
                                    <div>
                                      <strong>Priority:</strong>{" "}
                                      {anomaly.repairPriority.toUpperCase()}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )
                      )}
                    </div>
                  </TabsContent>
                )}
              </Tabs>
            )}

          {/* Standard context info for other approval types */}
          {approval.type !== "anomaly_detection" && approval.context && (
            <div className="text-xs space-y-1 text-muted-foreground">
              {approval.context.imagePairCount && (
                <div>• Images: {approval.context.imagePairCount} pairs</div>
              )}
              {approval.context.buildingName && (
                <div>• Building: {approval.context.buildingName}</div>
              )}
              {approval.context.estimatedCost && (
                <div>• Cost: {approval.context.estimatedCost}</div>
              )}
              {approval.context.anomalyCount && (
                <div>• Anomalies Found: {approval.context.anomalyCount}</div>
              )}
              {approval.context.reportType && (
                <div>• Report Type: {approval.context.reportType}</div>
              )}
            </div>
          )}

          {/* Comment field for approve/deny modes */}
          {(mode === "approve" || mode === "deny") && (
            <div>
              <label className="text-sm font-medium">
                {mode === "deny" ? "Reason (required):" : "Comment (optional):"}
              </label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={
                  mode === "deny" ? "Please explain why..." : "Add a comment..."
                }
                className="mt-1 h-20"
                disabled={isProcessing}
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            {mode === "view" && (
              <>
                <Button
                  onClick={() => setMode("approve")}
                  disabled={isProcessing}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <Check className="h-4 w-4 mr-1" />
                  Continue Analysis
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setMode("deny")}
                  disabled={isProcessing}
                  className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                >
                  <X className="h-4 w-4 mr-1" />
                  Stop & Review
                </Button>
              </>
            )}

            {mode === "approve" && (
              <>
                <Button variant="outline" onClick={() => setMode("view")}>
                  Back
                </Button>
                <Button
                  onClick={handleApprove}
                  disabled={isProcessing}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isProcessing ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4 mr-1" />
                  )}
                  Yes, Continue
                </Button>
              </>
            )}

            {mode === "deny" && (
              <>
                <Button variant="outline" onClick={() => setMode("view")}>
                  Back
                </Button>
                <Button
                  onClick={handleDeny}
                  disabled={isProcessing || (mode === "deny" && !reason.trim())}
                  variant="destructive"
                >
                  {isProcessing ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <X className="h-4 w-4 mr-1" />
                  )}
                  Stop Analysis
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Enhanced approval card component
export function ApprovalCard({
  approval,
  onDecision,
  isProcessing,
}: {
  approval: Approval;
  onDecision: (decision: ApprovalDecision) => void;
  isProcessing?: boolean;
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const hasImages =
    approval.context.associatedImages &&
    approval.context.associatedImages.length > 0;
  const hasCriticalAnomalies =
    approval.context.criticalAnomalies &&
    approval.context.criticalAnomalies.length > 0;

  return (
    <>
      <div className="border-2 border-amber-200 bg-amber-50 rounded-lg p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-medium text-amber-900 flex items-center gap-2">
              {approval.title}
              {approval.type === "anomaly_detection" && (
                <AlertTriangle className="h-4 w-4 text-red-500" />
              )}
            </h3>
            <p className="text-sm text-amber-700 mt-1">
              {approval.description}
            </p>

            {/* Quick preview for anomaly detection */}
            {approval.type === "anomaly_detection" && (
              <div className="mt-3 flex gap-4 text-xs">
                {approval.context.severeCount && (
                  <span className="bg-red-100 text-red-700 px-2 py-1 rounded">
                    {approval.context.severeCount} severe issues
                  </span>
                )}
                {hasImages && (
                  <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {approval.context.associatedImages?.length} images
                  </span>
                )}
              </div>
            )}
          </div>
          <Badge variant="outline" className="bg-amber-100">
            <User className="h-3 w-3 mr-1" />
            Review Required
          </Badge>
        </div>

        <Button
          onClick={() => setIsModalOpen(true)}
          className="w-full"
          disabled={isProcessing}
        >
          {hasImages || hasCriticalAnomalies
            ? "Review Issues & Images"
            : "Review Request"}
        </Button>
      </div>

      <ApprovalModal
        approval={approval}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onDecision={onDecision}
        isProcessing={isProcessing}
      />
    </>
  );
}
