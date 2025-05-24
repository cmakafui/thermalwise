// worker/uploadthing.ts
import { createUploadthing, type FileRouter } from "uploadthing/server";

const f = createUploadthing();

export const uploadRouter = {
  imageUploader: f({ image: { maxFileSize: "4MB" } }).onUploadComplete(
    async ({ file }) => {
      return { url: file.ufsUrl };
    }
  ),
} satisfies FileRouter;

export type OurFileRouter = typeof uploadRouter;
