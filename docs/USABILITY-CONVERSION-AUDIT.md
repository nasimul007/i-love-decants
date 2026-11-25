# I Love Decants: usability and conversion audit

Branch `ux/usability-conversion-audit` (made from `main` at `5c4ca3b`). **Not merged into `main`.**
Audited with The Technical Team's usability and conversion checklist, on the whole storefront at 1440 px (desktop) and 375 px (phone). Pages: home, shop, product pop-up, bag, checkout, contact. The admin was reviewed in earlier rounds (see `CHANGES-perfume-parameters.md`).

Findings are ranked by expected impact: offer and form friction first, then proof and CTA, then speed, then polish.

## Fixed on this branch

| # | Checklist item | What was wrong | Why it costs sales | Fix |
|---|---|---|---|---|
| 1 | Forms | **Contact form discarded every message.** It checked the fields, then said "We will reach out on the number you shared" and sent nothing anywhere. | Every enquiry (often a buyer asking which scent to pick) was lost, and the customer waited for a reply that never came. | The form now opens WhatsApp to the shop's number with the name, topic and message already typed; the customer just presses send. Phone became optional (WhatsApp shows it), so one less field. Button: "Send on WhatsApp". Fits the client rule that customers are directed to WhatsApp/Messenger. `ContactForm.tsx` |
| 2 | 5-second hero | The hero said "A little scent. A lot of feeling." but never said *what* is sold or *to whom*; the subhead was 26 words. | Visitors decide in ~5 seconds whether to stay. | Added an eyebrow above the headline: "Authentic perfume decants · Delivered across Bangladesh". Subhead cut to 18 words: "Try authentic perfumes in small sizes, 3 ml to 100 ml. Pay only for what you will actually wear." The brand headline is kept. `app/(shop)/page.tsx` |
| 3 | CTA copy | Main button "Explore the collection" stated no value. | Value-led CTAs convert better than generic ones. | "Shop decants from ৳230", using the live lowest price (it follows sales and admin prices). `components/home/FromPrice.tsx` |
| 4 | Trust by the CTA | Hero promises were vague ("Authentic scents", "Calm help, never pressure"). | Vague badges have about zero effect; specific facts reduce doubt. | Specific facts from the site's own settings: "Cash on delivery, no advance payment", "৳80 delivery inside Dhaka", "Poured from original bottles". |
| 5 | Proof where doubt peaks | The product pop-up had nothing reassuring next to "Add to cart". | That's where buyers hesitate. | One line under the price: "Cash on delivery · 1–2 day delivery inside Dhaka · Poured from original bottles". These are the same facts as the Delivery and How-we-work pages. `ProductModal.tsx` |
| 6 | Mobile sticky CTA | On phones, the price and Add button scrolled out of view while reading notes. | Mobile is most traffic and converts worst; a sticky action captures intent. | On phones, the price and **Add to cart** stay pinned to the bottom of the pop-up. Desktop is unchanged. `globals.css` (phone block) |
| 7 | Checkout friction | Name, phone and address had no autofill hints; the "Delivery charge" field had no linked label. The button said only "Confirm Order". | Autofill saves typing on phones; a risk-reversing CTA reduces last-second doubt. | `autoComplete` = name / tel / street-address; labelled field. The button now says **"Place order, pay on delivery"**. `CheckoutView.tsx` |
| 8 | Hidden bug | The checkout labelled "Inside Dhaka" by comparing with a hard-coded `80`. | A delivery price change in settings would mislabel every order. | Compares with the configured charge. |
| 9 | Reliability (empty shop) | A brief database error made the shop show "0 scents" with no retry. The developer's history has a "db timeout" fix, so this happens live too. | Customers see an empty store and leave. | Data requests retry twice on server errors (500 ms, then 1 s) before giving up. Sign-in errors are not retried. `lib/api/client.ts` |
| 10 | Button states | No pressed state; disabled buttons didn't look disabled (except while loading). | The site felt less responsive, and it wasn't clear when a button couldn't be used. | Pressed = slight shrink; disabled = faded with a "not allowed" cursor; loading keeps its own look. `globals.css` |
| 11 | Copy | 20+ em-dashes in customer-facing sentences. | Readers increasingly read these as machine-written, which lowers trust. | Rewritten with commas, colons or full stops; same meaning. Page titles keep their " — I Love Decants" separator. |

**Verified on a local production build:** home, shop, product pop-up (desktop and phone), contact (WhatsApp message built correctly), checkout. No sideways scrolling at 375 px. Typecheck and build pass.

## Found but not changed (need a decision, real data or bigger work)

| Checklist item | Finding | Recommendation |
|---|---|---|
| Social proof | No reviews, ratings, customer counts or named testimonials anywhere. This is the biggest remaining gap. | Collect 5–10 real customer messages/reviews (with permission) and show one named testimonial near the hero, plus a real count ("1,200+ orders delivered") once it's true. A reviews feature is Level 3. **Never invent these.** |
| Guarantee | No visible promise beside the Add button (e.g. "Wrong or damaged? We replace it"). | The returns page already says damaged items are made right within 24 hours; the client could state it next to the button. |
| Sign-up form | Account creation needs a password (5 fields). | Guest checkout already works, which is the important part. Later: phone/OTP or email magic-link sign-in. |
| Type scale | 12–15 different font sizes per page (checklist: ≤6). | A design-system pass for the designer: map all sizes onto 6 steps. Not changed here, to keep the current look. |
| Product descriptions | Some seeded descriptions contain em-dashes (database content). | Edit in Admin → Inventory → Edit if wanted. |
| Speed | Home page: ~41 KB transferred, layout shift 0.037 (good, target < 0.1). | Upload compressed product photos (the admin already shrinks uploads). |
| Product pages | Products open only in a pop-up. | Own page per perfume (SEO, sharing, ads landing pages). Level 2. |

## Files changed on this branch
`app/(shop)/page.tsx`, `components/home/FromPrice.tsx` (new), `components/layout/ProductModal.tsx`, `components/checkout/CheckoutView.tsx`, `components/contact/ContactForm.tsx`, `lib/api/client.ts`, `app/globals.css`, em-dash copy in `app/(shop)/{contact,custom,delivery-returns,how-decants-work,how-we-work,order-confirmation,products}/page.tsx`, `components/products/{ProductsView,ProductGallery}.tsx`, `components/layout/ChatWidget.tsx`, `components/account/AccountView.tsx`, and this report.
