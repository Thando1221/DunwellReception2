import React, { useEffect, useState } from "react";
import {
  getPendingQueueCount,
  isDeviceOnline,
  syncPendingQueue,
  getOfflineQueue,
  QueueItem,
} from "@/lib/offlineSync";
import { Wifi, WifiOff, RefreshCw, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export const SyncStatusBadge: React.FC = () => {
  const [online, setOnline] = useState(isDeviceOnline());
  const [pendingCount, setPendingCount] = useState(getPendingQueueCount());
  const [isSyncing, setIsSyncing] = useState(false);
  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    const updateQueue = () => {
      setPendingCount(getPendingQueueCount());
      setQueueItems(getOfflineQueue());
    };

    const handleSyncStatus = (e: any) => {
      setIsSyncing(!!e.detail?.isSyncing);
      updateQueue();
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("dunwell_queue_changed", updateQueue);
    window.addEventListener("dunwell_sync_status", handleSyncStatus);
    window.addEventListener("dunwell_data_updated", updateQueue);
    window.addEventListener("dunwell_data_synced", updateQueue);

    updateQueue();

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("dunwell_queue_changed", updateQueue);
      window.removeEventListener("dunwell_sync_status", handleSyncStatus);
      window.removeEventListener("dunwell_data_updated", updateQueue);
      window.removeEventListener("dunwell_data_synced", updateQueue);
    };
  }, []);

  const handleManualSync = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!online || isSyncing) return;
    await syncPendingQueue();
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all shadow-sm border ${
            !online
              ? "bg-amber-950/40 text-amber-300 border-amber-500/40 hover:bg-amber-900/50"
              : pendingCount > 0
              ? "bg-cyan-950/40 text-cyan-300 border-cyan-500/40 hover:bg-cyan-900/50"
              : "bg-emerald-950/30 text-emerald-300 border-emerald-500/30 hover:bg-emerald-900/40"
          }`}
          title="Click to view offline synchronization status"
        >
          {/* Status icon with pulse */}
          <span className="relative flex h-2 w-2">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                !online ? "bg-amber-400" : pendingCount > 0 ? "bg-cyan-400" : "bg-emerald-400"
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                !online ? "bg-amber-500" : pendingCount > 0 ? "bg-cyan-400" : "bg-emerald-500"
              }`}
            />
          </span>

          {!online ? (
            <span className="flex items-center gap-1">
              <WifiOff className="w-3.5 h-3.5 text-amber-400" />
              <span>Offline Mode</span>
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <Wifi className="w-3.5 h-3.5 text-emerald-400" />
              <span>Online</span>
            </span>
          )}

          {pendingCount > 0 && (
            <span className="ml-1 px-1.5 py-0.2 rounded-full bg-cyan-500/30 text-cyan-200 text-[11px] font-semibold">
              {pendingCount} queued
            </span>
          )}

          {isSyncing && (
            <RefreshCw className="w-3 h-3 text-cyan-300 animate-spin ml-1" />
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        className="w-80 p-4 bg-[#0D1E30] border border-gray-700/60 text-gray-200 shadow-2xl rounded-xl text-xs"
      >
        <div className="flex items-center justify-between pb-3 border-b border-gray-700/50">
          <div>
            <h4 className="font-semibold text-sm text-white flex items-center gap-1.5">
              {online ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Database Connected
                </>
              ) : (
                <>
                  <WifiOff className="w-4 h-4 text-amber-400" />
                  Working Offline
                </>
              )}
            </h4>
            <p className="text-gray-400 text-[11px] mt-0.5">
              {online
                ? "Changes sync directly to the database."
                : "All added patients & bookings are saved locally."}
            </p>
          </div>

          {online && pendingCount > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleManualSync}
              disabled={isSyncing}
              className="h-7 text-xs border-cyan-500/50 text-cyan-300 hover:bg-cyan-900/40"
            >
              <RefreshCw className={`w-3 h-3 mr-1 ${isSyncing ? "animate-spin" : ""}`} />
              Sync Now
            </Button>
          )}
        </div>

        <div className="pt-3">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-gray-300">Pending Sync Queue</span>
            <span className="text-gray-400 font-mono text-[11px]">{pendingCount} items</span>
          </div>

          {pendingCount === 0 ? (
            <div className="py-4 text-center text-gray-400 text-[11px]">
              <CheckCircle2 className="w-6 h-6 text-emerald-400/70 mx-auto mb-1" />
              All data is up to date with the database.
            </div>
          ) : (
            <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
              {queueItems.map((item) => (
                <div
                  key={item.id}
                  className="p-2 rounded bg-slate-800/70 border border-slate-700/50 flex items-start gap-2"
                >
                  <Clock className="w-3.5 h-3.5 text-cyan-400 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white truncate">
                      {item.type === "ADD_PATIENT"
                        ? `Patient: ${item.data.name} ${item.data.surname}`
                        : `Booking: ${item.data.ServiceName || "Appointment"}`}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      Saved {new Date(item.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 shrink-0">
                    Pending
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
