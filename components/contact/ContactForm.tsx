"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { isBdPhone, isPersonName, NAME_ERROR } from "@/lib/validators";
import { CONFIG } from "@/lib/config";

const TOPICS = ["Scent recommendation", "Order or delivery", "Custom engraving", "Gift help", "Something else"];

export function ContactForm() {
  const [values, setValues] = useState({ name: "", phone: "", topic: TOPICS[0], message: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sent, setSent] = useState(false);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!values.name.trim()) next.name = "Please fill in this field.";
    else if (!isPersonName(values.name)) next.name = NAME_ERROR;
    // Optional: WhatsApp already shows us the sender's number.
    if (values.phone.trim() && !isBdPhone(values.phone)) next.phone = "Please enter a valid Bangladeshi mobile number.";
    if (!values.message.trim()) next.message = "Please fill in this field.";
    setErrors(next);
    if (Object.keys(next).length) return;
    // The form used to stop here and show "we will reach out", so every message was lost. Now it goes out on WhatsApp.
    const text = [`Hi! I'm ${values.name.trim()}.`, `Topic: ${values.topic}`, ...(values.phone.trim() ? [`Phone: ${values.phone.trim()}`] : []), "", values.message.trim()].join("\n");
    window.open(`${CONFIG.whatsapp.split("?")[0]}?text=${encodeURIComponent(text)}`, "_blank", "noopener");
    setSent(true);
  };

  const bind = (key: "name" | "phone" | "message") => ({
    value: values[key],
    onChange: (e: { target: { value: string } }) => { setValues({ ...values, [key]: e.target.value }); setSent(false); },
  });

  return (
    <form className="contact-form-card" onSubmit={submit} noValidate>
      <span className="eyebrow">Send a message</span>
      <h2>What can we make easier?</h2>
      <p>We usually reply within one business day. For urgent order questions, WhatsApp may be faster.</p>
      <div className="form-grid">
        <div className="field">
          <label htmlFor="contactName">Name</label>
          <input id="contactName" type="text" autoComplete="name" placeholder="Your name" {...bind("name")} />
          <span className="field-error">{errors.name}</span>
        </div>
        <div className="field">
          <label htmlFor="contactPhone">Phone number <small>(optional)</small></label>
          <input id="contactPhone" type="tel" inputMode="tel" autoComplete="tel" placeholder="01XXXXXXXXX" maxLength={18} aria-describedby="contactPhoneHint" {...bind("phone")} />
          <span className="field-error">{errors.phone}</span>
          <span className="field-hint" id="contactPhoneHint">Use 01XXXXXXXXX or +8801XXXXXXXXX. We can reply by SMS, call, or WhatsApp.</span>
        </div>
        <div className="field full">
          <label htmlFor="contactTopic">What is this about?</label>
          <select id="contactTopic" value={values.topic} onChange={(e) => setValues({ ...values, topic: e.target.value })}>
            {TOPICS.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div className="field full">
          <label htmlFor="contactMessage">Message</label>
          <textarea id="contactMessage" placeholder="Tell us what you are wondering…" {...bind("message")} />
          <span className="field-error">{errors.message}</span>
        </div>
      </div>
      <button className="btn btn-primary" type="submit">Send on WhatsApp</button>
      <div className={`form-status${sent ? " is-visible" : ""}`} role="status">
        {sent && "WhatsApp is open with your message. Press send there and we will reply soon."}
      </div>
    </form>
  );
}
