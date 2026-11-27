import { BottleVisual } from "@/components/ui/BottleVisual";
import { MessengerIcon, WhatsAppIcon } from "@/components/ui/Icons";
import { CONFIG } from "@/lib/config";
import { db } from "@/lib/db";
import { CUSTOM_DESIGN } from "@/lib/server/images";
import { ProductGallery } from "@/components/products/ProductGallery";
import { getT } from "@/lib/i18n/server";

const LOOK = { liquid: "#a6b9a6", ink: "#405744", shape: "arch" as const };

/** Opening message for the WhatsApp chat (the customer gives the details in the chat). */
const WA_MESSAGE = "Hi! I would like a custom engraved bottle.\nScent:\nBottle size:\nEngraving text:";

/** Custom engraving request: photos of past designs (admin → Home page & content), or a drawn example bottle, and links to WhatsApp / Messenger. */
export async function CustomEngraving() {
  const images = (await db.productImage.findMany({ where: { itemId: CUSTOM_DESIGN }, select: { id: true }, orderBy: [{ sort: "asc" }, { id: "asc" }] }).catch(() => [])).map((r) => r.id);
  const t = await getT();
  const waHref = `${CONFIG.whatsapp.split("?")[0]}?text=${encodeURIComponent(WA_MESSAGE)}`;

  return (
    <div className="container custom-showcase">
      {images.length ? (
        <div className="custom-visual has-gallery" aria-label={t("Photos of our custom designs")}><ProductGallery product={{ name: t("Custom design"), images }} /></div>
      ) : (
      <div className="custom-visual" aria-label={t("Example of an engraved perfume bottle")}>
        <BottleVisual
          id="customBottleVisual" shape={LOOK.shape} liquid={LOOK.liquid} ink={LOOK.ink} className="size-50"
          title={t("Your words here")}
          subtitle={t("50 ml bottle")}
        />
      </div>
      )}

      <div className="contact-cta-card">
        <span className="eyebrow">{t("Start a custom request")}</span>
        <h2>{t("Tell us the small details.")}</h2>
        <p>{t("Message us on WhatsApp or Messenger with the scent, the bottle size and the words you want. We will confirm spelling and placement before anything is engraved.")}</p>
        <div className="contact-cta-btns">
          <a className="cta-wa-btn" href={waHref} target="_blank" rel="noreferrer"><WhatsAppIcon className="cta-btn-icon" />{t("Chat on WhatsApp")}</a>
          <a className="cta-ms-btn" href={CONFIG.messenger} target="_blank" rel="noreferrer"><MessengerIcon className="cta-btn-icon" />{t("Message on Messenger")}</a>
        </div>
        <p className="contact-cta-note">{t("We usually reply within a few hours · No commitment needed to ask")}</p>
      </div>
    </div>
  );
}
