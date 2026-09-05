import React, { useState } from "react";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { Download, Smartphone, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export const PWAInstallButton: React.FC<{ className?: string }> = ({ className = "" }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed PWA, hide the button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <Button
        onClick={install}
        size="sm"
        className={`bg-cyan-600 hover:bg-cyan-500 text-white font-medium shadow-md gap-2 ${className}`}
        data-testid="pwa-install-button"
      >
        <Download className="w-4 h-4" />
        <span>Install App</span>
      </Button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <Button
          onClick={() => setShowIOSGuide(true)}
          variant="outline"
          size="sm"
          className={`border-cyan-500/50 text-cyan-300 hover:bg-cyan-950/40 gap-1.5 text-xs ${className}`}
        >
          <Smartphone className="w-3.5 h-3.5" />
          Install on iOS
        </Button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-sm rounded-xl bg-[#0F2236] border border-cyan-800/40 p-6 shadow-2xl text-white">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-cyan-200 flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-cyan-400" />
                  Install on iPhone / iPad
                </h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-gray-300 space-y-2">
                1. Tap the <strong className="text-white">Share</strong> button (box with upward arrow) in Safari's toolbar.<br />
                2. Scroll down and tap <strong className="text-cyan-300">Add to Home Screen</strong>.<br />
                3. Open Dunwell directly from your home screen anytime, even offline!
              </p>
              <Button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full bg-cyan-600 hover:bg-cyan-500 text-white font-medium"
              >
                Got It
              </Button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
