import React, { useEffect, useState } from "react";
import { isDeviceOnline, getPendingQueueCount } from "@/lib/offlineSync";
import { WifiOff, AlertCircle } from "lucide-react";

export const OfflineBanner: React.FC = () => {
  const [online, setOnline] = useState(isDeviceOnline());
  const [pendingCount, setPendingCount] = useState(getPendingQueueCount());

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    const updateCount = () => setPendingCount(getPendingQueueCount());

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("dunwell_queue_changed", updateCount);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("dunwell_queue_changed", updateCount);
    };
  }, []);

  if (online && pendingCount === 0) return null;

  if (!online) {
    return (
      <div className="bg-amber-600 text-amber-50 px-4 py-2 text-xs md:text-sm font-medium flex items-center justify-between shadow-md transition-all">
        <div className="flex items-center gap-2 max-w-4xl mx-auto w-full">
          <WifiOff className="w-4 h-4 text-white shrink-0 animate-pulse" />
          <span>
            <strong>Offline Mode Active:</strong> You have no internet connection. You can still view cached records and add new patients or book appointments. Everything is saved locally and will automatically send to the database when reconnected.
          </span>
          {pendingCount > 0 && (
            <span className="ml-auto bg-amber-800/80 px-2 py-0.5 rounded text-xs font-semibold whitespace-nowrap">
              {pendingCount} saved offline
            </span>
          )}
        </div>
      </div>
    );
  }

  // Online with unsynced records
  return (
    <div className="bg-cyan-700 text-cyan-50 px-4 py-1.5 text-xs font-medium flex items-center justify-center gap-2 shadow-sm">
      <AlertCircle className="w-4 h-4 text-cyan-200" />
      <span>
        Reconnected! {pendingCount} offline record{pendingCount > 1 ? "s" : ""} pending database synchronization.
      </span>
    </div>
  );
};
