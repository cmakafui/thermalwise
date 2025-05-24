// src/components/ThermalImagePairUpload.tsx - Enhanced image pair component
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileUpload } from "@/components/ui/file-upload";
import { Trash2, Edit2, Check, X, Camera, Thermometer } from "lucide-react";

interface ThermalImagePairUploadProps {
  pair: {
    id: string;
    label: string;
    rgbFile?: File;
    thermalFile?: File;
    rgbUrl?: string;
    thermalUrl?: string;
    status: "pending" | "uploading" | "complete" | "error";
  };
  index: number;
  onFileUpload: (
    pairId: string,
    type: "rgb" | "thermal",
    file: File
  ) => Promise<void>;
  onRemove: () => void;
  onUpdateLabel: (pairId: string, label: string) => void;
  canRemove: boolean;
}

export function ThermalImagePairUpload({
  pair,
  index,
  onFileUpload,
  onRemove,
  onUpdateLabel,
  canRemove,
}: ThermalImagePairUploadProps) {
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [labelValue, setLabelValue] = useState(pair.label);
  const [uploadProgress, setUploadProgress] = useState({ rgb: 0, thermal: 0 });

  const handleLabelSave = () => {
    onUpdateLabel(pair.id, labelValue);
    setIsEditingLabel(false);
  };

  const handleLabelCancel = () => {
    setLabelValue(pair.label);
    setIsEditingLabel(false);
  };

  const handleFileSelect = async (type: "rgb" | "thermal", file: File) => {
    try {
      // Update progress during upload
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => ({
          ...prev,
          [type]: Math.min(prev[type] + 10, 90),
        }));
      }, 200);

      await onFileUpload(pair.id, type, file);

      clearInterval(progressInterval);
      setUploadProgress((prev) => ({ ...prev, [type]: 100 }));

      // Reset progress after success
      setTimeout(() => {
        setUploadProgress((prev) => ({ ...prev, [type]: 0 }));
      }, 1000);
    } catch {
      setUploadProgress((prev) => ({ ...prev, [type]: 0 }));
    }
  };

  const getOverallStatus = () => {
    if (pair.rgbUrl && pair.thermalUrl) return "success";
    if (pair.status === "uploading") return "uploading";
    if (pair.status === "error") return "error";
    return "pending";
  };

  const getStatusBadge = () => {
    const status = getOverallStatus();
    switch (status) {
      case "success":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            Complete
          </Badge>
        );
      case "uploading":
        return <Badge variant="secondary">Uploading...</Badge>;
      case "error":
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  return (
    <Card className="border-2 border-dashed hover:border-primary/50 transition-colors">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-sm">
              {index + 1}
            </Badge>

            {isEditingLabel ? (
              <div className="flex items-center gap-2">
                <Input
                  value={labelValue}
                  onChange={(e) => setLabelValue(e.target.value)}
                  className="h-8 text-sm"
                  placeholder="Area name..."
                />
                <Button size="sm" variant="ghost" onClick={handleLabelSave}>
                  <Check className="h-3 w-3" />
                </Button>
                <Button size="sm" variant="ghost" onClick={handleLabelCancel}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg">{pair.label}</CardTitle>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsEditingLabel(true)}
                >
                  <Edit2 className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {getStatusBadge()}
            {canRemove && (
              <Button variant="ghost" size="sm" onClick={onRemove}>
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Camera className="h-4 w-4" />
              RGB Image
            </Label>
            <FileUpload
              type="rgb"
              currentFile={pair.rgbFile}
              uploadStatus={
                pair.rgbUrl
                  ? "success"
                  : pair.status === "uploading"
                    ? "uploading"
                    : "idle"
              }
              uploadProgress={uploadProgress.rgb}
              onFileSelect={(file) => handleFileSelect("rgb", file)}
              disabled={pair.status === "uploading"}
            />
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Thermometer className="h-4 w-4" />
              Thermal Image
            </Label>
            <FileUpload
              type="thermal"
              currentFile={pair.thermalFile}
              uploadStatus={
                pair.thermalUrl
                  ? "success"
                  : pair.status === "uploading"
                    ? "uploading"
                    : "idle"
              }
              uploadProgress={uploadProgress.thermal}
              onFileSelect={(file) => handleFileSelect("thermal", file)}
              disabled={pair.status === "uploading"}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
