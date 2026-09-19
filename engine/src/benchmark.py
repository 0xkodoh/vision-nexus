"""OpenCV 5 Pipeline Throughput & Latency Benchmarking Suite.

Measures frame processing latency (mean, min, max, p95, p99), effective FPS,
and pixel throughput across standard industrial resolutions (480p, 720p, 1080p).
"""
import os
import sys
import time
import statistics
import cv2
import numpy as np
from typing import Dict, Any, List, Optional, Tuple

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from src.pipelines.base_pipeline import DefectDetectionPipeline


def generate_benchmark_frame(
    width: int, 
    height: int, 
    with_defect: bool = True
) -> Tuple[np.ndarray, np.ndarray]:
    """Generates synthetic golden reference and test frame for benchmarking.
    
    Args:
        width: Frame width in pixels
        height: Frame height in pixels
        with_defect: If True, draws realistic industrial defects (crack, pinhole, deformation)
        
    Returns:
        (reference_frame, test_frame)
    """
    # Create base industrial circuit/texture substrate
    base = np.full((height, width, 3), 215, dtype=np.uint8)
    
    # Draw geometric circuit grid patterns
    grid_spacing = max(20, min(width, height) // 25)
    for x in range(0, width, grid_spacing):
        cv2.line(base, (x, 0), (x, height), (180, 180, 180), 1)
    for y in range(0, height, grid_spacing):
        cv2.line(base, (0, y), (width, y), (180, 180, 180), 1)
        
    # Draw standard IC chips / solder pads
    num_components = 6
    pad_w, pad_h = width // 10, height // 12
    for i in range(num_components):
        cx = int((i + 1) * (width / (num_components + 1)))
        cy = int(height * 0.4)
        cv2.rectangle(base, (cx - pad_w // 2, cy - pad_h // 2), (cx + pad_w // 2, cy + pad_h // 2), (60, 60, 60), -1)
        cv2.rectangle(base, (cx - pad_w // 2 + 2, cy - pad_h // 2 + 2), (cx + pad_w // 2 - 2, cy + pad_h // 2 - 2), (90, 90, 90), -1)
        
    ref_frame = base.copy()
    test_frame = base.copy()
    
    if with_defect:
        # Defect 1: Micro-crack / scratch
        cv2.line(test_frame, (int(width * 0.25), int(height * 0.35)), (int(width * 0.38), int(height * 0.48)), (20, 20, 20), 3)
        # Defect 2: Pinhole / solder void
        cv2.circle(test_frame, (int(width * 0.65), int(height * 0.4)), 6, (10, 10, 10), -1)
        # Defect 3: Solder bridge / deformation
        cv2.rectangle(test_frame, (int(width * 0.8), int(height * 0.36)), (int(width * 0.86), int(height * 0.44)), (30, 30, 30), -1)
        
    return ref_frame, test_frame


class PipelineBenchmarkRunner:
    """Orchestrates OpenCV 5 pipeline performance benchmarking."""

    STANDARD_RESOLUTIONS = {
        "480p": (640, 480),
        "720p": (1280, 720),
        "1080p": (1920, 1080)
    }

    def __init__(self, warmup_iterations: int = 5):
        self.warmup_iterations = warmup_iterations

    def run_resolution_benchmark(
        self,
        resolution_name: str,
        width: int,
        height: int,
        iterations: int = 50,
        test_defective: bool = True
    ) -> Dict[str, Any]:
        """Runs the pipeline against a specific resolution for a given iteration count.
        
        Args:
            resolution_name: Label (e.g. '720p')
            width: Width in pixels
            height: Height in pixels
            iterations: Number of test iterations
            test_defective: Whether to benchmark with defective frame features
            
        Returns:
            Dict containing detailed latency, FPS, and throughput statistics.
        """
        pipeline = DefectDetectionPipeline()
        ref_frame, test_frame = generate_benchmark_frame(width, height, with_defect=test_defective)
        pipeline.set_reference_image(ref_frame)

        # 1. Warm-up runs to prime caches and CPU instruction pipelines
        for _ in range(self.warmup_iterations):
            _ = pipeline.process_frame(test_frame)

        # 2. Benchmark runs
        latencies_ms: List[float] = []
        start_total = time.perf_counter()

        for _ in range(iterations):
            t0 = time.perf_counter()
            annotated_frame, metrics = pipeline.process_frame(test_frame)
            t1 = time.perf_counter()
            latencies_ms.append((t1 - t0) * 1000.0)

        total_time_s = time.perf_counter() - start_total
        mean_latency = statistics.mean(latencies_ms)
        median_latency = statistics.median(latencies_ms)
        min_latency = min(latencies_ms)
        max_latency = max(latencies_ms)
        
        # Percentiles (p95, p99)
        sorted_latencies = sorted(latencies_ms)
        p95_idx = int(len(sorted_latencies) * 0.95)
        p99_idx = int(len(sorted_latencies) * 0.99)
        p95_latency = sorted_latencies[min(p95_idx, len(sorted_latencies) - 1)]
        p99_latency = sorted_latencies[min(p99_idx, len(sorted_latencies) - 1)]

        fps = round(iterations / total_time_s, 2)
        frame_bytes = width * height * 3
        throughput_mb_s = round((frame_bytes * fps) / (1024 * 1024), 2)

        return {
            "resolution": resolution_name,
            "dimensions": {"width": width, "height": height},
            "iterations": iterations,
            "mean_latency_ms": round(mean_latency, 2),
            "median_latency_ms": round(median_latency, 2),
            "min_latency_ms": round(min_latency, 2),
            "max_latency_ms": round(max_latency, 2),
            "p95_latency_ms": round(p95_latency, 2),
            "p99_latency_ms": round(p99_latency, 2),
            "fps": fps,
            "throughput_mb_s": throughput_mb_s,
            "opencv_version": cv2.__version__
        }

    def run_full_suite(self, iterations: int = 50) -> Dict[str, Any]:
        """Runs benchmarks across all standard industrial resolutions (480p, 720p, 1080p)."""
        suite_results = {}
        for res_name, (w, h) in self.STANDARD_RESOLUTIONS.items():
            suite_results[res_name] = self.run_resolution_benchmark(
                resolution_name=res_name,
                width=w,
                height=h,
                iterations=iterations,
                test_defective=True
            )

        return {
            "timestamp": time.time(),
            "opencv_version": cv2.__version__,
            "benchmark_iterations": iterations,
            "results": suite_results
        }


def format_benchmark_table(suite_results: Dict[str, Any]) -> str:
    """Formats benchmark results as a clean ASCII/Markdown table."""
    lines = [
        "=========================================================================================================",
        f"  OpenCV 5 Defect Detection Pipeline Benchmark Suite | OpenCV {suite_results['opencv_version']}",
        "=========================================================================================================",
        f"{'Resolution':<12} | {'Dimensions':<12} | {'Mean Latency':<14} | {'p95 Latency':<13} | {'FPS':<10} | {'Throughput':<14}",
        "-------------|--------------|----------------|---------------|------------|---------------"
    ]
    for res_name, res_data in suite_results["results"].items():
        dim_str = f"{res_data['dimensions']['width']}x{res_data['dimensions']['height']}"
        lines.append(
            f"{res_name:<12} | {dim_str:<12} | {res_data['mean_latency_ms']:>8.2f} ms     | {res_data['p95_latency_ms']:>7.2f} ms    | {res_data['fps']:>7.1f} fps | {res_data['throughput_mb_s']:>8.2f} MB/s"
        )
    lines.append("=========================================================================================================")
    return "\n".join(lines)


if __name__ == "__main__":
    import sys
    import os
    # Ensure parent dir is in sys.path when run directly
    sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
    from src.pipelines.base_pipeline import DefectDetectionPipeline
    
    runner = PipelineBenchmarkRunner(warmup_iterations=10)
    print("\nExecuting OpenCV 5 Native Performance Benchmark Suite across 480p, 720p, and 1080p...\n")
    results = runner.run_full_suite(iterations=60)
    print(format_benchmark_table(results))
