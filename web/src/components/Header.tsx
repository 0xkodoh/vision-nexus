"use client";

import React, { useState, useEffect } from "react";
import { 
  Activity, 
  Cpu, 
  Cloud, 
  Radio, 
  Settings, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle,
  Zap,
  Server
} from "lucide-react";
import { EngineHealth } from "@/types/inspection";

interface HeaderProps {
  engineHealth: EngineHealth;
  apiBase: string;
  onUpdateApiBase: (url: string) => void;
  onRefreshHealth: () => void;
  isStreaming: boolean;
  fps: number;
}

export const Header: React.FC<HeaderProps> = ({
  engineHealth,
  apiBase,
  onUpdateApiBase,
  onRefreshHealth,
  isStreaming,
  fps,
}) => {
  const [showConfig, setShowConfig] = useState(false);
  const [inputUrl, setInputUrl] = useState(apiBase);
  const [currentTime, setCurrentTime] = useState<string>("");

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      setCurrentTime(now.toTimeString().split(" ")[0] + "." + String(now.getMilliseconds()).padStart(3, "0"));
    };
    updateTimer();
    const interval = setInterval(updateTimer, 100);
    return () => clearInterval(interval);
  }, []);

  const handleSaveApi = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateApiBase(inputUrl.trim());
    setShowConfig(false);
  };

  const isConnected = engineHealth.status === "healthy";

  return (
    <header className="border-b border-industrial-750 bg-industrial-900/90 backdrop-blur-md sticky top-0 z-40 px-4 lg:px-6 py-3">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Left Branding */}
        <div className="flex items-center space-x-4">
          <div className="relative flex items-center h-8">
            <img src="/Logos/logo-white-2.svg" alt="Vision Nexus Logo" className="h-full w-auto object-contain" />
            <div className="absolute -top-1 -right-2 w-2 h-2 rounded-full bg-cyan-400 animate-ping opacity-75" />
          </div>
          <div className="flex flex-col justify-center space-y-0.5">
            {/* HIDDEN: Preserved for potential future use */}
            <span className="hidden font-mono font-black tracking-wider text-base lg:text-lg text-slate-100 uppercase">
              VISION<span className="text-cyan-400">·</span>NEXUS
            </span>
            
            <div className="flex items-center space-x-2">
              <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold uppercase rounded bg-cyan-950/80 text-cyan-400 border border-cyan-500/30">
                OPENCV 5 AOI
              </span>
              <span className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono uppercase rounded bg-industrial-800 text-amber-400 border border-amber-500/30">
                AWS S3 HYBRID
              </span>
            </div>
            <p className="hidden md:block text-[11px] font-mono text-slate-400 tracking-tight">
              Low-Latency Industrial Defect Inspection Architecture
            </p>
          </div>
        </div>

        {/* Center Live Telemetry Gauges */}
        <div className="hidden md:flex items-center space-x-4 bg-industrial-950/80 px-3 py-1.5 rounded-lg border border-industrial-800 font-mono text-xs">
          <div className="flex items-center space-x-2">
            <Radio className={`w-3.5 h-3.5 ${isStreaming ? "text-signal-pass animate-pulse" : "text-slate-500"}`} />
            <span className="text-slate-400 uppercase text-[10px] tracking-wider">LINE:</span>
            <span className={`font-bold ${isStreaming ? "text-signal-pass-glow" : "text-slate-300"}`}>
              {isStreaming ? "ACQUISITION ACTIVE" : "IDLE / MANUAL"}
            </span>
          </div>

          <div className="w-px h-4 bg-industrial-750" />

          <div className="flex items-center space-x-2">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400 uppercase text-[10px] tracking-wider">FPS:</span>
            <span className="font-bold text-cyan-300 tabular-nums">
              {fps.toFixed(1)}
            </span>
          </div>

          <div className="w-px h-4 bg-industrial-750" />

          <div className="flex items-center space-x-2">
            <span className="text-slate-400 uppercase text-[10px] tracking-wider">TIME (UTC+1):</span>
            <span className="text-slate-200 tabular-nums text-[11px]">
              {currentTime || "00:00:00.000"}
            </span>
          </div>
        </div>

        {/* Right Status Nodes & Controls */}
        <div className="flex items-center space-x-3">
          {/* OpenCV Backend Node */}
          <div 
            onClick={onRefreshHealth}
            className={`cursor-pointer group flex items-center space-x-2 px-2.5 py-1 rounded-md border text-xs font-mono transition-all ${
              isConnected
                ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300 hover:border-emerald-400"
                : "bg-red-950/40 border-red-500/40 text-red-300 hover:border-red-400"
            }`}
            title="Click to re-check FastAPI Engine health"
          >
            <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-signal-pass shadow-[0_0_8px_#10b981]" : "bg-signal-alarm animate-pulse"}`} />
            <div className="flex flex-col text-left">
              <span className="text-[9px] uppercase tracking-wider text-slate-400 leading-none">FastAPI / CV5</span>
              <span className="font-semibold text-[11px] leading-tight">
                {isConnected ? `v${engineHealth.opencv_version}` : "OFFLINE"}
              </span>
            </div>
            <RefreshCw className="w-3 h-3 text-slate-400 group-hover:rotate-180 transition-transform duration-300 ml-1" />
          </div>

          {/* AWS S3 Node */}
          <div className="hidden lg:flex items-center space-x-2 px-2.5 py-1 rounded-md border border-amber-500/30 bg-amber-950/30 text-amber-300 text-xs font-mono">
            <Cloud className="w-3.5 h-3.5 text-signal-aws" />
            <div className="flex flex-col text-left">
              <span className="text-[9px] uppercase tracking-wider text-amber-400/80 leading-none">AWS S3</span>
              <span className="font-semibold text-[11px] leading-tight text-amber-200">
                {engineHealth.aws_region || "us-east-1"}
              </span>
            </div>
          </div>

          {/* Settings / Config Button */}
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="p-2 rounded-md bg-industrial-800 border border-industrial-700 text-slate-300 hover:text-cyan-300 hover:border-cyan-500/40 transition-colors"
            title="Configure FastAPI Engine URL"
            aria-label="Engine settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Backend API Configuration Dropdown Panel */}
      {showConfig && (
        <div className="mt-3 p-4 bg-industrial-850 border border-cyan-500/40 rounded-lg shadow-2xl animate-in fade-in slide-in-from-top-2 duration-150">
          <form onSubmit={handleSaveApi} className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex-1 w-full">
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1">
                FastAPI Engine Endpoint URI:
              </label>
              <div className="relative">
                <Server className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  placeholder="http://localhost:8000"
                  className="w-full pl-9 pr-3 py-1.5 bg-industrial-950 border border-industrial-700 rounded text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2 pt-2 sm:pt-4">
              <button
                type="submit"
                className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-mono font-bold text-xs rounded transition-colors"
              >
                Apply URI
              </button>
              <button
                type="button"
                onClick={() => {
                  setInputUrl("http://localhost:8000");
                  onUpdateApiBase("http://localhost:8000");
                  setShowConfig(false);
                }}
                className="px-3 py-1.5 bg-industrial-800 hover:bg-industrial-750 text-slate-300 font-mono text-xs rounded border border-industrial-700 transition-colors"
              >
                Reset Default (:8000)
              </button>
              <button
                type="button"
                onClick={() => setShowConfig(false)}
                className="px-2 py-1.5 text-slate-400 hover:text-slate-200 text-xs font-mono"
              >
                Close
              </button>
            </div>
          </form>
          <div className="mt-2 text-[11px] font-mono text-slate-400 flex items-center space-x-1">
            <Zap className="w-3 h-3 text-cyan-400" />
            <span>Targeting FastAPI `/process-frame`, `/set-reference`, and `/health` endpoints.</span>
          </div>
        </div>
      )}
    </header>
  );
};
