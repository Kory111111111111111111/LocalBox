// Video & Audio category pack — ffmpeg.wasm tools, screen recorder, on-device AI.
import type { ComponentType } from "react";
import {
  VideoConverterTool, CompressVideoTool, ExtractAudioTool, TrimVideoTool,
  MuteVideoTool, VideoToGifTool, ResizeVideoTool, CropVideoTool, MergeVideoTool,
  SpeedVideoTool, ReverseVideoTool, LoopVideoTool, SplitVideoTool, AddMusicTool,
  CutAudioTool, MergeAudioTool, AdjustVideoTool, SlideshowTool, ReframeTool,
  VolumeTool, ExtractFramesTool, WatermarkVideoTool, RemoveSilenceTool,
  BoomerangTool, GreenScreenTool, AudioConverterTool,
} from "./ffmpegtools";
import { ScreenRecorderTool } from "./recorder";
import { TranscribeTool, SubtitleGeneratorTool, TextToSpeechTool } from "../ai/aitools";

export const tools: Record<string, ComponentType> = {
  "video-converter": VideoConverterTool,
  "compress-video": CompressVideoTool,
  "extract-audio": ExtractAudioTool,
  "trim-video": TrimVideoTool,
  "mute-video": MuteVideoTool,
  "video-to-gif": VideoToGifTool,
  "resize-video": ResizeVideoTool,
  "crop-video": CropVideoTool,
  "merge-video": MergeVideoTool,
  "speed-video": SpeedVideoTool,
  "reverse-video": ReverseVideoTool,
  "loop-video": LoopVideoTool,
  "split-video": SplitVideoTool,
  "add-music-to-video": AddMusicTool,
  "cut-audio": CutAudioTool,
  "merge-audio": MergeAudioTool,
  "adjust-video": AdjustVideoTool,
  "slideshow-maker": SlideshowTool,
  "reframe-video": ReframeTool,
  "volume-booster": VolumeTool,
  "extract-frames": ExtractFramesTool,
  "add-watermark": WatermarkVideoTool,
  "remove-silence": RemoveSilenceTool,
  "boomerang-video": BoomerangTool,
  "green-screen": GreenScreenTool,
  "audio-converter": AudioConverterTool,
  "screen-recorder": ScreenRecorderTool,
  // on-device AI (lazy chunk shared with ../ai)
  "transcribe": TranscribeTool,
  "subtitle-generator": SubtitleGeneratorTool,
  "text-to-speech": TextToSpeechTool,
};
