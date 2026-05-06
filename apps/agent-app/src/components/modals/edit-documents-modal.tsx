import * as React from "react";
import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  X, 
  Loader2, 
  ChevronDown, 
  FileText, 
  Image as ImageIcon,
  Trash2,
  Upload,
  CheckCircle2,
  Eye,
  Download
} from "lucide-react";
import { DocumentPreviewModal } from "./document-preview-modal";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Progress } from "@/components/ui/progress";
import { FloatingLabelSelect } from "@/components/ui/floating-label-select";

interface DocumentItem {
  id: string;
  name: string;
  type: string;
  size?: number;
  url?: string;
  uploadProgress?: number;
  isUploading?: boolean;
  isDeleting?: boolean;
}

interface DocumentCategory {
  id: string;
  name: string;
  description: string;
  required: boolean;
  documents: DocumentItem[];
}

interface NotaDeEncargoSettings {
  ownerType: 'single' | 'multi' | null;
  exclusivityType: 'exclusive-agent' | 'exclusive-agency' | 'non-exclusive' | null;
}

interface EditDocumentsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentDocuments: { name: string; type: string }[];
  onSave: (documents: { name: string; type: string }[]) => void;
}

const ownerTypeOptions = [
  { value: 'single', label: 'Single owner', description: 'A client with one property for sale or rent' },
  { value: 'multi', label: 'Multi-owner', description: 'A client with more than one property for sale or rent' },
];

const exclusivityTypeOptions = [
  { value: 'exclusive-agent', label: 'Exclusive to agent', description: 'Huspy is the only party (agency and owner) who can sell/publish the property' },
  { value: 'exclusive-agency', label: 'Exclusive agency agreement', description: 'Huspy is the only agency that can sell/publish, but the owner can also sell independently' },
  { value: 'non-exclusive', label: 'Non-exclusive', description: 'Both Huspy, the owner, and other agencies can sell/publish the property' },
];

const defaultCategories: DocumentCategory[] = [
  {
    id: "nota-encargo",
    name: "Nota de encargo",
    description: "No nota de encargo yet",
    required: true,
    documents: [],
  },
  {
    id: "landlord",
    name: "Landlord's identification",
    description: "No landlord's identification yet",
    required: false,
    documents: [],
  },
  {
    id: "title-deed",
    name: "Title deed",
    description: "No title deed yet",
    required: false,
    documents: [],
  },
  {
    id: "other",
    name: "Other documents",
    description: "No documents yet",
    required: false,
    documents: [],
  },
];

