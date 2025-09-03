"use client";

import React from "react";
import { Wand2 } from "lucide-react";

type Props = {
  model?: string;
  onViewPrompt?: () => void;
  className?: string;
};

export default function AIAttributionBadge({ model = "Gemini / Imagen", onViewPrompt, className = "" }: Props) {
  return (
    <div className={`inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-2 py-1 text-xs text-white ${className}`}>
      <Wand2 className="h-3.5 w-3.5" aria-hidden />
      <span>Generated with {model}</span>
      {onViewPrompt && (
        <button onClick={onViewPrompt} className="underline underline-offset-2 hover:text-white">
          View prompt
        </button>
      )}
    </div>
  );
}

