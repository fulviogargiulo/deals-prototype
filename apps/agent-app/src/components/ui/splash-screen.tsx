import { useState, useEffect } from "react";
import Lottie from "lottie-react";
import logoAnimation from "@/assets/logo-white-intro.json";
import { SlideShow } from "./slideshow";

interface SplashScreenProps {
  onComplete: () => void;
  minDisplayTime?: number;
}

export function SplashScreen({ onComplete, minDisplayTime = 2500 }: SplashScreenProps) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      // Wait for exit animation to complete before calling onComplete
      setTimeout(onComplete, 500);
    }, minDisplayTime);

    return () => clearTimeout(timer);
  }, [onComplete, minDisplayTime]);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center transition-opacity duration-500 ${
        isExiting ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* Background slideshow */}
      <SlideShow slideDuration={6000} isActive={!isExiting} />
      
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/50 z-10" />
      
      {/* Logo */}
      <div className="w-64 h-32 md:w-80 md:h-40 z-20">
        <Lottie
          animationData={logoAnimation}
          loop={false}
          autoplay={true}
        />
      </div>
    </div>
  );
}
