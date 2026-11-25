import { BottleVisual } from "@/components/ui/BottleVisual";
import { MessengerIcon, WhatsAppIcon } from "@/components/ui/Icons";
import { CONFIG } from "@/lib/config";

const LOOK = { liquid: "#a6b9a6", ink: "#405744", shape: "arch" as const };

/** Opening message for the WhatsApp chat (the customer gives the details in the chat). */
const WA_MESSAGE = "Hi! I would like a custom engraved bottle.\nScent:\nBottle size:\nEngraving text:";

/** Custom engraving request: an example bottle and a direct link to WhatsApp. */
export function CustomEngraving() {
  const waHref = `${CONFIG.whatsapp.split("?")[0]}?text=${encodeURIComponent(WA_MESSAGE)}`;

  return (
    <div className="container custom-showcase">
      <div className="custom-visual" aria-label="Example of an engraved perfume bottle">
        <BottleVisual
          id="customBottleVisual" shape={LOOK.shape} liquid={LOOK.liquid} ink={LOOK.ink} className="size-50"
          title="Your words here"
          subtitle="50 ml bottle"
        />
      </div>

      <div className="contact-cta-card">
        <span className="eyebrow">Start a custom request</span>
        <h2>Tell us the small details.</h2>
        <p>Message us on WhatsApp or Messenger with the scent, the bottle size and the words you want. We will confirm spelling and placement before anything is engraved.</p>
        <div className="contact-cta-btns">
          <a className="cta-wa-btn" href={waHref} target="_blank" rel="noreferrer"><WhatsAppIcon className="cta-btn-icon" />Chat on WhatsApp</a>
          <a className="cta-ms-btn" href={CONFIG.messenger} target="_blank" rel="noreferrer"><MessengerIcon className="cta-btn-icon" />Message on Messenger</a>
        </div>
        <p className="contact-cta-note">We usually reply within a few hours · No commitment needed to ask</p>
      </div>
    </div>
  );
}
