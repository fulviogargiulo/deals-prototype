import * as React from "react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Download, FileText, ZoomIn, ZoomOut } from "lucide-react";
import { cn } from "@/lib/utils";

interface DocumentPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: {
    name: string;
    type: string;
    url?: string;
  } | null;
  onDownload?: () => void;
}

export function DocumentPreviewModal({
  open,
  onOpenChange,
  document,
  onDownload,
}: DocumentPreviewModalProps) {
  const [zoom, setZoom] = React.useState(100);

  const isImage = document && ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(document.type.toLowerCase());
  const isPdf = document && document.type.toLowerCase() === 'pdf';

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 25, 50));

  const handleDownload = () => {
    if (onDownload) {
      onDownload();
    } else if (document?.url) {
      // Create a link and trigger download
      const link = window.document.createElement('a');
      link.href = document.url;
      link.download = document.name;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
    }
  };

  // Reset zoom when document changes
  React.useEffect(() => {
    setZoom(100);
  }, [document]);

  if (!document) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        hideCloseButton 
        className="max-w-4xl w-[95vw] h-[90vh] p-0 bg-background/95 backdrop-blur-sm flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{document.name}</p>
              <p className="text-xs text-muted-foreground uppercase">{document.type}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {(isImage || isPdf) && (
              <div className="flex items-center gap-1 mr-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleZoomOut}
                  disabled={zoom <= 50}
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-xs text-muted-foreground w-12 text-center">{zoom}%</span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleZoomIn}
                  disabled={zoom >= 200}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={handleDownload}
            >
              <Download className="h-4 w-4" />
              Download
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto flex items-center justify-center p-4 bg-muted/30">
          {isImage ? (
            <div 
              className="transition-transform duration-200"
              style={{ transform: `scale(${zoom / 100})` }}
            >
              <img
                src={document.url || '/placeholder.svg'}
                alt={document.name}
                className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
              />
            </div>
          ) : isPdf ? (
            <div 
              className="w-full h-full flex items-center justify-center"
              style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'center center' }}
            >
              {document.url ? (
                <iframe
                  src={document.url}
                  className="w-full h-full border-0 rounded-lg"
                  title={document.name}
                />
              ) : (
                <div className="flex flex-col items-center gap-4 text-center">
                  <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center">
                    <FileText className="w-10 h-10 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-lg font-medium">{document.name}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      PDF preview not available
                    </p>
                  </div>
                  <Button onClick={handleDownload} className="gap-2">
                    <Download className="h-4 w-4" />
                    Download to view
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center">
                <FileText className="w-10 h-10 text-muted-foreground" />
              </div>
              <div>
                <p className="text-lg font-medium">{document.name}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Preview not available for this file type
                </p>
              </div>
              <Button onClick={handleDownload} className="gap-2">
                <Download className="h-4 w-4" />
                Download to view
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
