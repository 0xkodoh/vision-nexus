"""Native OpenCV Vision Pipelines for Industrial Defect Detection."""
import cv2
import numpy as np
from typing import Dict, Any, Tuple, List, Optional
import time

class DefectDetectionPipeline:
    def __init__(
        self,
        reference_image: Optional[np.ndarray] = None,
        canny_low: int = 50,
        canny_high: int = 150,
        blur_kernel_size: int = 5,
        min_defect_area: float = 15.0,
        max_defect_area: float = 25000.0,
        diff_threshold: int = 40
    ):
        """Initializes the native OpenCV industrial defect detection pipeline.

        Args:
            reference_image: Optional golden/perfect standard image (BGR or Grayscale).
            canny_low: Lower threshold for Canny edge detector.
            canny_high: Upper threshold for Canny edge detector.
            blur_kernel_size: Gaussian blur kernel size (odd integer).
            min_defect_area: Minimum contour area (px^2) to flag as a defect.
            max_defect_area: Maximum contour area (px^2) to flag as a defect.
            diff_threshold: Threshold for absolute difference image thresholding.
        """
        self.name = "industrial_defect_detection"
        self.canny_low = canny_low
        self.canny_high = canny_high
        self.blur_kernel_size = blur_kernel_size if blur_kernel_size % 2 == 1 else blur_kernel_size + 1
        self.min_defect_area = min_defect_area
        self.max_defect_area = max_defect_area
        self.diff_threshold = diff_threshold
        
        self.reference_gray: Optional[np.ndarray] = None
        if reference_image is not None:
            self.set_reference_image(reference_image)

    def set_reference_image(self, reference_image: np.ndarray) -> None:
        """Sets or updates the golden reference baseline image."""
        if len(reference_image.shape) == 3:
            gray = cv2.cvtColor(reference_image, cv2.COLOR_BGR2GRAY)
        else:
            gray = reference_image
        self.reference_gray = cv2.GaussianBlur(gray, (self.blur_kernel_size, self.blur_kernel_size), 0)

    def process_frame(
        self, 
        frame: np.ndarray, 
        reference_override: Optional[np.ndarray] = None
    ) -> Tuple[np.ndarray, Dict[str, Any]]:
        """Processes an incoming test frame (e.g. PCB board, pill packaging) using native OpenCV.

        Steps:
        1. Grayscale conversion and Gaussian blur noise suppression.
        2. Edge detection using Canny / Sobel gradient analysis.
        3. Structural difference analysis (Golden Template Comparison) if reference image exists.
        4. Morphological opening/closing to isolate defect artifacts (scratches, pinholes, misalignments).
        5. Contour discovery, bounding box calculation, and severity classification.
        6. Visual annotation (bounding boxes & telemetry) on annotated output image.

        Args:
            frame: np.ndarray (H, W, C) BGR image
            reference_override: Optional reference image to use for this specific frame.

        Returns:
            annotated_frame: np.ndarray BGR image with visual defect overlays
            metrics: dict with defect flags, bounding boxes, counts, and timing telemetry
        """
        start_time = time.perf_counter()
        h, w = frame.shape[:2]

        # 1. Grayscale and Gaussian blur
        if len(frame.shape) == 3:
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        else:
            gray = frame.copy()
            frame = cv2.cvtColor(gray, cv2.COLOR_GRAY2BGR)

        blurred = cv2.GaussianBlur(gray, (self.blur_kernel_size, self.blur_kernel_size), 0)

        # 2. Native Canny Edge Detection
        edges = cv2.Canny(blurred, self.canny_low, self.canny_high)

        # 3. Sobel Gradient Magnitude (Low-level texture/crack detection)
        sobel_x = cv2.Sobel(blurred, cv2.CV_64F, 1, 0, ksize=3)
        sobel_y = cv2.Sobel(blurred, cv2.CV_64F, 0, 1, ksize=3)
        sobel_magnitude = cv2.magnitude(sobel_x, sobel_y)
        sobel_8u = cv2.convertScaleAbs(sobel_magnitude)

        # 4. Reference comparison or Edge/Texture anomaly analysis
        active_ref = self.reference_gray
        if reference_override is not None:
            if len(reference_override.shape) == 3:
                ref_g = cv2.cvtColor(reference_override, cv2.COLOR_BGR2GRAY)
            else:
                ref_g = reference_override
            active_ref = cv2.GaussianBlur(ref_g, (self.blur_kernel_size, self.blur_kernel_size), 0)

        if active_ref is not None:
            # Resize active_ref to match frame if dimensions differ
            if active_ref.shape[:2] != (h, w):
                active_ref = cv2.resize(active_ref, (w, h), interpolation=cv2.INTER_AREA)

            # Compute absolute difference against golden reference
            abs_diff = cv2.absdiff(blurred, active_ref)
            _, diff_mask = cv2.threshold(abs_diff, self.diff_threshold, 255, cv2.THRESH_BINARY)
            
            # Combine edge anomalies with diff mask
            combined_mask = cv2.bitwise_or(diff_mask, edges)
        else:
            # Standalone anomaly detection via thresholding on edge & gradient density
            _, thresh_grad = cv2.threshold(sobel_8u, 100, 255, cv2.THRESH_BINARY)
            combined_mask = cv2.bitwise_or(edges, thresh_grad)

        # 5. Morphological Operations (eliminate noise, bridge crack segments)
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
        morphed = cv2.morphologyEx(combined_mask, cv2.MORPH_CLOSE, kernel, iterations=2)
        morphed = cv2.morphologyEx(morphed, cv2.MORPH_OPEN, kernel, iterations=1)

        # 6. Find Contours
        contours, _ = cv2.findContours(morphed, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        defects: List[Dict[str, Any]] = []
        annotated_frame = frame.copy()

        for idx, cnt in enumerate(contours):
            area = cv2.contourArea(cnt)
            if self.min_defect_area <= area <= self.max_defect_area:
                x, y, bw, bh = cv2.boundingRect(cnt)
                aspect_ratio = float(bw) / bh if bh > 0 else 1.0

                # Defect classification based on morphology
                if aspect_ratio > 3.0 or aspect_ratio < 0.33:
                    defect_type = "scratch_or_crack"
                elif area < 100:
                    defect_type = "pinhole_or_void"
                else:
                    defect_type = "structural_deformation"

                defects.append({
                    "id": idx + 1,
                    "type": defect_type,
                    "bbox": [int(x), int(y), int(bw), int(bh)],
                    "area": float(area),
                    "aspect_ratio": round(aspect_ratio, 2)
                })

                # Draw bounding box and defect label in BGR (Red for defect)
                cv2.rectangle(annotated_frame, (x, y), (x + bw, y + bh), (0, 0, 255), 2)
                label = f"#{idx+1} {defect_type} ({int(area)}px)"
                cv2.putText(
                    annotated_frame,
                    label,
                    (x, max(15, y - 5)),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.45,
                    (0, 0, 255),
                    1,
                    cv2.LINE_AA
                )

        has_defect = len(defects) > 0
        latency_ms = round((time.perf_counter() - start_time) * 1000.0, 2)

        # Visual status banner
        status_color = (0, 0, 255) if has_defect else (0, 255, 0)
        status_text = f"STATUS: {'DEFECT DETECTED (' + str(len(defects)) + ')' if has_defect else 'PASS (OK)'} | {latency_ms}ms"
        cv2.rectangle(annotated_frame, (5, 5), (min(w - 5, 450), 35), (20, 20, 20), -1)
        cv2.putText(
            annotated_frame,
            status_text,
            (10, 26),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.55,
            status_color,
            2,
            cv2.LINE_AA
        )

        metrics = {
            "has_defect": has_defect,
            "defect_count": len(defects),
            "defects": defects,
            "latency_ms": latency_ms,
            "frame_dimensions": {"width": w, "height": h},
            "timestamp": time.time()
        }

        return annotated_frame, metrics
