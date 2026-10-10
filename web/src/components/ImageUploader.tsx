"use client"

import { useState, useId } from "react";
import { UploadIcon, XIcon, Image as ImageIcon, AlertCircleIcon } from "lucide-react";
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
} from "@/components/ui/attachment";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";

interface ImageUploaderProps {
  defaultImage?: string;
  defaultTitle?: string;
  defaultSize?: string;
  onUpload?: (file: File) => Promise<void>;
  onRemove?: () => void;
  className?: string;
  orientation?: "horizontal" | "vertical";
  variant?: "image" | "icon";
}

export function ImageUploader({ 
  defaultImage, 
  defaultTitle = "No image selected", 
  defaultSize = "0 KB", 
  onUpload,
  onRemove,
  className,
  orientation = "horizontal",
  variant = "image"
}: ImageUploaderProps) {
  const [state, setState] = useState<"idle" | "uploading" | "error" | "done">(defaultImage ? "done" : "idle");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(defaultImage || null);
  const [errorMessage, setErrorMessage] = useState("");

  // Unique ID for the input to allow multiple uploaders on the same page
  const rawId = useId();
  const inputId = `image-upload-input-${rawId}`;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.type.startsWith('image/')) {
      setState("error");
      setErrorMessage("File must be an image");
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) { // 5MB limit
      setState("error");
      setErrorMessage("File is too large (max 5MB)");
      return;
    }

    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
    setState("uploading");

    try {
      if (onUpload) {
        await onUpload(selectedFile);
      } else {
        // Simulate upload delay for UI demonstration
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      setState("done");
      toast.add({ type: "success", title: "Upload Complete", description: `${selectedFile.name} uploaded successfully.` });
    } catch {
      setState("error");
      setErrorMessage("Upload failed");
    }
  };

  const handleRemove = () => {
    setFile(null);
    setPreview(null);
    setState("idle");
    setErrorMessage("");
    if (onRemove) onRemove();
    toast.add({ type: "info", description: "Image removed." });
  };

  return (
    <div className={`relative ${className}`}>
      {/* Hidden file input */}
      <input 
        type="file" 
        id={inputId} 
        className="hidden" 
        accept="image/*" 
        onChange={handleFileChange}
      />

      <Attachment state={state} orientation={orientation} className="w-full">
        <AttachmentMedia variant={variant}>
          {state === "idle" && <UploadIcon className="w-5 h-5" />}
          {state === "uploading" && <Spinner />}
          {state === "error" && <AlertCircleIcon className="w-5 h-5" />}
          {state === "done" && preview && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Uploaded preview" className="object-cover w-full h-full" />
          )}
          {state === "done" && !preview && <ImageIcon className="w-5 h-5" />}
        </AttachmentMedia>
        
        <AttachmentContent>
          {state === "idle" && (
            <>
              <AttachmentTitle>
                 <label htmlFor={inputId} className="cursor-pointer hover:underline">
                   Click to upload
                 </label>
              </AttachmentTitle>
              <AttachmentDescription>JPG, PNG, GIF up to 5MB</AttachmentDescription>
            </>
          )}
          
          {state === "uploading" && (
            <>
              <AttachmentTitle>{file?.name || "Uploading..."}</AttachmentTitle>
              <AttachmentDescription>Uploading image...</AttachmentDescription>
            </>
          )}

          {state === "error" && (
            <>
              <AttachmentTitle className="text-red-500">{file?.name || "Error"}</AttachmentTitle>
              <AttachmentDescription className="text-red-400">{errorMessage}</AttachmentDescription>
            </>
          )}

          {state === "done" && (
            <>
              <AttachmentTitle>{file?.name || defaultTitle}</AttachmentTitle>
              <AttachmentDescription>
                {file ? `${(file.size / 1024).toFixed(1)} KB` : defaultSize}
              </AttachmentDescription>
            </>
          )}
        </AttachmentContent>

        <AttachmentActions>
          {(state === "done" || state === "error" || state === "uploading") && (
            <AttachmentAction aria-label="Remove" onClick={handleRemove}>
              <XIcon className="w-4 h-4" />
            </AttachmentAction>
          )}
        </AttachmentActions>
      </Attachment>
    </div>
  );
}
