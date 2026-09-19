"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Header } from "@/components/Header";
import { CameraFeed } from "@/components/CameraFeed";
import { TelemetrySidebar } from "@/components/TelemetrySidebar";
import { AwsSyncStatus } from "@/components/AwsSyncStatus";
import { EventTimeline } from "@/components/EventTimeline";
import { 
  ProcessFrameResponse, 
  EngineHealth, 
  ProductionYieldMetrics, 
  InspectionLogItem 
} from "@/types/inspection";
import { fetchEngineHealth, DEFAULT_API_BASE } from "@/lib/api";
import { 
  ShieldCheck, 
  Cpu, 
  Layers, 
  Zap, 
  CheckCircle2, 
  AlertTriangle,
  Info
} from "lucide-react";

export default function Home() {
  const [apiBase, setApiBase] = useState<string>(DEFAULT_API_BASE);
  const [engineHealth, setEngineHealth] = useState<EngineHealth>({
    status: "connecting",
    opencv_version: "5.0.0-dev",
    aws_region: "us-east-1",
    s3_bucket: "opencv-ai-competition-defects",
  });

  const [currentResult, setCurrentResult] = useState<ProcessFrameResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [syncToS3, setSyncToS3] = useState<boolean>(true);
  
  // Production metrics
  const [metrics, setMetrics] = useState<ProductionYieldMetrics>({
    totalProcessed: 0,
    totalPassed: 0,
    totalDefects: 0,
    yieldRate: 100.0,
    defectTypeCounts: {
      scratch_or_crack: 0,
      pinhole_or_void: 0,
      structural_deformation: 0,
    },
    avgLatencyMs: 3.5,
    minLatencyMs: 2.8,
    maxLatencyMs: 4.8,
  });

  const [latencyHistory, setLatencyHistory] = useState<number[]>([]);
  const [logs, setLogs] = useState<InspectionLogItem[]>([]);
  const [fps, setFps] = useState<number>(0);

  const frameCounterRef = useRef<number>(0);
  const fpsFrameCountRef = useRef<number>(0);
  const lastFpsTimestampRef = useRef<number>(Date.now());

  // Check health of OpenCV engine
  const refreshHealth = useCallback(async () => {
    const health = await fetchEngineHealth(apiBase);
    setEngineHealth(health);
  }, [apiBase]);

  useEffect(() => {
    refreshHealth();
    const interval = setInterval(refreshHealth, 10000);
    return () => clearInterval(interval);
  }, [refreshHealth]);

  // FPS Counter calculation
  useEffect(() => {
    const fpsInterval = setInterval(() => {
      const now = Date.now();
      const deltaSec = (now - lastFpsTimestampRef.current) / 1000;
      if (deltaSec > 0) {
        const calculatedFps = fpsFrameCountRef.current / deltaSec;
        setFps(calculatedFps);
      }
      fpsFrameCountRef.current = 0;
      lastFpsTimestampRef.current = now;
    }, 1000);

    return () => clearInterval(fpsInterval);
  }, []);

  // Handler when OpenCV engine returns frame inspection result
  const handleInspectionResult = useCallback((result: ProcessFrameResponse, sourceName: string) => {
    setCurrentResult(result);
    frameCounterRef.current += 1;
    fpsFrameCountRef.current += 1;

    const currentFrameNumber = frameCounterRef.current;
    const now = new Date();
    const timeString = now.toTimeString().split(" ")[0] + "." + String(now.getMilliseconds()).padStart(3, "0");

    // Extract defect types
    const defectTypes = result.defects.map(d => d.type);

    // Update yield metrics
    setMetrics((prev) => {
      const newTotal = prev.totalProcessed + 1;
      const newDefects = prev.totalDefects + (result.has_defect ? 1 : 0);
      const newPassed = prev.totalPassed + (result.has_defect ? 0 : 1);
      const yieldRate = (newPassed / newTotal) * 100;

      const newTypeCounts = { ...prev.defectTypeCounts };
      result.defects.forEach((d) => {
        if (d.type in newTypeCounts) {
          newTypeCounts[d.type as keyof typeof newTypeCounts] += 1;
        } else if (d.type.includes("scratch") || d.type.includes("crack")) {
          newTypeCounts.scratch_or_crack += 1;
        } else if (d.type.includes("pinhole") || d.type.includes("void")) {
          newTypeCounts.pinhole_or_void += 1;
        } else {
          newTypeCounts.structural_deformation += 1;
        }
      });

      const currentLat = result.latency_ms;
      const newAvg = prev.totalProcessed === 0 
        ? currentLat 
        : (prev.avgLatencyMs * prev.totalProcessed + currentLat) / newTotal;

      return {
        totalProcessed: newTotal,
        totalPassed: newPassed,
        totalDefects: newDefects,
        yieldRate: yieldRate,
        defectTypeCounts: newTypeCounts,
        avgLatencyMs: Number(newAvg.toFixed(2)),
        minLatencyMs: Number(Math.min(prev.minLatencyMs, currentLat).toFixed(2)),
        maxLatencyMs: Number(Math.max(prev.maxLatencyMs, currentLat).toFixed(2)),
      };
    });

    // Update latency sparkline
    setLatencyHistory((prev) => [...prev.slice(-40), result.latency_ms]);

    // Append log event
    setLogs((prev) => [
      {
        id: `${currentFrameNumber}-${Date.now()}`,
        frameNumber: currentFrameNumber,
        timestamp: timeString,
        hasDefect: result.has_defect,
        defectTypes: defectTypes.length > 0 ? defectTypes : ["None (Clean)"],
        latencyMs: result.latency_ms,
        s3Uploaded: result.s3_upload?.success === true,
        s3Key: result.s3_upload?.key,
      },
      ...prev.slice(0, 99),
    ]);
  }, []);

  return (
    <div className="min-h-screen bg-industrial-950 text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-black">
      {/* Top Tactical HUD Header */}
      <Header
        engineHealth={engineHealth}
        apiBase={apiBase}
        onUpdateApiBase={(url) => {
          setApiBase(url);
          refreshHealth();
        }}
        onRefreshHealth={refreshHealth}
        isStreaming={isStreaming}
        fps={fps}
      />

      {/* Main Dashboard Grid Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-6 py-6 space-y-6">
        {/* Top Mission Banner */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg bg-industrial-900/60 border border-industrial-800 text-xs font-mono">
          <div className="flex items-center space-x-2 text-slate-300">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span className="font-bold text-slate-100">SYSTEM PROFILE:</span>
            <span className="text-cyan-300">OpenCV 5 Automated Optical Inspection (AOI)</span>
            <span className="hidden md:inline text-slate-600">|</span>
            <span className="hidden md:inline text-slate-400">Target Line: SMT High-Speed Electronics PCB</span>
          </div>

          <div className="flex items-center space-x-2 text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-300 font-semibold">CLOUD SYNC: ACTIVE</span>
          </div>
        </div>

        {/* 2-Column Responsive Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Optical Camera Feed & Test Specimen Bench (8 cols) */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-6">
            <CameraFeed
              apiBase={apiBase}
              onInspectionResult={handleInspectionResult}
              isStreaming={isStreaming}
              setIsStreaming={setIsStreaming}
              syncToS3={syncToS3}
              setSyncToS3={setSyncToS3}
              currentResult={currentResult}
              isLoading={isLoading}
              setIsLoading={setIsLoading}
            />
          </div>

          {/* Right Column: Live Telemetry Sidebar & AWS S3 Sync Panel (4 cols) */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-6">
            <TelemetrySidebar
              currentResult={currentResult}
              metrics={metrics}
              latencyHistory={latencyHistory}
            />

            <AwsSyncStatus
              s3Upload={currentResult?.s3_upload}
              hasDefect={currentResult?.has_defect ?? false}
              syncEnabled={syncToS3}
              awsRegion={engineHealth.aws_region}
              s3Bucket={engineHealth.s3_bucket}
            />
          </div>
        </div>

        {/* Full-Width Real-Time Event Audit Timeline */}
        <div className="w-full">
          <EventTimeline
            logs={logs}
            onClearLogs={() => setLogs([])}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-industrial-800 bg-industrial-900/60 px-6 py-4 mt-auto text-xs font-mono text-slate-500 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <span className="font-bold text-slate-400">OPENCV AI COMPETITION 2026</span>
          <span>·</span>
          <span>Low-Latency Industrial Defect Inspection</span>
        </div>
        <div className="flex items-center space-x-3 text-[11px]">
          <span>FastAPI Engine: :8000</span>
          <span>·</span>
          <span>AWS Boto3 S3 Encoded Stream</span>
          <span>·</span>
          <span className="text-cyan-400">Next.js 15 App Router</span>
        </div>
      </footer>
    </div>
  );
}
