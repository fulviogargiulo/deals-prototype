import { useState, useCallback, useRef, useEffect } from "react";
import Cropper, { Area, Point } from "react-easy-crop";
import { Upload, ZoomIn, ZoomOut, RotateCcw, Pencil, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

const SUPPORTED_TYPES = ["image/jpeg", "image/png"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

interface EditProfilePictureModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentImage?: string;
  onImageUpdated: (croppedImage: string) => void;
  startInEditMode?: boolean;
}

// Helper function to create cropped image
const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.setAttribute("crossOrigin", "anonymous");
    image.src = url;
  });

async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area
): Promise<string> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("No 2d context");
  }

  // Set canvas size to the cropped area
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  // Draw the cropped image
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  // Return as base64 data URL
  return canvas.toDataURL("image/jpeg", 0.9);
}

export function EditProfilePictureModal({
  open,
  onOpenChange,
  currentImage,
  onImageUpdated,
  startInEditMode = false,
}: EditProfilePictureModalProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isEditMode, setIsEditMode] = useState(startInEditMode);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync isEditMode with startInEditMode when modal opens
  useEffect(() => {
    if (open && startInEditMode) {
      setIsEditMode(true);
    }
  }, [open, startInEditMode]);

  const validateFile = (file: File): string | null => {
    if (!SUPPORTED_TYPES.includes(file.type)) {
      return "Unsupported file type. Please upload a JPG or PNG image.";
    }
    if (file.size > MAX_FILE_SIZE) {
      return "File is too large. Maximum size is 5MB.";
    }
    return null;
  };

  const onCropComplete = useCallback(
    (croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const processFile = (file: File) => {
    const error = validateFile(file);
    if (error) {
      toast({
        title: "Invalid file",
        description: error,
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result as string);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    };
    reader.readAsDataURL(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
      e.target.value = "";
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleSave = async () => {
    if (!selectedImage || !croppedAreaPixels) return;

    setIsProcessing(true);
    try {
      const croppedImage = await getCroppedImg(selectedImage, croppedAreaPixels);
      
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      onImageUpdated(croppedImage);
      toast({
        title: "Profile picture updated",
        description: "Your new profile picture has been saved.",
      });
      handleClose();
    } catch (error) {
      console.error("Error cropping image:", error);
      toast({
        title: "Error",
        description: "Failed to save profile picture. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setSelectedImage(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setIsEditMode(false);
    onOpenChange(false);
  };

  const handleReset = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.2, 3));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.2, 1));
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md p-0 max-h-[90vh] overflow-hidden flex flex-col" hideCloseButton>
        <DialogHeader className="px-6 pt-6 pb-2 shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold">Update profile picture</DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={handleClose}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-6">
          {/* Show current image with Edit button when image exists and not in edit mode */}
          {currentImage && !isEditMode && !selectedImage ? (
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-muted">
                  <img
                    src={currentImage}
                    alt="Current profile"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <Button
                className="w-full gap-2"
                onClick={() => setIsEditMode(true)}
              >
                <Pencil className="w-4 h-4" />
                Edit Profile Picture
              </Button>
            </div>
          ) : !selectedImage ? (
            // Upload state (no image or in edit mode)
            <div className="space-y-4">
              {/* Upload area with drag and drop */}
              <label
                htmlFor="profile-upload"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={cn(
                  "flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed rounded-xl cursor-pointer transition-colors",
                  isDragOver
                    ? "border-primary bg-primary/10"
                    : "hover:border-primary hover:bg-primary/5"
                )}
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Upload className="w-6 h-6 text-primary" />
                </div>
                <div className="text-center">
                  <p className="font-medium">Drop image here or click to upload</p>
                  <p className="text-sm text-muted-foreground">
                    JPG or PNG only (max 5MB)
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  id="profile-upload"
                  type="file"
                  accept="image/jpeg,image/png"
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </label>
            </div>
          ) : (
            // Cropping state
            <div className="space-y-4">
              {/* Cropper container */}
              <div className="relative h-64 bg-muted rounded-xl overflow-hidden">
                <Cropper
                  image={selectedImage}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  cropShape="round"
                  showGrid={false}
                  onCropChange={setCrop}
                  onCropComplete={onCropComplete}
                  onZoomChange={setZoom}
                />
              </div>

              {/* Zoom controls */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleZoomOut}
                  className="p-1 rounded hover:bg-muted transition-colors"
                  aria-label="Zoom out"
                >
                  <ZoomOut className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                </button>
                <Slider
                  value={[zoom]}
                  min={1}
                  max={3}
                  step={0.1}
                  onValueChange={(value) => setZoom(value[0])}
                  className="flex-1"
                />
                <button
                  type="button"
                  onClick={handleZoomIn}
                  className="p-1 rounded hover:bg-muted transition-colors"
                  aria-label="Zoom in"
                >
                  <ZoomIn className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                </button>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  className="gap-1.5"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset
                </Button>
                <label htmlFor="profile-upload-change" className="flex-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-1.5"
                    asChild
                  >
                    <span>
                      <Upload className="w-4 h-4" />
                      Choose Different
                    </span>
                  </Button>
                  <input
                    id="profile-upload-change"
                    type="file"
                    accept="image/jpeg,image/png"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                </label>
              </div>

              {/* Footer buttons - only show when cropping */}
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={handleClose}>
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleSave}
                  disabled={!selectedImage || isProcessing}
                >
                  {isProcessing ? "Saving..." : "Save"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
