"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Send, X, Phone, Sparkles } from "lucide-react";

import { getActionChips } from "@/src/lib/BehaviorEngine";
import {
  generateSocraticVedicResponse,
  generateAdaptiveLesson,
  formatAdaptiveLessonAsText,
} from "@/src/lib/MockDataEngine";
import { LAUNCH_PHONE_DISPLAY, LAUNCH_WHATSAPP_URL } from "@/src/lib/marketing-constants";
import { LivePulse } from "./LivePulse";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const BRANDING = "Powered by Pinnacle Software Solution | Mastery Verified.";

const MOCK_RESPONSES: Record<string, string> = {
  default:
    `Great question! Based on CBSE curriculum standards, I'd recommend focusing on structured practice with regular self-assessment. Break the concept into 3 parts: definition, formula/rule, and application. Then test yourself with 2-3 problems.\n\n${BRANDING}`,
  explain:
    `Here's a clear explanation:\n\n1. Start with the core definition — what does this concept mean in simple terms?\n2. Identify the key formula or rule that governs it.\n3. Apply it to one real example from your textbook.\n4. Try modifying the example to test edge cases.\n\nThis method follows CBSE board exam marking patterns where structured working earns partial credit.\n\n${BRANDING}`,
  challenge:
    `Here's your quick challenge:\n\nSolve this without a calculator — use only mental math or Vedic shortcuts:\n• Problem: What is 97 × 103?\n• Hint: Use the (a+b)(a-b) = a² - b² identity where a=100, b=3.\n• Answer: 10000 - 9 = 9991\n\nTime yourself and try 3 more similar problems!\n\n${BRANDING}`,
  strategy:
    `Effective study strategy for this module:\n\n• Week 1-2: Learn core concepts (30 min/day)\n• Week 3: Practice problems with timer (25 min blocks)\n• Week 4: Mock test + error analysis\n• Daily: 5-minute quick recall before sleep\n\nConsistency beats intensity. Track your streak!\n\n${BRANDING}`,
};

function detectMultiplication(input: string): [number, number] | null {
  const patterns = [
    /(\d+)\s*[x×*]\s*(\d+)/i,
    /(\d+)\s+times\s+(\d+)/i,
    /multiply\s+(\d+)\s*(?:and|by|with|,)\s*(\d+)/i,
    /what\s+is\s+(\d+)\s*[x×*]\s*(\d+)/i,
    /(\d+)\s*\*\s*(\d+)/,
  ];
  for (const pat of patterns) {
    const m = input.match(pat);
    if (m) return [parseInt(m[1], 10), parseInt(m[2], 10)];
  }
  return null;
}

const TECH_TOPICS = [
  "deepseek", "canva", "scratch", "python", "chatgpt", "gemini",
  "ai", "coding", "programming", "prompt", "design", "robotics",
  "machine learning", "data science", "javascript", "html", "css",
];

function detectTechTopic(input: string): string | null {
  const lower = input.toLowerCase();
  for (const topic of TECH_TOPICS) {
    if (lower.includes(topic)) return topic;
  }
  return null;
}

