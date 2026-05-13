"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity } from "lucide-react";

type LivePulseProps = {
  isThinking?: boolean;
  label?: string;
};

export function LivePulse({ isThinking = false, label }: LivePulseProps) {
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setPulse((p) => !p), 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-2">
      <div className="relative flex items-center gap-1.5">
        <div className="relative h-2 w-2">
          <motion.div
            animate={{
              scale: pulse ? [1, 1.6, 1] : 1,
              opacity: pulse ? [1, 0.3, 1] : 0.6,
            }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            className={`absolute inset-0 rounded-full ${
              isThinking ? "bg-amber-400" : "bg-emerald-400"
            }`}
          />
          <div
            className={`absolute inset-0 rounded-full ${
              isThinking ? "bg-amber-400" : "bg-emerald-400"
            }`}
          />
        </div>

        <AnimatePresence mode="wait">
          {isThinking ? (
            <motion.div
              key="thinking"
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              className="flex items-center gap-1 overflow-hidden"
            >
              <Activity className="h-3 w-3 text-amber-400" />
              <span className="whitespace-nowrap text-[10px] font-semibold text-amber-300">
                Processing
              </span>
              <motion.span
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 1.2, repeat: Infinity }}
                className="text-[10px] text-amber-400"
              >
                ...
              </motion.span>
            </motion.div>
          ) : (
            <motion.span
              key="ready"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-[10px] font-medium text-slate-500"
            >
              {label ?? "System Ready"}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
