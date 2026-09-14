import { createContext, useContext } from "react";
import type { ToolDef } from "../lib/registry";

export const ToolDefContext = createContext<ToolDef | null>(null);

/** Metadata for the tool currently being rendered (set by ToolPage). */
export function useTool(): ToolDef {
  const def = useContext(ToolDefContext);
  if (!def) throw new Error("useTool must be used inside a tool page");
  return def;
}
