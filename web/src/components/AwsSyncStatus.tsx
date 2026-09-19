"use client";

import React, { useState, useEffect } from "react";
import { 
  Cloud, 
  CheckCircle2, 
  AlertTriangle, 
  Copy, 
  Check, 
  ExternalLink, 
  Database, 
  ShieldCheck,
  Zap,
  ArrowUpRight,
  Server,
  Radio,
  Bell,
  Cpu
} from "lucide-react";
import { S3UploadResult, GreengrassStatus, LambdaAlertRecord } from "@/types/inspection";
import { fetchGreengrassStatus } from "@/lib/api";

interface AwsSyncStatusProps {
  s3Upload: (S3UploadResult & { lambda_alert?: LambdaAlertRecord }) | null | undefined;
  hasDefect: boolean;
  syncEnabled: boolean;
  awsRegion: string;
  s3Bucket: string;
}

export const AwsSyncStatus: React.FC<AwsSyncStatusProps> = ({
  s3Upload,
  hasDefect,
  syncEnabled,
  awsRegion,
  s3Bucket,
}) => {
  const [copied, setCopied] = useState(false);
  const [greengrass, setGreengrass] = useState<GreengrassStatus | null>(null);

  useEffect(() => {
    fetchGreengrassStatus()
      .then(setGreengrass)
      .catch(() => {});
  }, [s3Upload]);

  const handleCopyKey = () => {
    if (s3Upload?.key) {
      navigator.clipboard.writeText(s3Upload.key);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isUploaded = s3Upload?.success === true;
  const isFailed = s3Upload?.success === false;
  const lambdaAlert = s3Upload?.lambda_alert;

  return (
    <div className="p-4 rounded-xl border border-industrial-750 bg-industrial-900/90 shadow-xl space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-industrial-800 pb-2.5">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-md bg-amber-950/60 border border-amber-500/30 text-signal-aws">
            <Cloud className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-200">
              AWS CLOUD & EDGE SYNC TELEMETRY
            </h3>
            <p className="text-[10px] font-mono text-slate-400">
              Boto3 S3 Buffer • Greengrass v2 Core • Lambda Event Webhook
            </p>
          </div>
        </div>

        {/* Status Pill */}
        <div>
          {!syncEnabled ? (
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-industrial-950 text-slate-500 border border-industrial-800">
              SYNC DISABLED
            </span>
          ) : !hasDefect ? (
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-slate-900 text-slate-400 border border-slate-700">
              STANDBY (NO DEFECT)
            </span>
          ) : isUploaded ? (
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-emerald-950 text-emerald-300 border border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.2)] flex items-center space-x-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>SYNCED TO S3</span>
            </span>
          ) : isFailed ? (
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-amber-950 text-amber-300 border border-amber-500/40">
              S3 PENDING / LOCAL
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-industrial-950 text-slate-400">
              AWAITING EVENT
            </span>
          )}
        </div>
      </div>

      {/* Cloud Parameters Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
        <div className="p-2.5 rounded-lg bg-industrial-950 border border-industrial-800 space-y-0.5">
          <div className="text-[10px] uppercase text-slate-400 flex items-center justify-between">
            <span>TARGET S3 BUCKET</span>
            <Database className="w-3 h-3 text-amber-400" />
          </div>
          <div className="text-slate-200 font-semibold truncate" title={s3Bucket}>
            {s3Upload?.bucket || s3Bucket || "opencv-ai-competition-defects"}
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-industrial-950 border border-industrial-800 space-y-0.5">
          <div className="text-[10px] uppercase text-slate-400 flex items-center justify-between">
            <span>AWS REGION & EDGE</span>
            <Radio className="w-3 h-3 text-emerald-400" />
          </div>
          <div className="text-amber-300 font-semibold flex items-center justify-between">
            <span>{awsRegion || "us-east-1"}</span>
            <span className="text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-1 rounded">
              {greengrass?.status || "GREENGRASS ACTIVE"}
            </span>
          </div>
        </div>
      </div>

      {/* Greengrass Edge Component Telemetry */}
      {greengrass && (
        <div className="p-2.5 rounded-lg bg-industrial-950/80 border border-industrial-800/80 text-[10px] font-mono text-slate-400 flex items-center justify-between">
          <div className="flex items-center space-x-1.5">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-300">Thing: {greengrass.thing_name.split("-").slice(0, 3).join("-")}</span>
          </div>
          <div className="text-slate-400">
            Deployment: <span className="text-slate-200">{greengrass.deployment_id}</span>
          </div>
        </div>
      )}

      {/* Uploaded Artifact Details */}
      {isUploaded && s3Upload && (
        <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/30 space-y-2 text-xs font-mono">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-emerald-400 font-bold uppercase flex items-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>S3 Artifact Key</span>
            </span>
            <button
              onClick={handleCopyKey}
              className="p-1 hover:bg-emerald-900/40 rounded text-emerald-300 transition-colors flex items-center space-x-1 text-[10px]"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? "Copied" : "Copy Key"}</span>
            </button>
          </div>

          <div className="p-2 rounded bg-black/60 border border-emerald-900/50 text-[11px] text-slate-200 break-all font-mono">
            {s3Upload.key}
          </div>

          {s3Upload.s3_url && (
            <div className="flex items-center justify-between pt-1">
              <span className="text-[10px] text-slate-400">Direct S3 Object URI:</span>
              <a
                href={s3Upload.s3_url}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-cyan-400 hover:text-cyan-300 hover:underline flex items-center space-x-1"
              >
                <span>View Raw S3 Asset</span>
                <ArrowUpRight className="w-3 h-3" />
              </a>
            </div>
          )}
        </div>
      )}

      {/* Simulated Downstream AWS Lambda & SNS Alert Webhook Notification */}
      {lambdaAlert && (
        <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-500/40 space-y-1.5 text-xs font-mono">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5 text-amber-300 font-bold text-[11px]">
              <Bell className="w-3.5 h-3.5 text-signal-defect animate-pulse" />
              <span>AWS LAMBDA ALERT DISPATCHED</span>
            </div>
            <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
              lambdaAlert.severity === "CRITICAL" ? "bg-red-950 text-red-300 border border-red-500/50" : "bg-amber-950 text-amber-300 border border-amber-500/50"
            }`}>
              {lambdaAlert.severity}
            </span>
          </div>

          <div className="text-[11px] text-slate-300 leading-tight">
            {lambdaAlert.notification_summary}
          </div>

          <div className="flex items-center justify-between text-[9px] text-slate-400 pt-1 border-t border-amber-900/40">
            <span>Execution ID: {lambdaAlert.execution_id}</span>
            <span>Lambda Latency: {lambdaAlert.latency_ms}ms</span>
          </div>
        </div>
      )}

      {/* Metadata & Architecture Tag */}
      <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1">
        <span className="flex items-center space-x-1">
          <Database className="w-3 h-3 text-amber-400" />
          <span>Metadata: defect_count, latency_ms, cv_version</span>
        </span>
        <span className="text-slate-500">
          AWS IoT Greengrass + Lambda
        </span>
      </div>
    </div>
  );
};
