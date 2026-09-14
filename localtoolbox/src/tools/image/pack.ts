// Image category implementation pack — 29 tools (background-remover ships in the AI wave).
import type { ComponentType } from "react";
import {
  ImageConvertTool, HeicToJpgTool, HeicToPngTool, WebpToPngTool, PngToWebpTool,
  WebpToJpgTool, JpgToWebpTool, AvifToJpgTool, AvifToPngTool, ImageCompressTool,
  ImageResizeTool, ImageBrightnessTool, ImageBlurTool, ImageGrayscaleTool,
  ImageFiltersTool, ImageRotateTool, ImageBorderTool, SvgToPngTool, PngToSvgTool,
  ImageToBase64Tool, Base64ToImageTool,
} from "./basic";
import {
  ImageCropTool, ImageColorPickerTool, ImageCollageTool, ImageWatermarkTool,
  ImageMetadataTool, FaviconTool, PlaceholderTool, ImageAsciiTool,
} from "./editors";
import { BackgroundRemoverTool } from "../ai/aitools";

export const tools: Record<string, ComponentType> = {
  "image-compress": ImageCompressTool,
  "image-convert": ImageConvertTool,
  "background-remover": BackgroundRemoverTool,
  "heic-to-jpg": HeicToJpgTool,
  "heic-to-png": HeicToPngTool,
  "webp-to-png": WebpToPngTool,
  "png-to-webp": PngToWebpTool,
  "webp-to-jpg": WebpToJpgTool,
  "jpg-to-webp": JpgToWebpTool,
  "avif-to-jpg": AvifToJpgTool,
  "avif-to-png": AvifToPngTool,
  "image-filters": ImageFiltersTool,
  "image-resize": ImageResizeTool,
  "image-crop": ImageCropTool,
  "image-rotate": ImageRotateTool,
  "image-grayscale": ImageGrayscaleTool,
  "image-brightness": ImageBrightnessTool,
  "image-blur": ImageBlurTool,
  "image-watermark": ImageWatermarkTool,
  "image-to-base64": ImageToBase64Tool,
  "base64-to-image": Base64ToImageTool,
  "image-metadata": ImageMetadataTool,
  "image-color-picker": ImageColorPickerTool,
  "image-collage": ImageCollageTool,
  "svg-to-png": SvgToPngTool,
  "png-to-svg": PngToSvgTool,
  "image-placeholder": PlaceholderTool,
  "image-border": ImageBorderTool,
  "image-ascii": ImageAsciiTool,
  "image-favicon": FaviconTool,
};
