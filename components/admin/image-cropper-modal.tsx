"use client";

import React, { useState, useRef, useEffect } from "react";
import { Move, ZoomIn, X, Check } from "lucide-react";

export interface ImageCropperModalProps {
  imageSrc: string;
  onCrop: (croppedFile: File, previewUrl: string) => void;
  onClose: () => void;
  aspectRatio?: number; // width / height, defaults to 3 / 1
  exportWidth?: number; // defaults to 2400
  exportHeight?: number; // defaults to 800
  title?: string;
  subtitle?: string;
}

export function ImageCropperModal({
  imageSrc,
  onCrop,
  onClose,
  aspectRatio = 3 / 1,
  exportWidth = 2400,
  exportHeight = 800,
  title = "Adjust Banner Crop (3 : 1)",
  subtitle = "Drag to position & slide to zoom to fit the 3:1 banner frame",
}: ImageCropperModalProps) {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dimensions, setDimensions] = useState({ width: 0, height: 0, fitScale: 1 });
  const [isProcessing, setIsProcessing] = useState(false);

  // Preview container dimensions (fixed aspect ratio of 3:1)
  const containerWidth = 540;
  const containerHeight = Math.round(containerWidth / aspectRatio); // 180px

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    if (!naturalWidth || !naturalHeight) return;

    // Scale so the image covers the entire 3:1 container
    const fitScale = Math.max(
      containerWidth / naturalWidth,
      containerHeight / naturalHeight,
    );

    setDimensions({
      width: naturalWidth,
      height: naturalHeight,
      fitScale,
    });
    setOffset({ x: 0, y: 0 });
    setZoom(1);
  };

  const baseW = dimensions.width * dimensions.fitScale;
  const baseH = dimensions.height * dimensions.fitScale;
  const dispW = baseW * zoom;
  const dispH = baseH * zoom;

  const left = (containerWidth - dispW) / 2 + offset.x;
  const top = (containerHeight - dispH) / 2 + offset.y;

  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    let newX = e.clientX - dragStart.x;
    let newY = e.clientY - dragStart.y;

    const maxOffsetX = Math.max(0, (dispW - containerWidth) / 2);
    const maxOffsetY = Math.max(0, (dispH - containerHeight) / 2);

    newX = Math.min(Math.max(newX, -maxOffsetX), maxOffsetX);
    newY = Math.min(Math.max(newY, -maxOffsetY), maxOffsetY);

    setOffset({ x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch drag handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    setIsDragging(true);
    const touch = e.touches[0];
    setDragStart({ x: touch.clientX - offset.x, y: touch.clientY - offset.y });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    const touch = e.touches[0];
    let newX = touch.clientX - dragStart.x;
    let newY = touch.clientY - dragStart.y;

    const maxOffsetX = Math.max(0, (dispW - containerWidth) / 2);
    const maxOffsetY = Math.max(0, (dispH - containerHeight) / 2);

    newX = Math.min(Math.max(newX, -maxOffsetX), maxOffsetX);
    newY = Math.min(Math.max(newY, -maxOffsetY), maxOffsetY);

    setOffset({ x: newX, y: newY });
  };

  // Perform Canvas crop & convert to File
  const handleCrop = () => {
    if (isProcessing) return;
    setIsProcessing(true);

    const canvas = document.createElement("canvas");
    canvas.width = exportWidth;
    canvas.height = exportHeight;
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      setIsProcessing(false);
      return;
    }

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, exportWidth, exportHeight);

      // Scale multiplier from preview container to export dimensions
      const scaleMultiplier = exportWidth / containerWidth;

      const exportLeft = left * scaleMultiplier;
      const exportTop = top * scaleMultiplier;
      const exportDispW = dispW * scaleMultiplier;
      const exportDispH = dispH * scaleMultiplier;

      ctx.drawImage(img, exportLeft, exportTop, exportDispW, exportDispH);

      canvas.toBlob(
        (blob) => {
          setIsProcessing(false);
          if (blob) {
            const fileName = `banner-cropped-${Date.now()}.jpg`;
            const croppedFile = new File([blob], fileName, { type: "image/jpeg" });
            const previewUrl = URL.createObjectURL(blob);
            onCrop(croppedFile, previewUrl);
          }
        },
        "image/jpeg",
        0.92,
      );
    };

    img.onerror = () => {
      setIsProcessing(false);
    };

    img.src = imageSrc;
  };

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[6000] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#FAF7F0] rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl p-6 md:p-8 flex flex-col items-center border border-[#D5CCBB]">
        {/* Header */}
        <div className="w-full flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-[#30251F] tracking-tight">{title}</h3>
            <p className="text-xs text-[#6B5A4A] mt-0.5">{subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#6B5A4A] hover:text-[#30251F] hover:bg-[#E4DDCD]/60 rounded-lg transition-colors"
            title="Cancel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3:1 Aspect Ratio Cropping Container */}
        <div className="w-full flex justify-center py-2">
          <div
            className="relative overflow-hidden rounded-xl border-2 border-[#C9A45C] shadow-md bg-neutral-900 cursor-move select-none"
            style={{
              width: `${containerWidth}px`,
              height: `${containerHeight}px`,
              maxWidth: "100%",
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleMouseUp}
          >
            {/* Image being cropped */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageSrc}
              alt="Crop target"
              onLoad={handleImageLoad}
              style={{
                position: "absolute",
                width: `${dispW}px`,
                height: `${dispH}px`,
                left: `${left}px`,
                top: `${top}px`,
                maxWidth: "none",
                pointerEvents: "none",
                userSelect: "none",
              }}
            />

            {/* Rule of Thirds / Grid overlay for composition */}
            <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-1 border border-white/20">
              <div className="border-r border-white/20 h-full" />
              <div className="border-r border-white/20 h-full" />
              <div className="h-full" />
            </div>

            {/* Hint overlay */}
            <div className="absolute bottom-2 right-2.5 px-2 py-0.5 rounded bg-black/60 text-[10px] text-white/90 font-medium pointer-events-none flex items-center gap-1">
              <Move className="w-3 h-3 text-[#C9A45C]" /> Drag to frame
            </div>
          </div>
        </div>

        {/* Zoom Slider */}
        <div className="w-full max-w-[540px] mt-4 space-y-1.5">
          <div className="flex justify-between text-xs font-semibold text-[#6B5A4A]">
            <span className="flex items-center gap-1">
              <ZoomIn className="w-3.5 h-3.5 text-[#073C35]" /> Zoom
            </span>
            <span>{Math.round(zoom * 100)}%</span>
          </div>
          <input
            type="range"
            min="1"
            max="3"
            step="0.01"
            value={zoom}
            onChange={(e) => {
              const newZoom = parseFloat(e.target.value);
              setZoom(newZoom);
              setOffset((prev) => {
                const newDispW = baseW * newZoom;
                const newDispH = baseH * newZoom;
                const maxOffsetX = Math.max(0, (newDispW - containerWidth) / 2);
                const maxOffsetY = Math.max(0, (newDispH - containerHeight) / 2);
                return {
                  x: Math.min(Math.max(prev.x, -maxOffsetX), maxOffsetX),
                  y: Math.min(Math.max(prev.y, -maxOffsetY), maxOffsetY),
                };
              });
            }}
            className="w-full h-1.5 bg-[#D5CCBB] rounded-lg appearance-none cursor-pointer accent-[#073C35]"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 w-full max-w-[540px] mt-6">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="flex-1 py-2.5 border border-[#D5CCBB] text-[#6B5A4A] hover:bg-[#E4DDCD]/50 font-semibold rounded-xl text-xs uppercase tracking-wider transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCrop}
            disabled={isProcessing}
            className="flex-1 py-2.5 bg-[#073C35] hover:bg-[#073C35]/90 text-white font-semibold rounded-xl text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            {isProcessing ? (
              "Cropping..."
            ) : (
              <>
                <Check className="w-4 h-4 text-[#C9A45C]" /> Apply & Upload 3:1 Banner
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
