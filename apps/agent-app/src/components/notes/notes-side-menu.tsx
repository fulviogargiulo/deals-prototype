import { useState, forwardRef, useImperativeHandle, useRef, useEffect } from "react";
import { Plus, X, Trash2, Pencil, StickyNote } from "lucide-react";
import { format, isToday, isSameWeek } from "date-fns";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AnimatePresence, motion } from "framer-motion";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Note } from "@/types/notes";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useDevTools } from "@/contexts/dev-tools-context";

export interface NotesSideMenuHandle {
  open: () => void;
}

interface NotesSideMenuProps {
  opportunityId: string;
}

// Mock notes data
const generateMockNotes = (opportunityId: string): Note[] => [
  {
    id: "note-1",
    content: "Client prefers clear communication before visits and appreciates receiving updates on potential new properties in advance.",
    opportunityId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: "you",
  },
  {
    id: "note-2",
    content: "Client has 3 kids. Schools nearby desirable.",
    opportunityId,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago (Thursday)
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    createdBy: "you",
  },
  {
    id: "note-3",
    content: "Share 3 more properties from different opportunity",
    opportunityId,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago (Monday)
    updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    createdBy: "you",
  },
];

export const NotesSideMenu = forwardRef<NotesSideMenuHandle, NotesSideMenuProps>(
  function NotesSideMenu({ opportunityId }, ref) {
    const { forceNotesEmpty } = useDevTools();
    const [isOpen, setIsOpen] = useState(false);
    const [notes, setNotes] = useState<Note[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isAddingNote, setIsAddingNote] = useState(false);
    const [newNoteContent, setNewNoteContent] = useState("");
    const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
    const [editingContent, setEditingContent] = useState("");
    const [deleteConfirmNoteId, setDeleteConfirmNoteId] = useState<string | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const editTextareaRef = useRef<HTMLTextAreaElement>(null);

    // Expose open method via ref
    useImperativeHandle(ref, () => ({
      open: () => {
        setIsOpen(true);
      },
    }));

    // Load notes when sheet opens
    useEffect(() => {
      if (isOpen) {
        setIsLoading(true);
        // Simulate API call
        setTimeout(() => {
          setNotes(generateMockNotes(opportunityId));
          setIsLoading(false);
        }, 500);
      } else {
        // Reset state when closing
        setIsAddingNote(false);
        setNewNoteContent("");
        setEditingNoteId(null);
        setEditingContent("");
      }
    }, [isOpen, opportunityId]);

    // Focus textarea when adding note
    useEffect(() => {
      if (isAddingNote) {
        // Small delay to ensure the textarea is rendered after animation starts
        const timer = setTimeout(() => {
          textareaRef.current?.focus();
        }, 50);
        return () => clearTimeout(timer);
      }
    }, [isAddingNote]);

    // Focus textarea when editing
    useEffect(() => {
      if (editingNoteId && editTextareaRef.current) {
        editTextareaRef.current.focus();
        // Move cursor to end
        editTextareaRef.current.setSelectionRange(
          editTextareaRef.current.value.length,
          editTextareaRef.current.value.length
        );
      }
    }, [editingNoteId]);

    const handleAddNote = () => {
      if (!newNoteContent.trim()) return;
      
      const newNote: Note = {
        id: `note-${Date.now()}`,
        content: newNoteContent.trim(),
        opportunityId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: "you",
      };
      
      setNotes((prev) => [newNote, ...prev]);
      setNewNoteContent("");
      setIsAddingNote(false);
    };

    const handleEditNote = (noteId: string) => {
      const note = notes.find((n) => n.id === noteId);
      if (note) {
        setEditingNoteId(noteId);
        setEditingContent(note.content);
      }
    };

    const handleSaveEdit = () => {
      if (!editingNoteId || !editingContent.trim()) return;
      
      setNotes((prev) =>
        prev.map((note) =>
          note.id === editingNoteId
            ? { ...note, content: editingContent.trim(), updatedAt: new Date().toISOString() }
            : note
        )
      );
      setEditingNoteId(null);
      setEditingContent("");
    };

    const handleCancelEdit = () => {
      setEditingNoteId(null);
      setEditingContent("");
    };

    const handleDeleteNote = (noteId: string) => {
      setDeleteConfirmNoteId(noteId);
    };

    const confirmDelete = () => {
      if (deleteConfirmNoteId) {
        setNotes((prev) => prev.filter((note) => note.id !== deleteConfirmNoteId));
        setDeleteConfirmNoteId(null);
      }
    };

    const getTimeLabel = (dateString: string): string => {
      const date = new Date(dateString);
      const now = new Date();
      
      // Within the day: show time (9:41 AM)
      if (isToday(date)) {
        return format(date, "h:mm a");
      }
      
      // Within the week: show weekday (Monday)
      if (isSameWeek(date, now, { weekStartsOn: 1 })) {
        return format(date, "EEEE");
      }
      
      // More than a week: show date (14 Feb 2025)
      return format(date, "d MMM yyyy");
    };

    return (
      <>
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetContent className="w-full sm:max-w-md flex flex-col overflow-hidden p-0" hideDefaultClose>
            {/* Fixed Header */}
            <div className="px-6 pt-6 shrink-0">
              {/* Header row: X left, title center, + right */}
              <div className="flex items-center justify-between mb-4">
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="h-10 w-10 rounded-full"
                >
                  <X className="h-5 w-5" />
                </Button>
                <SheetTitle className="text-2xl font-semibold leading-heading">Notes</SheetTitle>
                <AnimatePresence mode="wait">
                  {!isAddingNote ? (
                    <motion.div
                      key="plus-button"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.15 }}
                    >
                      <Button
                        variant="secondary"
                        size="icon"
                        onClick={() => setIsAddingNote(true)}
                        className="h-10 w-10 rounded-full"
                      >
                        <Plus className="h-5 w-5" />
                      </Button>
                    </motion.div>
                  ) : (
                    <div className="w-10" /> 
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto pb-6">
              <div className="px-6">
                {/* Content states */}
                <AnimatePresence mode="wait">
                  {isLoading ? (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <NotesLoadingSkeleton />
                    </motion.div>
                  ) : (notes.length === 0 || forceNotesEmpty) && !isAddingNote ? (
                    <motion.div
                      key="empty-state"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <NotesEmptyState onAddNote={() => setIsAddingNote(true)} />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="notes-content"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="space-y-3">
                        {/* Add note form - appears above the list */}
                        <AnimatePresence>
                          {isAddingNote && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="space-y-3 pb-3">
                                <Textarea
                                  ref={textareaRef}
                                  value={newNoteContent}
                                  onChange={(e) => setNewNoteContent(e.target.value)}
                                  placeholder="Write a note..."
                                  className="min-h-[120px] resize-none rounded-xl border-border bg-card focus:border-foreground focus:ring-0 focus:ring-offset-0 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none"
                                />
                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    onClick={() => {
                                      setIsAddingNote(false);
                                      setNewNoteContent("");
                                    }}
                                    className="flex-1"
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    onClick={handleAddNote}
                                    disabled={!newNoteContent.trim()}
                                    className="flex-1"
                                  >
                                    Add note
                                  </Button>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Notes list */}
                        <AnimatePresence mode="popLayout">
                          {notes.map((note) => (
                            <NoteCard
                              key={note.id}
                              note={note}
                              isEditing={editingNoteId === note.id}
                              editingContent={editingContent}
                              onEditingContentChange={setEditingContent}
                              onEdit={() => handleEditNote(note.id)}
                              onSaveEdit={handleSaveEdit}
                              onCancelEdit={handleCancelEdit}
                              onDelete={() => handleDeleteNote(note.id)}
                              getTimeLabel={getTimeLabel}
                              editTextareaRef={editTextareaRef}
                            />
                          ))}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deleteConfirmNoteId} onOpenChange={(open) => !open && setDeleteConfirmNoteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete note</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this note? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }
);

interface NoteCardProps {
  note: Note;
  isEditing: boolean;
  editingContent: string;
  onEditingContentChange: (content: string) => void;
  onEdit: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onDelete: () => void;
  getTimeLabel: (dateString: string) => string;
  editTextareaRef: React.RefObject<HTMLTextAreaElement>;
}

function NoteCard({
  note,
  isEditing,
  editingContent,
  onEditingContentChange,
  onEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
  getTimeLabel,
  editTextareaRef,
}: NoteCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="bg-card rounded-2xl p-4 group"
    >
      {isEditing ? (
        <div className="space-y-3">
          <Textarea
            ref={editTextareaRef}
            value={editingContent}
            onChange={(e) => onEditingContentChange(e.target.value)}
            className="min-h-[100px] resize-none rounded-xl border-border bg-background focus:border-foreground focus:ring-0 focus:ring-offset-0 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none"
          />
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onCancelEdit}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={onSaveEdit}
              disabled={!editingContent.trim()}
              className="flex-1"
            >
              Save
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* Note content - full width */}
          <p className="text-base font-normal leading-body text-foreground">
            {note.content}
          </p>
          
          {/* Metadata row with action buttons */}
          <div className="flex items-center justify-between mt-2">
            <p className="text-sm leading-body text-muted-foreground">
              {getTimeLabel(note.createdAt)} · Added by {note.createdBy}
            </p>

            {/* Action buttons - visible on hover, same level as timestamp */}
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="icon"
                onClick={onEdit}
                className="h-6 w-6 rounded-full hover:bg-muted"
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onDelete}
                className="h-6 w-6 rounded-full hover:bg-muted text-destructive hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
}

function NotesLoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-card rounded-2xl p-4 space-y-2">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/3 mt-2" />
        </div>
      ))}
    </div>
  );
}

interface NotesEmptyStateProps {
  onAddNote: () => void;
}

function NotesEmptyState({ onAddNote }: NotesEmptyStateProps) {
  return (
    <button
      onClick={onAddNote}
      className="w-full rounded-2xl border-2 border-dashed border-border bg-[hsl(0_0%_0%/0.02)] py-10 px-6 flex flex-col items-center justify-center text-center hover:border-muted-foreground/50 transition-colors cursor-pointer"
    >
      <div className="w-12 h-12 rounded-xl bg-surface-raised flex items-center justify-center mb-4">
        <StickyNote className="w-6 h-6 text-muted-foreground" />
      </div>
      <h3 className="text-base font-semibold leading-heading text-foreground mb-1">Add notes</h3>
      <p className="text-sm font-normal leading-body text-muted-foreground max-w-[240px]">
        Capture key details, ideas, and learnings about this opportunity in one place.
      </p>
    </button>
  );
}
