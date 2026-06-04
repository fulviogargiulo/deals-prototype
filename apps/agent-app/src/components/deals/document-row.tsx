import { useRef } from 'react';
import { CheckCircle2, Upload, Download, RefreshCw, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface DocumentRowProps {
  name: string;
  subtitle?: string;
  isUploaded: boolean;
  uploadedFileName?: string;
  onUpload: (file: File) => void;
  onDownload?: () => void;
  onReplace?: (file: File) => void;
  onDelete?: () => void;
}

export function DocumentRow({
  name,
  subtitle,
  isUploaded,
  uploadedFileName,
  onUpload,
  onDownload,
  onReplace,
  onDelete,
}: DocumentRowProps) {
  const uploadRef = useRef<HTMLInputElement | null>(null);
  const replaceRef = useRef<HTMLInputElement | null>(null);

  const fileName = uploadedFileName || `${name}.pdf`;

  const handleUploadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onUpload(file);
  };

  const handleReplaceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onReplace?.(file);
      toast.success(`${name} replaced`);
    }
  };

  const handleDownload = () => {
    onDownload?.();
    toast.success(`Downloading ${fileName}`);
  };

  const handleDelete = () => {
    onDelete?.();
    toast.success(`${name} removed`);
  };

  return (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-b-0">
      {/* Left: status icon + name */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {isUploaded ? (
          <CheckCircle2 className="w-5 h-5 shrink-0 text-tier-success" />
        ) : (
          <div className="w-5 h-5 shrink-0 rounded-full border-2 border-[hsl(var(--border))]" />
        )}
        <div className="min-w-0">
          <p className={`text-[14px] leading-[140%] truncate ${isUploaded ? 'text-foreground font-semibold' : 'text-foreground font-semibold'}`}>
            {name}
          </p>
          {subtitle && !isUploaded && (
            <p className="text-[12px] text-muted-foreground leading-[140%]">{subtitle}</p>
          )}
        </div>
      </div>

      {/* Right: actions */}
      <div className="shrink-0 ml-3 flex items-center gap-1">
        {isUploaded ? (
          <>
            {/* Uploaded file name */}
            <span className="text-[12px] text-muted-foreground leading-[140%] truncate max-w-[180px] mr-2">
              {fileName}
            </span>

            {/* Download */}
            <button
              onClick={handleDownload}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-secondary transition-colors text-muted-foreground"
              title="Download"
            >
              <Download className="w-4 h-4" />
            </button>

            {/* Replace */}
            <input
              type="file"
              ref={replaceRef}
              onChange={handleReplaceChange}
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            />
            <button
              onClick={() => replaceRef.current?.click()}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-secondary transition-colors text-muted-foreground"
              title="Replace"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* Delete */}
            {onDelete && (
              <button
                onClick={handleDelete}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-tier-danger-bg transition-colors text-tier-danger"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </>
        ) : (
          <>
            <input
              type="file"
              ref={uploadRef}
              onChange={handleUploadChange}
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            />
            <button
              onClick={() => uploadRef.current?.click()}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-secondary transition-colors text-foreground"
              title="Upload"
            >
              <Upload className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
