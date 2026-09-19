"use client";

import React from "react";
import { 
  Terminal, 
  CheckCircle2, 
  AlertTriangle, 
  Cloud, 
  Trash2, 
  Clock, 
  Zap 
} from "lucide-react";
import { InspectionLogItem } from "@/types/inspection";

interface EventTimelineProps {
  logs: InspectionLogItem[];
  onClearLogs: () => void;
}

export const EventTimeline: React.FC<EventTimelineProps> = ({ logs, onClearLogs }) => {
  return (
    <div className="p-4 rounded-xl border border-industrial-750 bg-industrial-900/90 shadow-xl space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-industrial-800 pb-2.5">
        <div className="flex items-center space-x-2">
          <Terminal className="w-4 h-4 text-cyan-400" />
          <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-200">
            REAL-TIME INSPECTION AUDIT TRAIL & EVENT TELEMETRY
          </h3>
        </div>

        <div className="flex items-center space-x-3">
          <span className="text-[10px] font-mono text-slate-400">
            TOTAL LOGGED: <span className="text-cyan-400 font-bold">{logs.length}</span>
          </span>

          {logs.length > 0 && (
            <button
              onClick={onClearLogs}
              className="p-1 hover:bg-industrial-800 rounded text-slate-500 hover:text-red-400 transition-colors flex items-center space-x-1 text-[10px] font-mono"
              title="Clear event log"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Log items feed */}
      <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1 font-mono text-xs">
        {logs.length === 0 ? (
          <div className="py-8 text-center text-slate-600 text-xs">
            Awaiting inspection events... Start stream or select a preset to log frames.
          </div>
        ) : (
          logs.slice(0, 50).map((log) => {
            const isDefect = log.hasDefect;

            return (
              <div
                key={log.id}
                className={`p-2 rounded border flex flex-wrap items-center justify-between gap-2 text-[11px] transition-all ${
                  isDefect
                    ? "bg-red-950/20 border-red-900/40 text-red-200"
                    : "bg-industrial-950/60 border-industrial-800 text-slate-300"
                }`}
              >
                {/* Left info */}
                <div className="flex items-center space-x-2.5">
                  <span className="text-[10px] text-slate-500 tabular-nums">
                    [{log.timestamp}]
                  </span>

                  <span className="font-bold text-slate-200">
                    FRAME #{String(log.frameNumber).padStart(4, "0")}
                  </span>

                  <div className="flex items-center space-x-1">
                    {isDefect ? (
                      <span className="px-1.5 py-0.2 rounded text-[10px] bg-red-900/60 text-red-300 border border-red-500/30 flex items-center space-x-1">
                        <AlertTriangle className="w-2.5 h-2.5 text-red-400" />
                        <span>DEFECT: {log.defectTypes.join(", ")}</span>
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-900/40 text-emerald-300 border border-emerald-500/30 flex items-center space-x-1">
                        <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                        <span>PASS (NOMINAL)</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Right info */}
                <div className="flex items-center space-x-3 text-[10px]">
                  <span className="text-cyan-400 flex items-center space-x-1">
                    <Zap className="w-2.5 h-2.5" />
                    <span>{log.latencyMs.toFixed(1)} ms</span>
                  </span>

                  {log.s3Uploaded && (
                    <span className="px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-500/30 flex items-center space-x-1">
                      <Cloud className="w-2.5 h-2.5 text-amber-400" />
                      <span>S3 SYNCED</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
