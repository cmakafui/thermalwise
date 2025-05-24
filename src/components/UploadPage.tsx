// src/components/UploadPage.tsx
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ThermalImagePairUpload } from "@/components/ThermalImagePairUpload";
import {
  Building2,
  User,
  Camera,
  Thermometer,
  CheckCircle,
  AlertCircle,
  FileImage,
  Zap,
  Calendar,
  MapPin,
  Gauge,
} from "lucide-react";

// Form validation schema
const buildingFormSchema = z.object({
  buildingName: z
    .string()
    .min(2, "Building name must be at least 2 characters"),
  location: z.string().min(5, "Location must be at least 5 characters"),
  buildingId: z.string().min(3, "Building ID is required"),
  constructionYear: z
    .number()
    .min(1900, "Year must be after 1900")
    .max(new Date().getFullYear(), "Year cannot be in the future"),
  buildingType: z.enum(["Residential", "Commercial", "Industrial"]),
  inspector: z.string().min(2, "Inspector name is required"),
  inspectionDate: z.string().min(1, "Inspection date is required"),
  inspectionTime: z.string().min(1, "Inspection time is required"),
  outsideTemp: z.string().min(1, "Outside temperature is required"),
  notes: z.string().optional(),
});

type BuildingFormData = z.infer<typeof buildingFormSchema>;

interface ImagePair {
  id: string;
  rgbFile?: File;
  thermalFile?: File;
  rgbUrl?: string;
  thermalUrl?: string;
  label: string;
  status: "pending" | "uploading" | "complete" | "error";
}

