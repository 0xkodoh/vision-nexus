import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VISION NEXUS | OpenCV 5 Low-Latency Defect Detection & AWS S3 Dashboard",
  description: "Mission-critical Automated Optical Inspection (AOI) dashboard powered by native OpenCV 5 and AWS S3 hybrid cloud telemetry.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased min-h-screen bg-industrial-950 text-slate-100 selection:bg-cyan-500 selection:text-black">
        {children}
      </body>
    </html>
  );
}
