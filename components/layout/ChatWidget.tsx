"use client";

import { useT } from "@/components/providers/PrefsProvider";
import { useEffect, useRef } from "react";
import { ChatIcon } from "@/components/ui/Icons";
import { useUI } from "@/components/providers/UIProvider";
import { CONFIG } from "@/lib/config";

const OPTIONS = [
  { k: "wa", label: "WhatsApp", hint: "Quick chat", href: CONFIG.whatsapp, color: "#55a66b" },
  { k: "ms", label: "Messenger", hint: "Ask on Facebook", href: CONFIG.messenger, color: "#777dd1" },
  { k: "fb", label: "Facebook", hint: "See updates", href: CONFIG.facebook, color: "#7892c7" },
];

export function ChatWidget() {
  const { chatOpen, setChatOpen } = useUI();
  const wrap = useRef<HTMLDivElement>(null);
  const t = useT();

  useEffect(() => {
    if (!chatOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setChatOpen(false);
    };
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, [chatOpen, setChatOpen]);

  return (
    <div className={`chatbot-wrap${chatOpen ? " is-open" : ""}`} ref={wrap}>
      <div className={`chat-panel${chatOpen ? " is-open" : ""}`} id="chatPanel" aria-hidden={!chatOpen}>
        <div className="chat-panel-header">
          <strong>{t("Have a doubt?")}</strong>
          <span>{t("We are here to help. Choose what feels easiest.")}</span>
        </div>
        <div className="chat-options">
          {OPTIONS.map((o) => (
            <a key={o.k} className="chat-option" href={o.href} target="_blank" rel="noreferrer" tabIndex={chatOpen ? 0 : -1}>
              <span className="chat-option-icon" style={{ ["--channel" as string]: o.color }}>{o.k}</span>
              <span><strong>{o.label}</strong><small>{t(o.hint)}</small></span>
            </a>
          ))}
        </div>
      </div>
      <button className="chat-trigger" type="button" aria-label={t("Open contact options")} aria-controls="chatPanel" aria-expanded={chatOpen} onClick={() => setChatOpen(!chatOpen)}>
        <ChatIcon />
      </button>
    </div>
  );
}
