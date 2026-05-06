import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import emptyPropertiesVideo from "@/assets/empty-properties-video.gif";

interface EmptyMyPropertiesStateProps {
  onAddProperty: () => void;
}

export function EmptyMyPropertiesState({ onAddProperty }: EmptyMyPropertiesStateProps) {
  return (
    <div className="flex items-center justify-center py-4">
      <div className="relative w-full max-w-3xl overflow-hidden rounded-3xl">
        {/* Video/GIF Background - taller aspect ratio to showcase more video */}
        <div className="relative aspect-[3/4] md:aspect-[4/5] lg:aspect-[1/1]">
          <img
            src={emptyPropertiesVideo}
            alt="Luxury property interior"
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>
        
        {/* Content Card - Positioned at bottom with blur effect */}
        <div className="absolute bottom-4 left-4 right-4 md:bottom-6 md:left-6 md:right-6">
          <div className="bg-black/70 backdrop-blur-xl rounded-2xl p-5 md:p-6 space-y-4">
            <div className="space-y-1">
              <h2 className="text-xl md:text-2xl font-bold text-white">
                Your next sale starts here
              </h2>
              <p className="text-sm md:text-base text-white/70">
                Add your first property and reach potential buyers in minutes
              </p>
            </div>

            <Button
              onClick={onAddProperty}
              size="lg"
              className="w-full bg-white text-black hover:bg-white/90"
            >
              Add new property
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
