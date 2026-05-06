import { useState, useEffect } from "react";
import { X, ArrowLeft, ArrowRight, Keyboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface KeyboardShortcutsTutorialProps {
  open: boolean;
  onClose: () => void;
  layoutMode?: 'carousel' | 'showcase' | 'table';
}

const getShortcuts = (layoutMode: 'carousel' | 'showcase' | 'table') => [
  { keys: layoutMode === 'showcase' ? ["↑", "↓"] : ["←", "→"], description: "Navigate between matches" },
  { keys: ["Enter"], description: "Toggle preview" },
  { keys: ["D"], description: "Discard current match" },
  { keys: ["S"], description: "Save current match" },
  { keys: ["U", "⌘", "Z"], description: "Undo last action" },
  { keys: ["Esc"], description: "Close preview / exit" },
];

export function KeyboardShortcutsTutorial({ open, onClose, layoutMode = 'carousel' }: KeyboardShortcutsTutorialProps) {
  const shortcuts = getShortcuts(layoutMode);
  const [isVisible, setIsVisible] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    if (open) {
      setIsMounted(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsVisible(true);
        });
      });
    } else {
      setIsVisible(false);
      const timer = setTimeout(() => setIsMounted(false), 300);
      return () => clearTimeout(timer);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!isMounted) return null;

  return (
    <div 
      className={cn(
        "absolute inset-0 z-[60] flex items-center justify-center transition-opacity duration-300",
        isVisible ? "opacity-100" : "opacity-0"
      )}
    >
      {/* Backdrop - consistent with design system (bg-black/50 backdrop-blur-sm) */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Content */}
      <div 
        className={cn(
          "relative z-10 bg-zinc-900 border border-zinc-700 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl",
          "transition-all duration-300",
          isVisible ? "scale-100 translate-y-0" : "scale-95 translate-y-4"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-zinc-800 flex items-center justify-center">
              <Keyboard className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Keyboard Shortcuts</h2>
              <p className="text-sm text-zinc-400">Navigate faster</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Shortcuts list */}
        <div className="space-y-3">
          {shortcuts.map((shortcut, index) => (
            <div 
              key={index}
              className="flex items-center justify-between py-2 px-3 rounded-xl bg-zinc-800/50"
            >
              <span className="text-sm text-zinc-300">{shortcut.description}</span>
              <div className="flex items-center gap-1.5">
                {shortcut.keys.map((key, keyIndex) => (
                  <kbd 
                    key={keyIndex}
                    className="min-w-[28px] h-7 px-2 rounded-md bg-zinc-700 border border-zinc-600 text-white text-xs font-mono flex items-center justify-center"
                  >
                    {key}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        {/* Footer */}
        <div className="mt-6">
          <Button
            className="w-full h-11 bg-white hover:bg-zinc-100 text-black rounded-xl font-medium"
            onClick={onClose}
          >
            Got it
          </Button>
        </div>
      </div>
    </div>
  );
}

interface ShortcutsHintButtonProps {
  onClick: () => void;
}

export function ShortcutsHintButton({ onClick }: ShortcutsHintButtonProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      className="h-8 px-2.5 gap-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
    >
      <Keyboard className="h-4 w-4" />
      <span className="text-xs font-medium hidden sm:inline">Shortcuts</span>
    </Button>
  );
}
