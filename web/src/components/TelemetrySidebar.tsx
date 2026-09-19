"use client";

import React from "react";
import { 
  Activity, 
  Cpu, 
  AlertTriangle, 
  CheckCircle2, 
  Sliders, 
  Zap, 
  Gauge, 
  TrendingUp, 
  Hash, 
  Layers, 
  Target,
  BarChart3,
  Clock
} from "lucide-react";
import { ProcessFrameResponse, ProductionYieldMetrics, DefectDetail } from "@/types/inspection";

interface TelemetrySidebarProps {
  currentResult: ProcessFrameResponse | null;
  metrics: ProductionYieldMetrics;
  latencyHistory: number[];
}

export const TelemetrySidebar: React.FC<TelemetrySidebarProps> = ({
  currentResult,
  metrics,
  latencyHistory,
}) => {
  const currentLatency = currentResult?.latency_ms ?? 0;
  const hasDefect = currentResult?.has_defect ?? false;
  const defects = currentResult?.defects ?? [];

  // Determine Latency tier
  const isUltraLow = currentLatency > 0 && currentLatency < 10;
  const isOptimal = currentLatency >= 10 && currentLatency < 30;

  return (
    <div className="flex flex-col space-y-4">
      {/* 1. Core Latency & Processing Speed Gauge */}
      <div className="p-4 rounded-xl border border-industrial-750 bg-industrial-900/90 shadow-xl relative overflow-hidden">
        <div className="flex items-center justify-between border-b border-industrial-800 pb-2.5">
          <div className="flex items-center space-x-2">
            <Gauge className="w-4 h-4 text-cyan-400" />
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-200">
              OPENCV 5 LATENCY METER
            </span>
          </div>
          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
            isUltraLow
              ? "bg-emerald-950 text-emerald-300 border border-emerald-500/30"
              : isOptimal
              ? "bg-cyan-950 text-cyan-300 border border-cyan-500/30"
              : "bg-amber-950 text-amber-300 border border-amber-500/30"
          }`}>
            {isUltraLow ? "ULTRA-LOW LATENCY" : isOptimal ? "OPTIMAL REALTIME" : "EVALUATING"}
          </span>
        </div>

        <div className="mt-4 flex items-baseline justify-between">
          <div>
            <div className="flex items-baseline space-x-1.5">
              <span className="font-mono font-black text-4xl text-slate-100 tabular-nums">
                {currentLatency.toFixed(2)}
              </span>
              <span className="font-mono text-sm font-semibold text-cyan-400">ms</span>
            </div>
            <p className="text-[11px] font-mono text-slate-400 mt-0.5">
              Per-frame Canny/Sobel contour latency
            </p>
          </div>

          <div className="text-right font-mono text-[11px] space-y-0.5">
            <div className="text-slate-400">
              Avg: <span className="text-slate-200 font-bold tabular-nums">{metrics.avgLatencyMs.toFixed(1)} ms</span>
            </div>
            <div className="text-slate-400">
              Min/Max: <span className="text-slate-300 tabular-nums">{metrics.minLatencyMs.toFixed(1)} / {metrics.maxLatencyMs.toFixed(1)} ms</span>
            </div>
          </div>
        </div>

        {/* Latency History Sparkline */}
        <div className="mt-4 pt-3 border-t border-industrial-800">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1.5">
            <span>RECENT FRAME TIMING (LAST 20 SAMPLES):</span>
            <span className="text-cyan-400">TARGET &lt; 15ms</span>
          </div>

          <div className="h-10 flex items-end space-x-1 bg-industrial-950 p-1.5 rounded border border-industrial-800">
            {latencyHistory.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center text-[10px] font-mono text-slate-600">
                Awaiting frames...
              </div>
            ) : (
              latencyHistory.slice(-20).map((lat, idx) => {
                const heightPercent = Math.min(100, Math.max(15, (lat / 25) * 100));
                const isHigh = lat > 15;

                return (
                  <div
                    key={idx}
                    className="flex-1 rounded-t transition-all"
                    style={{
                      height: `${heightPercent}%`,
                      backgroundColor: isHigh ? "#f59e0b" : "#06b6d4",
                      boxShadow: isHigh ? "0 0 6px rgba(245, 158, 11, 0.4)" : "0 0 4px rgba(6, 182, 212, 0.3)"
                    }}
                    title={`Frame -${20 - idx}: ${lat.toFixed(2)}ms`}
                  />
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* 2. Defect Classification Breakdown */}
      <div className="p-4 rounded-xl border border-industrial-750 bg-industrial-900/90 shadow-xl">
        <div className="flex items-center justify-between border-b border-industrial-800 pb-2.5">
          <div className="flex items-center space-x-2">
            <Target className="w-4 h-4 text-red-400" />
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-200">
              DEFECT TAXONOMY MATRIX
            </span>
          </div>
          <span className="font-mono text-[10px] text-slate-400">
            Active: <span className="text-red-400 font-bold">{currentResult?.defect_count ?? 0}</span>
          </span>
        </div>

        <div className="mt-3 space-y-2.5 font-mono text-xs">
          {/* Scratch / Crack */}
          <div className="p-2.5 rounded-lg bg-industrial-950 border border-industrial-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-red-400" />
              <div>
                <div className="font-semibold text-slate-200 text-xs">Scratch / Crack</div>
                <div className="text-[10px] text-slate-500">Aspect Ratio &gt; 3.0 / &lt; 0.33</div>
              </div>
            </div>
            <div className="text-right">
              <span className="text-base font-bold text-red-400 tabular-nums">
                {metrics.defectTypeCounts.scratch_or_crack}
              </span>
              <div className="text-[9px] text-slate-500 uppercase">Detected</div>
            </div>
          </div>

          {/* Pinhole / Void */}
          <div className="p-2.5 rounded-lg bg-industrial-950 border border-industrial-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <div>
                <div className="font-semibold text-slate-200 text-xs">Pinhole / Void</div>
                <div className="text-[10px] text-slate-500">Contour Area &lt; 100px²</div>
              </div>
            </div>
            <div className="text-right">
              <span className="text-base font-bold text-amber-400 tabular-nums">
                {metrics.defectTypeCounts.pinhole_or_void}
              </span>
              <div className="text-[9px] text-slate-500 uppercase">Detected</div>
            </div>
          </div>

          {/* Structural Deformation */}
          <div className="p-2.5 rounded-lg bg-industrial-950 border border-industrial-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-purple-400" />
              <div>
                <div className="font-semibold text-slate-200 text-xs">Structural Deformation</div>
                <div className="text-[10px] text-slate-500">Morphology Anomaly &gt; 100px²</div>
              </div>
            </div>
            <div className="text-right">
              <span className="text-base font-bold text-purple-400 tabular-nums">
                {metrics.defectTypeCounts.structural_deformation}
              </span>
              <div className="text-[9px] text-slate-500 uppercase">Detected</div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Factory Line Production Yield Statistics */}
      <div className="p-4 rounded-xl border border-industrial-750 bg-industrial-900/90 shadow-xl">
        <div className="flex items-center justify-between border-b border-industrial-800 pb-2.5">
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-200">
              PRODUCTION LINE YIELD
            </span>
          </div>
          <span className="font-mono text-[10px] text-emerald-400 font-bold">
            {metrics.yieldRate.toFixed(1)}% PASS
          </span>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2 text-center font-mono">
          <div className="p-2.5 rounded-lg bg-industrial-950 border border-industrial-800">
            <div className="text-[10px] uppercase text-slate-400">Total Frames</div>
            <div className="mt-1 text-xl font-bold text-slate-100 tabular-nums">
              {metrics.totalProcessed}
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-industrial-950 border border-emerald-950/60">
            <div className="text-[10px] uppercase text-emerald-400">Pass (OK)</div>
            <div className="mt-1 text-xl font-bold text-signal-pass tabular-nums">
              {metrics.totalPassed}
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-industrial-950 border border-red-950/60">
            <div className="text-[10px] uppercase text-red-400">Defects</div>
            <div className="mt-1 text-xl font-bold text-signal-alarm tabular-nums">
              {metrics.totalDefects}
            </div>
          </div>
        </div>

        {/* Visual Yield Bar */}
        <div className="mt-3">
          <div className="w-full h-2 rounded-full bg-red-900/40 overflow-hidden flex">
            <div 
              className="h-full bg-gradient-to-r from-emerald-600 to-signal-pass transition-all duration-500" 
              style={{ width: `${Math.max(0, Math.min(100, metrics.yieldRate))}%` }}
            />
          </div>
        </div>
      </div>

      {/* 4. Active Defect Bounding Box Coordinate Inspector */}
      {defects.length > 0 && (
        <div className="p-4 rounded-xl border border-red-500/40 bg-industrial-900/90 shadow-xl animate-in fade-in">
          <div className="flex items-center justify-between border-b border-industrial-800 pb-2">
            <div className="flex items-center space-x-2">
              <Target className="w-4 h-4 text-red-400" />
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-red-200">
                ACTIVE DEFECT COORDINATES
              </span>
            </div>
            <span className="font-mono text-[10px] text-red-400 font-bold">
              {defects.length} LOCATIONS
            </span>
          </div>

          <div className="mt-3 space-y-2 max-h-48 overflow-y-auto pr-1">
            {defects.map((d) => (
              <div
                key={d.id}
                className="p-2 rounded bg-industrial-950 border border-red-900/50 text-[11px] font-mono space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-red-300">
                    Defect #{d.id}: {d.type}
                  </span>
                  <span className="text-slate-400">
                    Area: <span className="text-cyan-300 font-semibold">{d.area}px²</span>
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-400 text-[10px]">
                  <span>
                    BBOX: <code className="text-sky-300">[X:{d.bbox[0]}, Y:{d.bbox[1]}, W:{d.bbox[2]}, H:{d.bbox[3]}]</code>
                  </span>
                  <span>AR: {d.aspect_ratio}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. OpenCV 5 Throughput & Resolution Benchmark Module */}
      <ResolutionBenchmarkSection />
    </div>
  );
};

const ResolutionBenchmarkSection: React.FC = () => {
  const [benchmarking, setBenchmarking] = React.useState(false);
  const [benchmarkData, setBenchmarkData] = React.useState<any>(null);
  const [error, setError] = React.useState<string | null>(null);

  const triggerBenchmark = async (resolution?: string) => {
    setBenchmarking(true);
    setError(null);
    try {
      const { runOpenCvBenchmark } = await import("@/lib/api");
      const res = await runOpenCvBenchmark(resolution, 40);
      setBenchmarkData(res);
    } catch (err: any) {
      setError(err.message || "Benchmark failed");
    } finally {
      setBenchmarking(false);
    }
  };

  return (
    <div className="p-4 rounded-xl border border-cyan-500/30 bg-industrial-900/90 shadow-xl space-y-3 font-mono">
      <div className="flex items-center justify-between border-b border-industrial-800 pb-2">
        <div className="flex items-center space-x-2">
          <Zap className="w-4 h-4 text-signal-accent" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
            OPENCV 5 RESOLUTION BENCHMARK
          </span>
        </div>
        <span className="text-[10px] text-cyan-400 font-bold">480p / 720p / 1080p</span>
      </div>

      <div className="flex items-center space-x-2">
        <button
          onClick={() => triggerBenchmark()}
          disabled={benchmarking}
          className="flex-1 py-1.5 px-2.5 rounded bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 text-xs font-bold transition-colors disabled:opacity-50 flex items-center justify-center space-x-1.5 shadow-sm"
        >
          {benchmarking ? (
            <Activity className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <PlayIcon className="w-3.5 h-3.5" />
          )}
          <span>{benchmarking ? "BENCHMARKING..." : "RUN FULL BENCHMARK"}</span>
        </button>
      </div>

      {error && (
        <div className="p-2 rounded bg-red-950/40 border border-red-500/30 text-[10px] text-red-300">
          {error}
        </div>
      )}

      {benchmarkData && benchmarkData.results && (
        <div className="space-y-2 text-xs pt-1">
          {Object.entries(benchmarkData.results).map(([resKey, item]: [string, any]) => (
            <div key={resKey} className="p-2 rounded bg-industrial-950 border border-industrial-800 space-y-1">
              <div className="flex items-center justify-between font-bold text-slate-200">
                <span className="text-cyan-400">{resKey.toUpperCase()} ({item.dimensions.width}x{item.dimensions.height})</span>
                <span className="text-emerald-400 tabular-nums">{item.fps} FPS</span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span>Mean: <strong className="text-slate-200">{item.mean_latency_ms}ms</strong></span>
                <span>p95: <strong className="text-slate-200">{item.p95_latency_ms}ms</strong></span>
                <span>Rate: <strong className="text-cyan-300">{item.throughput_mb_s} MB/s</strong></span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const PlayIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
