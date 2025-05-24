// src/lib/uploadthing.ts - Client-side utilities
import {
  generateUploadButton,
  generateUploadDropzone,
  generateReactHelpers,
} from "@uploadthing/react";
import type { OurFileRouter } from "../../worker/uploadthing";

// Generate the upload components
export const UploadButton = generateUploadButton<OurFileRouter>({
  url: "/api/uploadthing", // This will use your worker endpoint
});

export const UploadDropzone = generateUploadDropzone<OurFileRouter>({
  url: "/api/uploadthing",
});

// Generate the helpers for custom components
export const { useUploadThing, uploadFiles } =
  generateReactHelpers<OurFileRouter>({
    url: "/api/uploadthing",
  });
