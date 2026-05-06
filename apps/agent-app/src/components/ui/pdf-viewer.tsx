import { useState, useCallback, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { ChevronLeft, ChevronRight, FileText, Loader2, RotateCcw, AlertCircle, ZoomIn, ZoomOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PdfViewerProps {
  /** URL of the PDF to display */
  url: string;
  /** Height of the preview area */
  height?: number;
  /** Callback when PDF is successfully loaded */
  onLoadSuccess?: (numPages: number) => void;
  /** Callback when PDF fails to load */
  onLoadError?: (error: Error) => void;
}

// Format bytes to human readable size
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export function PdfViewer({
  url,
  height = 360,
  onLoadSuccess,
  onLoadError,
}: PdfViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState<number>(0);
  const [zoom, setZoom] = useState<number>(1);
  const [fileSize, setFileSize] = useState<number | null>(null);

  // Fetch file size
  useEffect(() => {
    const fetchFileSize = async () => {
      try {
        const response = await fetch(url, { method: 'HEAD' });
        const contentLength = response.headers.get('content-length');
        if (contentLength) {
          setFileSize(parseInt(contentLength, 10));
        }
      } catch (e) {
        // Silently fail - file size is optional
      }
    };
    fetchFileSize();
  }, [url, retryKey]);

  const handleDocumentLoadSuccess = useCallback(
    ({ numPages }: { numPages: number }) => {
      setNumPages(numPages);
      setIsLoading(false);
      setError(null);
      onLoadSuccess?.(numPages);
    },
    [onLoadSuccess]
  );

  const handleDocumentLoadError = useCallback(
    (error: Error) => {
      console.error("PDF load error:", error);
      setIsLoading(false);
      setError("Unable to load PDF. The file may be unavailable or blocked by security settings.");
      onLoadError?.(error);
    },
    [onLoadError]
  );

  const handleRetry = () => {
    setIsLoading(true);
    setError(null);
    setRetryKey(prev => prev + 1);
  };

  const goToPrevPage = () => {
    setPageNumber((prev) => Math.max(1, prev - 1));
  };

  const goToNextPage = () => {
    setPageNumber((prev) => Math.min(numPages, prev + 1));
  };

  const goToPage = (page: number) => {
    setPageNumber(Math.max(1, Math.min(numPages, page)));
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.25, 2));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.25, 0.5));
  };

  return (
    <div className="rounded-xl overflow-hidden border border-border bg-background flex flex-col" style={{ height: height + 56 }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium">Property Brochure</p>
            <p className="text-xs text-muted-foreground">
              PDF {numPages > 0 ? `• ${numPages} pages` : ""}{fileSize ? ` • ${formatFileSize(fileSize)}` : ""}
            </p>
          </div>
        </div>
        
        {/* Zoom controls */}
        {!isLoading && !error && (
          <div className="flex items-center gap-1">
            <button
              onClick={handleZoomOut}
              disabled={zoom <= 0.5}
              className={cn(
                "w-7 h-7 rounded-md flex items-center justify-center transition-colors",
                zoom <= 0.5
                  ? "opacity-30 cursor-not-allowed"
                  : "hover:bg-muted"
              )}
              title="Zoom out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs text-muted-foreground w-10 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              disabled={zoom >= 2}
              className={cn(
                "w-7 h-7 rounded-md flex items-center justify-center transition-colors",
                zoom >= 2
                  ? "opacity-30 cursor-not-allowed"
                  : "hover:bg-muted"
              )}
              title="Zoom in"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Preview content area */}
      <div
        className="relative bg-muted/30 flex-1 flex items-center justify-center overflow-hidden"
      >
        {/* Loading state */}
        {isLoading && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/50 z-10">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Loading PDF...</p>
            </div>
          </div>
        )}

        {/* Error state */}
        {error && !isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/30 z-10">
            <div className="flex flex-col items-center gap-3 text-center px-6 max-w-xs">
              <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-destructive" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">Failed to load PDF</p>
                <p className="text-xs text-muted-foreground">{error}</p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRetry}
                className="gap-2"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Try again
              </Button>
            </div>
          </div>
        )}

        {/* PDF Document - hidden when error to prevent duplicate messages */}
        {!error && (
          <div 
            className="transition-transform duration-200 ease-out"
            style={{ transform: `scale(${zoom})` }}
          >
            <Document
              key={retryKey}
              file={url}
              onLoadSuccess={handleDocumentLoadSuccess}
              onLoadError={handleDocumentLoadError}
              loading={null}
              error={null}
              className="flex items-center justify-center"
            >
              <Page
                pageNumber={pageNumber}
                height={(height - 20) / zoom}
                renderTextLayer={false}
                renderAnnotationLayer={false}
                className="shadow-lg"
              />
            </Document>
          </div>
        )}

        {/* Navigation arrows */}
        {numPages > 1 && !isLoading && !error && (
          <>
            {/* Previous button */}
            <button
              onClick={goToPrevPage}
              disabled={pageNumber === 1}
              className={cn(
                "absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm border border-border flex items-center justify-center transition-all z-20",
                pageNumber === 1
                  ? "opacity-30 cursor-not-allowed"
                  : "hover:bg-background hover:scale-105"
              )}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Next button */}
            <button
              onClick={goToNextPage}
              disabled={pageNumber === numPages}
              className={cn(
                "absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm border border-border flex items-center justify-center transition-all z-20",
                pageNumber === numPages
                  ? "opacity-30 cursor-not-allowed"
                  : "hover:bg-background hover:scale-105"
              )}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}

        {/* Page indicator dots */}
        {numPages > 1 && numPages <= 10 && !isLoading && !error && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-black/20 backdrop-blur-sm z-20">
            {Array.from({ length: numPages }, (_, index) => (
              <button
                key={index}
                onClick={() => goToPage(index + 1)}
                className={cn(
                  "w-1.5 h-1.5 rounded-full transition-all",
                  index + 1 === pageNumber
                    ? "bg-white w-2"
                    : "bg-white/40 hover:bg-white/60"
                )}
              />
            ))}
          </div>
        )}

        {/* Page counter for PDFs with more than 10 pages */}
        {numPages > 10 && !isLoading && !error && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-black/20 backdrop-blur-sm z-20">
            <span className="text-xs font-medium text-white">
              {pageNumber} / {numPages}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