export function EditDocumentsModal({
  open,
  onOpenChange,
  currentDocuments,
  onSave,
}: EditDocumentsModalProps) {
  const [categories, setCategories] = useState<DocumentCategory[]>(defaultCategories);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [dragOverCategory, setDragOverCategory] = useState<string | null>(null);
  const [notaSettings, setNotaSettings] = useState<NotaDeEncargoSettings>({
    ownerType: null,
    exclusivityType: null,
  });
  const [previewDocument, setPreviewDocument] = useState<DocumentItem | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Initialize categories with current documents
  useEffect(() => {
    if (open) {
      const updatedCategories = defaultCategories.map(category => {
        const categoryDocs = currentDocuments
          .filter(doc => {
            if (category.id === "nota-encargo") return doc.name.toLowerCase().includes("nota") || doc.name.toLowerCase().includes("encargo");
            if (category.id === "title-deed") return doc.name.toLowerCase().includes("floor") || doc.name.toLowerCase().includes("deed");
            if (category.id === "landlord") return doc.name.toLowerCase().includes("id") || doc.name.toLowerCase().includes("landlord");
            return category.id === "other";
          })
          .map((doc, idx) => ({
            id: `${category.id}-${idx}`,
            name: doc.name,
            type: doc.type,
            uploadProgress: 100,
            isUploading: false,
          }));
        
        return {
          ...category,
          documents: categoryDocs,
        };
      });
      setCategories(updatedCategories);
      // Reset nota settings on open (could be loaded from props in real app)
      setNotaSettings({ ownerType: 'single', exclusivityType: 'exclusive-agent' });
    }
  }, [open, currentDocuments]);

  // Simulate upload progress for a document
  const simulateUpload = (categoryId: string, docId: string) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 25 + 10;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setCategories(prev => prev.map(cat => {
          if (cat.id === categoryId) {
            return {
              ...cat,
              documents: cat.documents.map(doc => 
                doc.id === docId 
                  ? { ...doc, uploadProgress: 100, isUploading: false }
                  : doc
              ),
            };
          }
          return cat;
        }));
      } else {
        setCategories(prev => prev.map(cat => {
          if (cat.id === categoryId) {
            return {
              ...cat,
              documents: cat.documents.map(doc => 
                doc.id === docId 
                  ? { ...doc, uploadProgress: Math.min(progress, 95) }
                  : doc
              ),
            };
          }
          return cat;
        }));
      }
    }, 200);
  };

  const addFilesToCategory = (categoryId: string, files: FileList | File[]) => {
    const fileArray = Array.from(files);
    
    const newDocs: DocumentItem[] = fileArray.map((file, idx) => ({
      id: `${categoryId}-${Date.now()}-${idx}`,
      name: file.name,
      type: file.name.split('.').pop()?.toLowerCase() || 'file',
      size: file.size,
      uploadProgress: 0,
      isUploading: true,
    }));

    setCategories(prev => prev.map(cat => {
      if (cat.id === categoryId) {
        const updatedDocs = [...cat.documents, ...newDocs];
        return {
          ...cat,
          documents: updatedDocs,
        };
      }
      return cat;
    }));

    // Start simulated upload for each new document
    newDocs.forEach(doc => {
      simulateUpload(categoryId, doc.id);
    });
  };

  const handleFileInput = (categoryId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      addFilesToCategory(categoryId, files);
    }
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent, categoryId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverCategory(categoryId);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverCategory(null);
  };

  const handleDrop = (e: React.DragEvent, categoryId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverCategory(null);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      addFilesToCategory(categoryId, files);
    }
  };

  const handleRemoveDocument = async (categoryId: string, docId: string) => {
    // Set deleting state
    setCategories(prev => prev.map(cat => {
      if (cat.id === categoryId) {
        return {
          ...cat,
          documents: cat.documents.map(doc => 
            doc.id === docId ? { ...doc, isDeleting: true } : doc
          ),
        };
      }
      return cat;
    }));

    // Simulate API call for deletion
    await new Promise(resolve => setTimeout(resolve, 800));

    // Remove document after API call
    setCategories(prev => prev.map(cat => {
      if (cat.id === categoryId) {
        const updatedDocs = cat.documents.filter(d => d.id !== docId);
        return {
          ...cat,
          documents: updatedDocs,
        };
      }
      return cat;
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const allDocuments = categories.flatMap(cat => 
      cat.documents
        .filter(doc => !doc.isUploading)
        .map(doc => ({ name: doc.name, type: doc.type }))
    );
    
    onSave(allDocuments);
    setIsSaving(false);
    onOpenChange(false);
  };

  const handleClose = () => {
    if (!isSaving) {
      onOpenChange(false);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handlePreview = (doc: DocumentItem) => {
    setPreviewDocument(doc);
  };

  const handleDownload = (doc: DocumentItem) => {
    // In a real app, this would trigger an actual download
    // For now, we'll create a mock download
    if (doc.url) {
      const link = document.createElement('a');
      link.href = doc.url;
      link.download = doc.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // Mock download - create a blob with dummy content
      const blob = new Blob(['Document content'], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = doc.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  const hasUploadingFiles = categories.some(cat => 
    cat.documents.some(doc => doc.isUploading)
  );

  const getCategoryDescription = (category: DocumentCategory) => {
    if (category.id === 'nota-encargo') {
      const docCount = category.documents.length;
      const ownerLabel = notaSettings.ownerType 
        ? ownerTypeOptions.find(o => o.value === notaSettings.ownerType)?.label.toLowerCase()
        : null;
      const exclusivityLabel = notaSettings.exclusivityType
        ? exclusivityTypeOptions.find(e => e.value === notaSettings.exclusivityType)?.label.toLowerCase()
        : null;
      
      if (docCount > 0 && ownerLabel && exclusivityLabel) {
        return `Owner and exclusivity: ${ownerLabel}, ${exclusivityLabel}`;
      }
      if (docCount > 0) {
        return `${docCount} document${docCount > 1 ? 's' : ''}`;
      }
      return category.description;
    }
    
    const docCount = category.documents.length;
    if (docCount > 0) {
      return `${docCount} document${docCount > 1 ? 's' : ''}`;
    }
    return category.description;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent hideCloseButton className="sm:max-w-lg p-0 max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="pl-6 pr-6 pt-6 pb-2 shrink-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <DialogTitle className="text-xl font-semibold">Documents</DialogTitle>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="rounded-full gap-1.5"
                    onClick={() => window.open('https://drive.google.com/drive/folders/1WFv8E0rXH5jQ47N3REGMzoX4ClN8HybX?usp=drive_link', '_blank')}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Templates
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={handleClose}
                    disabled={isSaving}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Items marked with the red asterisk (<span className="text-destructive">*</span>) are mandatory
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 pb-6">
          <div className="space-y-2 pt-4">
            {categories.map((category) => (
              <Collapsible
                key={category.id}
                open={expandedCategory === category.id}
                onOpenChange={(isOpen) => setExpandedCategory(isOpen ? category.id : null)}
              >
                <CollapsibleTrigger asChild>
                  <button
                    type="button"
                    className="w-full flex items-center justify-between p-4 rounded-xl border border-border hover:bg-muted/50 transition-colors text-left"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">
                        {category.name}
                        {category.required && <span className="text-destructive ml-0.5">*</span>}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        {getCategoryDescription(category)}
                      </p>
                    </div>
                    <ChevronDown 
                      className={cn(
                        "w-5 h-5 text-muted-foreground transition-transform shrink-0 ml-2",
                        expandedCategory === category.id && "rotate-180"
                      )}
                    />
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-2">
                  <div className="space-y-3 pl-2">
                    {/* Owner type and Exclusivity type selectors for Nota de encargo */}
                    {category.id === 'nota-encargo' && (
                      <div className="space-y-3 pb-2">
                        <FloatingLabelSelect
                          label="Owner type"
                          required
                          value={notaSettings.ownerType || ''}
                          onValueChange={(value) => setNotaSettings(prev => ({ 
                            ...prev, 
                            ownerType: value as 'single' | 'multi' 
                          }))}
                          options={ownerTypeOptions.map(o => ({ value: o.value, label: o.label }))}
                        />
                        
                        <FloatingLabelSelect
                          label="Exclusivity type"
                          required
                          value={notaSettings.exclusivityType || ''}
                          onValueChange={(value) => setNotaSettings(prev => ({ 
                            ...prev, 
                            exclusivityType: value as 'exclusive-agent' | 'exclusive-agency' | 'non-exclusive' 
                          }))}
                          options={exclusivityTypeOptions.map(o => ({ value: o.value, label: o.label }))}
                        />
                      </div>
                    )}

                    {/* Existing documents */}
                    {category.documents.map((doc) => (
                      <div 
                        key={doc.id}
                        className={cn(
                          "flex items-center justify-between p-3 rounded-lg border border-border transition-all",
                          doc.isDeleting ? "opacity-50 bg-destructive/5" : "bg-muted/50"
                        )}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-10 h-10 rounded-lg bg-background border border-border flex items-center justify-center shrink-0">
                            {doc.isUploading ? (
                              <Loader2 className="w-5 h-5 text-primary animate-spin" />
                            ) : ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(doc.type.toLowerCase()) ? (
                              <ImageIcon className="w-5 h-5 text-muted-foreground" />
                            ) : (
                              <FileText className="w-5 h-5 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{doc.name}</p>
                            {doc.isUploading ? (
                              <div className="flex items-center gap-2 mt-1">
                                <Progress value={doc.uploadProgress} className="h-1.5 flex-1" />
                                <span className="text-xs text-muted-foreground shrink-0">
                                  {Math.round(doc.uploadProgress || 0)}%
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5">
                                <CheckCircle2 className="w-3 h-3 text-green-500" />
                                <p className="text-xs text-muted-foreground uppercase">
                                  {doc.type}
                                  {doc.size && <span className="ml-2 normal-case">{formatFileSize(doc.size)}</span>}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {!doc.isUploading && !doc.isDeleting && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                onClick={() => handlePreview(doc)}
                                title="Preview"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                onClick={() => handleDownload(doc)}
                                title="Download"
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => handleRemoveDocument(category.id, doc.id)}
                            disabled={doc.isUploading || doc.isDeleting}
                          >
                            {doc.isDeleting ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    ))}
                    
                    {/* Drop zone */}
                    <div
                      onDragOver={(e) => handleDragOver(e, category.id)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, category.id)}
                      onClick={() => fileInputRefs.current[category.id]?.click()}
                      className={cn(
                        "w-full border-2 border-dashed rounded-xl p-6 transition-all cursor-pointer",
                        "flex flex-col items-center justify-center gap-2 text-center",
                        "hover:border-primary/50 hover:bg-muted/30",
                        dragOverCategory === category.id 
                          ? "border-primary bg-primary/5" 
                          : "border-border"
                      )}
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                        dragOverCategory === category.id 
                          ? "bg-primary/10 text-primary" 
                          : "bg-muted text-muted-foreground"
                      )}>
                        <Upload className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {dragOverCategory === category.id 
                            ? "Drop files here" 
                            : "Drag & drop files here"
                          }
                        </p>
                        <p className="text-xs text-muted-foreground">
                          or <span className="text-primary hover:underline">browse</span> to upload (max 25MB)
                        </p>
                      </div>
                      <input
                        ref={(el) => { fileInputRefs.current[category.id] = el; }}
                        type="file"
                        multiple
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp"
                        className="hidden"
                        onChange={(e) => handleFileInput(category.id, e)}
                      />
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 pt-2 shrink-0">
          <Button 
            className="w-full h-14 text-base font-medium rounded-xl"
            onClick={handleSave}
            disabled={isSaving || hasUploadingFiles}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : hasUploadingFiles ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading files...
              </>
            ) : (
              "Save changes"
            )}
          </Button>
        </div>
      </DialogContent>

      {/* Document Preview Modal */}
      <DocumentPreviewModal
        open={!!previewDocument}
        onOpenChange={(open) => !open && setPreviewDocument(null)}
        document={previewDocument}
        onDownload={() => previewDocument && handleDownload(previewDocument)}
      />
    </Dialog>
  );
}
