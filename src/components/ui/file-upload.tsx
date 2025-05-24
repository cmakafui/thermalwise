// src/components/ui/file-upload.tsx - Custom file upload component
import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CheckCircle,
  AlertCircle,
  Camera,
  Thermometer,
  Loader2,
} from "lucide-react";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  maxSize?: number; // in MB
  currentFile?: File;
  uploadStatus?: "idle" | "uploading" | "success" | "error";
  uploadProgress?: number;
  type: "rgb" | "thermal";
  disabled?: boolean;
  error?: string;
}

export function FileUpload({
  onFileSelect,
  accept = "image/*",
  maxSize = 8,
  currentFile,
  uploadStatus = "idle",
  uploadProgress = 0,
  type,
  disabled = false,
  error,
}: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);

  const validateFile = useCallback(
    (file: File): boolean => {
      if (file.size > maxSize * 1024 * 1024) {
        return false;
      }
      return true;
    },
    [maxSize]
  );

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (disabled || uploadStatus === "uploading") return;

      const files = Array.from(e.dataTransfer.files);
      const file = files[0];

      if (file && validateFile(file)) {
        onFileSelect(file);
      }
    },
    [disabled, uploadStatus, onFileSelect, validateFile]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (disabled || uploadStatus === "uploading") return;

    const files = Array.from(e.target.files || []);
    const file = files[0];

    if (file && validateFile(file)) {
      onFileSelect(file);
    }
  };

  const getStatusIcon = () => {
    switch (uploadStatus) {
      case "uploading":
        return <Loader2 className="h-8 w-8 text-primary animate-spin" />;
      case "success":
        return <CheckCircle className="h-8 w-8 text-green-500" />;
      case "error":
        return <AlertCircle className="h-8 w-8 text-destructive" />;
      default:
        return type === "thermal" ? (
          <Thermometer className="h-8 w-8 text-muted-foreground" />
        ) : (
          <Camera className="h-8 w-8 text-muted-foreground" />
        );
    }
  };

  const getStatusColor = () => {
    switch (uploadStatus) {
      case "success":
        return "border-green-200 bg-green-50";
      case "error":
        return "border-red-200 bg-red-50";
      case "uploading":
        return "border-primary/50 bg-primary/5";
      default:
        return dragActive
          ? "border-primary bg-primary/5"
          : "border-dashed border-muted hover:border-primary/50";
    }
  };

  return (
    <div className="space-y-2">
      <div
        className={cn(
          "relative border-2 rounded-lg p-6 text-center transition-colors cursor-pointer",
          getStatusColor(),
          disabled && "opacity-50 cursor-not-allowed"
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept={accept}
          onChange={handleChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={disabled || uploadStatus === "uploading"}
          id={`file-upload-${type}`}
        />

        <div className="space-y-3">
          {getStatusIcon()}

          {uploadStatus === "uploading" ? (
            <div className="space-y-2">
              <p className="text-sm font-medium">Uploading...</p>
              <Progress value={uploadProgress} className="h-2" />
              <p className="text-xs text-muted-foreground">{uploadProgress}%</p>
            </div>
          ) : currentFile ? (
            <div className="space-y-2">
              <p className="text-sm font-medium">{currentFile.name}</p>
              <p className="text-xs text-muted-foreground">
                {(currentFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
              {uploadStatus === "success" && (
                <p className="text-xs text-green-600">Upload complete</p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm font-medium">
                Drop your {type === "thermal" ? "thermal" : "RGB"} image here
              </p>
              <p className="text-xs text-muted-foreground">
                or click to browse • Max {maxSize}MB
              </p>
            </div>
          )}
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