function detectGrade(input: string): number | null {
  const m = input.match(/(?:class|grade|std|standard)\s*(\d{1,2})/i)
    ?? input.match(/(\d{1,2})(?:th|st|nd|rd)\s*(?:grade|class|std|standard)/i)
    ?? input.match(/(?:i(?:'| a)?m\s+(?:in\s+)?(?:class|grade|std)?\s*)(\d{1,2})/i);
  if (m) {
    const g = parseInt(m[1], 10);
    if (g >= 1 && g <= 12) return g;
  }
  return null;
}

function getMockResponse(input: string, _moduleSlug: string, grade: number | null): string {
  const mult = detectMultiplication(input);
  if (mult) {
    const phases = generateSocraticVedicResponse(mult[0], mult[1]);
    return phases.map((p) => `${p.label}\n${p.content}`).join("\n\n");
  }

  const topic = detectTechTopic(input);
  if (topic) {
    const g = grade ?? detectGrade(input) ?? 8;
    const lesson = generateAdaptiveLesson(topic, g);
    return formatAdaptiveLessonAsText(lesson);
  }

  const lower = input.toLowerCase();
  if (lower.includes("explain") || lower.includes("what is") || lower.includes("how"))
    return MOCK_RESPONSES.explain;
  if (lower.includes("challenge") || lower.includes("quiz") || lower.includes("test"))
    return MOCK_RESPONSES.challenge;
  if (lower.includes("strategy") || lower.includes("plan") || lower.includes("schedule"))
    return MOCK_RESPONSES.strategy;
  return MOCK_RESPONSES.default;
}

type AIChatPanelProps = {
  moduleSlug: string;
  moduleTitle: string;
};

export function AIChatPanel({ moduleSlug, moduleTitle }: AIChatPanelProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: `Welcome to ${moduleTitle}! I'm your AI study companion. Ask me anything — try topics like DeepSeek, Canva, Scratch, or Python. Mention your class (e.g., "I'm in Class 4") for a personalised lesson.\n\nPowered by Pinnacle Software Solution | Mastery Verified.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [userGrade, setUserGrade] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const chips = getActionChips(moduleSlug);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, thinking]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || thinking) return;

    const detected = detectGrade(text);
    if (detected) setUserGrade(detected);

    const userMsg: ChatMessage = { role: "user", content: text.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setThinking(true);

    await new Promise((r) => setTimeout(r, 1200 + Math.random() * 800));

    const effectiveGrade = detected ?? userGrade;
    const response = getMockResponse(text, moduleSlug, effectiveGrade);
    setMessages((prev) => [...prev, { role: "assistant", content: response }]);
    setThinking(false);
  };

  const handleChipClick = (prompt: string) => {
    void sendMessage(prompt);
  };

  return (
    <>
      {/* Floating Chat Button */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-6 left-6 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-violet-500 shadow-lg shadow-cyan-500/20 transition hover:shadow-xl hover:shadow-cyan-500/30"
          >
            <MessageCircle className="h-5 w-5 text-white" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="fixed bottom-6 left-6 z-50 flex h-[520px] w-[380px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-900/98 shadow-2xl shadow-black/40 backdrop-blur-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/[0.06] bg-white/[0.02] px-4 py-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-cyan-400" />
                <div>
                  <p className="text-xs font-bold text-white">AI Assistant</p>
                  <LivePulse isThinking={thinking} label="Mock Mode" />
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-slate-500 transition hover:bg-white/5 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
                      msg.role === "user"
                        ? "rounded-br-md bg-cyan-500/20 text-cyan-50"
                        : "rounded-bl-md bg-white/[0.04] text-slate-200"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </motion.div>
              ))}

              {thinking && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="rounded-2xl rounded-bl-md bg-white/[0.04] px-4 py-3">
                    <div className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          animate={{ y: [0, -4, 0] }}
                          transition={{
                            duration: 0.6,
                            repeat: Infinity,
                            delay: i * 0.15,
                          }}
                          className="h-1.5 w-1.5 rounded-full bg-cyan-400"
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Action Chips */}
            <div className="flex gap-1.5 overflow-x-auto border-t border-white/[0.04] px-4 py-2">
              {chips.map((chip) => (
                <button
                  key={chip.label}
                  onClick={() => handleChipClick(chip.prompt)}
                  disabled={thinking}
                  className="shrink-0 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[10px] font-medium text-slate-300 transition hover:border-cyan-500/30 hover:bg-cyan-500/10 hover:text-cyan-200 disabled:opacity-40"
                >
                  {chip.label}
                </button>
              ))}
            </div>

            {/* WhatsApp Quick-Link */}
            <div className="border-t border-white/[0.04] px-4 py-1.5">
              <a
                href={LAUNCH_WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 rounded-lg bg-emerald-500/10 px-3 py-1.5 text-[10px] font-medium text-emerald-300 transition hover:bg-emerald-500/20"
              >
                <Phone className="h-3 w-3" />
                Stuck? Chat with Pinnacle Support ({LAUNCH_PHONE_DISPLAY})
              </a>
            </div>

            {/* Input */}
            <div className="border-t border-white/[0.06] bg-white/[0.01] p-3">
              <div className="flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void sendMessage(input);
                    }
                  }}
                  placeholder="Ask your study doubt..."
                  disabled={thinking}
                  className="flex-1 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:border-cyan-500/40 focus:outline-none disabled:opacity-50"
                />
                <button
                  onClick={() => void sendMessage(input)}
                  disabled={thinking || !input.trim()}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-500 text-slate-950 transition hover:bg-cyan-400 disabled:opacity-40"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
