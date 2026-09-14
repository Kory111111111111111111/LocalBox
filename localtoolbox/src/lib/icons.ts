// Lucide icon registry: map tool/category icon names from tools.json to components.
// Falls back to a category default when a name isn't available.
import {
  Activity, AlignLeft, Archive, ArrowLeftRight, ArrowUpDown, AtSign, AudioLines, AudioWaveform,
  BarChart2, Binary, Blend, Book, BookOpen, Bot, Braces, Briefcase, Cake, Calculator, Calendar,
  CalendarPlus, Camera, Captions, CheckSquare, Circle, Clapperboard, Clock, Code, Code2, Combine,
  Container, Contrast, CreditCard, Crop, Database, Dices, Divide, DollarSign, Eraser, Eye,
  FileCode, FileCode2, FileImage, FileJson, FilePlus2, FileSearch, FileSpreadsheet, FileText,
  FileType, Film, Filter, Fingerprint, Flame, FolderOpen, Frame, Fuel, Gauge, GitBranch,
  GitCommit, GitCompare, Globe, Grid, HardDrive, Hash, Home, Image, ImagePlus, Images, Info,
  Infinity as InfinityIcon, Key, KeyRound, Keyboard, Landmark, Layers, LayoutGrid, LayoutList,
  LayoutTemplate, Link, Link2, List, ListMusic, ListOrdered, Lock, LockOpen, Mail, Map, Maximize2,
  Minimize2, Monitor, MonitorPlay, Moon, Music, Music4, Network, PackageOpen, Paintbrush,
  Palette, Pen, Percent, PiggyBank, Pipette, QrCode, Radio, Receipt, RefreshCw, Repeat,
  Repeat2, Replace, Rewind, RotateCcw, RotateCw, Ruler, Scaling, ScanLine, Scissors, Search,
  Share2, ShieldAlert, ShieldCheck, ShoppingCart, Shuffle, Sigma, Sliders, Smartphone, Smile,
  Space, Spline, Square, SquarePen, SquareSplitHorizontal, Stamp, Star, Sun, SunMedium, Table,
  Table2, Tag, Thermometer, Timer, TrendingUp, Triangle, Type, Unlink, User, UserPlus, Video,
  Volume2, VolumeX, Wand2, Weight, Wifi, WrapText, Youtube, Zap,
  type LucideIcon,
} from "lucide-react";

export const ICONS: Record<string, LucideIcon> = {
  Activity, AlignLeft, Archive, ArrowLeftRight, ArrowUpDown, AtSign, AudioLines, AudioWaveform,
  BarChart2, Binary, Blend, Book, BookOpen, Bot, Braces, Briefcase, Cake, Calculator, Calendar,
  CalendarPlus, Camera, Captions, CheckSquare, Circle, Clapperboard, Clock, Code, Code2, Combine,
  Container, Contrast, CreditCard, Crop, Database, Dices, Divide, DollarSign, Eraser, Eye,
  FileCode, FileCode2, FileImage, FileJson, FilePlus2, FileSearch, FileSpreadsheet, FileText,
  FileType, Film, Filter, Fingerprint, Flame, FolderOpen, Frame, Fuel, Gauge, GitBranch,
  GitCommit, GitCompare, Globe, Grid, HardDrive, Hash, Home, Image, ImagePlus, Images,
  Infinity: InfinityIcon, Info, Key, KeyRound, Keyboard, Landmark, Layers, LayoutGrid,
  LayoutList, LayoutTemplate, Link, Link2, List, ListMusic, ListOrdered, Lock, LockOpen, Mail,
  Map, Maximize2, Minimize2, Monitor, MonitorPlay, Moon, Music, Music4, Network, PackageOpen,
  Paintbrush, Palette, Pen, Percent, PiggyBank, Pipette, QrCode, Radio, Receipt, RefreshCw,
  Repeat, Repeat2, Replace, Rewind, RotateCcw, RotateCw, Ruler, Scaling, ScanLine, Scissors,
  Search, Share2, ShieldAlert, ShieldCheck, ShoppingCart, Shuffle, Sigma, Sliders, Smartphone,
  Smile, Space, Spline, Square, SquarePen, SquareSplitHorizontal, Stamp, Star, Sun, SunMedium,
  Table, Table2, Tag, Thermometer, Timer, TrendingUp, Triangle, Type, Unlink, User, UserPlus,
  Video, Volume2, VolumeX, Wand2, Weight, Wifi, WrapText, Youtube, Zap,
};

// Per-category fallback icon + accent dot color (original palette, calm accents).
export const CATEGORY_META: Record<string, { icon: string; dot: string }> = {
  pdf: { icon: "FileText", dot: "#f87171" },
  image: { icon: "Image", dot: "#34d399" },
  video: { icon: "Video", dot: "#a78bfa" },
  text: { icon: "Type", dot: "#60a5fa" },
  developer: { icon: "Code2", dot: "#818cf8" },
  math: { icon: "Calculator", dot: "#fb923c" },
  converters: { icon: "ArrowLeftRight", dot: "#38bdf8" },
  color: { icon: "Palette", dot: "#f472b6" },
  crypto: { icon: "ShieldCheck", dot: "#4ade80" },
  network: { icon: "Globe", dot: "#22d3ee" },
  file: { icon: "FolderOpen", dot: "#eab308" },
  generators: { icon: "Wand2", dot: "#c084fc" },
  seo: { icon: "Search", dot: "#2dd4bf" },
  time: { icon: "Clock", dot: "#fda4af" },
  finance: { icon: "DollarSign", dot: "#86efac" },
  social: { icon: "Share2", dot: "#f0abfc" },
};

export function iconFor(name: string | null | undefined, category?: string): LucideIcon {
  if (name && ICONS[name]) return ICONS[name];
  const fallback = category ? CATEGORY_META[category]?.icon : undefined;
  return ICONS[fallback ?? "Wand2"];
}