export function UploadPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [imagePairs, setImagePairs] = useState<ImagePair[]>([
    { id: "1", label: "Area 1", status: "pending" },
  ]);
  const [uploadProgress, setUploadProgress] = useState(0);

  const form = useForm<BuildingFormData>({
    resolver: zodResolver(buildingFormSchema),
    defaultValues: {
      buildingName: "Helsinki Office Building",
      location: "Kustaa Vaasan tie 13, FI-00560 Helsinki",
      buildingId: "010089527F",
      constructionYear: 1980,
      buildingType: "Commercial",
      inspector: "Thermal Engineer",
      inspectionDate: new Date().toISOString().split("T")[0],
      inspectionTime: new Date().toTimeString().slice(0, 5),
      outsideTemp: "2",
      notes: "",
    },
  });

  const onSubmit = (data: BuildingFormData) => {
    console.log("Form data:", data);
    setCurrentStep(2);
  };

  const addImagePair = () => {
    const newPair: ImagePair = {
      id: Date.now().toString(),
      label: `Area ${imagePairs.length + 1}`,
      status: "pending",
    };
    setImagePairs([...imagePairs, newPair]);
  };

  const removeImagePair = (id: string) => {
    if (imagePairs.length > 1) {
      setImagePairs(imagePairs.filter((pair) => pair.id !== id));
    }
  };

  const updateImagePairLabel = (id: string, label: string) => {
    setImagePairs((pairs) =>
      pairs.map((pair) => (pair.id === id ? { ...pair, label } : pair))
    );
  };

  const handleFileUpload = async (
    pairId: string,
    type: "rgb" | "thermal",
    file: File
  ) => {
    // Update status to uploading
    setImagePairs((pairs) =>
      pairs.map((pair) =>
        pair.id === pairId
          ? { ...pair, [`${type}File`]: file, status: "uploading" as const }
          : pair
      )
    );

    try {
      // Use UploadThing to upload the file
      const { uploadFiles } = await import("@/lib/uploadthing");

      const result = await uploadFiles("imageUploader", {
        files: [file],
      });

      if (result?.[0]) {
        // Update with successful upload
        setImagePairs((pairs) =>
          pairs.map((pair) =>
            pair.id === pairId
              ? {
                  ...pair,
                  [`${type}Url`]: result[0].url,
                  status:
                    (pair.rgbUrl || (type === "rgb" && result[0].url)) &&
                    (pair.thermalUrl || (type === "thermal" && result[0].url))
                      ? "complete"
                      : "pending",
                }
              : pair
          )
        );
      }
    } catch (error) {
      console.error("Upload failed:", error);
      // Update status to error
      setImagePairs((pairs) =>
        pairs.map((pair) =>
          pair.id === pairId ? { ...pair, status: "error" as const } : pair
        )
      );
    }
  };

  const startAnalysis = () => {
    setCurrentStep(3);

    // Simulate analysis progress
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Thermal Analysis Upload</h1>
        <p className="text-muted-foreground">
          Upload your thermal image pairs and building information for
          AI-powered analysis
        </p>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center space-x-4 py-4">
          <div
            className={`flex items-center space-x-2 ${currentStep >= 1 ? "text-primary" : "text-muted-foreground"}`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                currentStep >= 1
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-muted-foreground"
              }`}
            >
              {currentStep > 1 ? <CheckCircle className="h-4 w-4" /> : "1"}
            </div>
            <span className="text-sm font-medium">Building Info</span>
          </div>

          <div className="w-12 h-1 bg-muted rounded">
            <div
              className="h-full bg-primary rounded transition-all duration-300"
              style={{ width: currentStep >= 2 ? "100%" : "0%" }}
            />
          </div>

          <div
            className={`flex items-center space-x-2 ${currentStep >= 2 ? "text-primary" : "text-muted-foreground"}`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                currentStep >= 2
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-muted-foreground"
              }`}
            >
              {currentStep > 2 ? <CheckCircle className="h-4 w-4" /> : "2"}
            </div>
            <span className="text-sm font-medium">Upload Images</span>
          </div>

          <div className="w-12 h-1 bg-muted rounded">
            <div
              className="h-full bg-primary rounded transition-all duration-300"
              style={{ width: currentStep >= 3 ? "100%" : "0%" }}
            />
          </div>

          <div
            className={`flex items-center space-x-2 ${currentStep >= 3 ? "text-primary" : "text-muted-foreground"}`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                currentStep >= 3
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-muted-foreground"
              }`}
            >
              {currentStep > 3 ? <CheckCircle className="h-4 w-4" /> : "3"}
            </div>
            <span className="text-sm font-medium">Analysis</span>
          </div>
        </div>
      </div>

      {/* Step 1: Building Information */}
      {currentStep === 1 && (
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Building Information
            </CardTitle>
            <CardDescription>
              Enter the building details and inspection information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Building Details */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Building2 className="h-4 w-4 text-primary" />
                      <h3 className="font-semibold">Building Details</h3>
                    </div>

                    <FormField
                      control={form.control}
                      name="buildingName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Building Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter building name"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            Location
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Enter full address"
                              className="resize-none"
                              rows={2}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="buildingId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Building ID</FormLabel>
                            <FormControl>
                              <Input placeholder="Building ID" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="constructionYear"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Construction Year</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="1900"
                                max={new Date().getFullYear()}
                                {...field}
                                onChange={(e) =>
                                  field.onChange(parseInt(e.target.value))
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="buildingType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Building Type</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select building type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Residential">
                                🏠 Residential
                              </SelectItem>
                              <SelectItem value="Commercial">
                                🏢 Commercial
                              </SelectItem>
                              <SelectItem value="Industrial">
                                🏭 Industrial
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Inspection Details */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-3">
                      <User className="h-4 w-4 text-primary" />
                      <h3 className="font-semibold">Inspection Details</h3>
                    </div>

                    <FormField
                      control={form.control}
                      name="inspector"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Inspector Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter inspector name"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="inspectionDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Date
                            </FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="inspectionTime"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Time</FormLabel>
                            <FormControl>
                              <Input type="time" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="outsideTemp"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1">
                            <Thermometer className="h-3 w-3" />
                            Outside Temperature (°C)
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., 2" {...field} />
                          </FormControl>
                          <FormDescription>
                            Enter the outside temperature during inspection
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Additional Notes</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Any additional information..."
                              className="resize-none"
                              rows={3}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Separator />

                <div className="flex justify-end">
                  <Button type="submit" size="lg" className="group">
                    Continue to Image Upload
                    <Camera className="ml-2 h-4 w-4 group-hover:scale-110 transition-transform" />
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Image Upload */}
      {currentStep === 2 && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5 text-primary" />
                Upload Image Pairs
              </CardTitle>
              <CardDescription>
                Upload RGB and thermal images for each area you want to analyze
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {imagePairs.map((pair, index) => (
                <ThermalImagePairUpload
                  key={pair.id}
                  pair={pair}
                  index={index}
                  onFileUpload={handleFileUpload}
                  onRemove={() => removeImagePair(pair.id)}
                  onUpdateLabel={updateImagePairLabel}
                  canRemove={imagePairs.length > 1}
                />
              ))}

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button
                  variant="outline"
                  onClick={addImagePair}
                  className="flex-1"
                >
                  <FileImage className="mr-2 h-4 w-4" />
                  Add Another Area
                </Button>

                <Button
                  onClick={startAnalysis}
                  size="lg"
                  className="flex-1 group"
                  disabled={
                    !imagePairs.every((pair) => pair.status === "complete")
                  }
                >
                  <Zap className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform" />
                  Start AI Analysis
                </Button>
              </div>

              {imagePairs.some((pair) => pair.status !== "complete") && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Please upload both RGB and thermal images for all areas
                    before starting analysis.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 3: Analysis Progress */}
      {currentStep === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gauge className="h-5 w-5 text-primary animate-spin" />
              Analysis in Progress
            </CardTitle>
            <CardDescription>
              Our AI is analyzing your thermal images and generating insights...
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="text-center space-y-2">
                <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <FileImage className="h-6 w-6 text-primary" />
                </div>
                <p className="text-sm font-medium">Processing Images</p>
                <p className="text-xs text-muted-foreground">
                  Analyzing thermal patterns
                </p>
              </div>

              <div className="text-center space-y-2">
                <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <p className="text-sm font-medium">AI Detection</p>
                <p className="text-xs text-muted-foreground">
                  Identifying anomalies
                </p>
              </div>

              <div className="text-center space-y-2">
                <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <p className="text-sm font-medium">Report Generation</p>
                <p className="text-xs text-muted-foreground">
                  Creating recommendations
                </p>
              </div>
            </div>

            {uploadProgress === 100 && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Analysis complete! Your thermal analysis report is ready.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
