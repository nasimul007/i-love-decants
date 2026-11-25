import type { GiftSet, OilProduct, Product } from "@/types";

export const PRODUCTS: Product[] = 
[
{
  id: 1,
  name: "Quiet Bloom",
  family: "Floral",
  badge: "Soft favourite",
  notes: "Pear skin · peony · rice musk",
  description: "A tender floral with a clean, weightless finish. Easy for daytime, close spaces, and anyone who prefers fragrance that never enters before they do.",
  top: "Pear, bergamot",
  heart: "Peony, iris",
  base: "Rice musk, pale woods",
  liquid: "#d8a9b8",
  pale: "#edd8df",
  ink: "#704352",
  shape: "arch",
  prices: { 3: 260, 6: 470, 9: 650, 15: 990, 50: 2850 }
},
{
  id: 2,
  name: "Soft Oud",
  family: "Woods",
  badge: "Quiet depth",
  notes: "Saffron · soft oud · skin amber",
  description: "Oud made calm and wearable: warm, smooth, and intimate rather than loud. A reassuring evening scent with an easy, polished trail.",
  top: "Saffron, pink pepper",
  heart: "Soft oud, rosewood",
  base: "Amber, clean musk",
  liquid: "#b58a71",
  pale: "#e7d6c8",
  ink: "#654838",
  shape: "square",
  prices: { 3: 320, 6: 580, 9: 790, 15: 1200, 50: 3350 }
},
{
  id: 3,
  name: "Linen Sky",
  family: "Fresh",
  badge: "Everyday ease",
  notes: "Neroli · cotton air · white tea",
  description: "The feeling of sunlit linen and an open window. Crisp at first, then soft and airy on skin for an uncomplicated everyday reach.",
  top: "Neroli, lemon leaf",
  heart: "White tea, cotton air",
  base: "Blonde wood, musk",
  liquid: "#a9c1bd",
  pale: "#dfeae7",
  ink: "#45605b",
  shape: "tall",
  prices: { 3: 240, 6: 430, 9: 590, 15: 890, 50: 2500 }
},
{
  id: 4,
  name: "Vanilla Veil",
  family: "Amber",
  badge: "Comfort scent",
  notes: "Vanilla milk · almond · sandalwood",
  description: "A soft vanilla without sticky sweetness. Milky almond and sandalwood keep it creamy, clean, and comforting from morning to late evening.",
  top: "Almond, pear milk",
  heart: "Vanilla orchid",
  base: "Sandalwood, white musk",
  liquid: "#d9bd92",
  pale: "#f0e3ca",
  ink: "#6f5434",
  shape: "round",
  prices: { 3: 280, 6: 500, 9: 690, 15: 1050, 50: 3000 }
},
{
  id: 5,
  name: "Sage Rain",
  family: "Fresh",
  badge: "Clean calm",
  notes: "Sage leaf · rainwater · pale cedar",
  description: "Cool green air after rain. Gentle sage and translucent woods create a mild, quietly refreshing scent for warm days and clear minds.",
  top: "Rainwater, petitgrain",
  heart: "Clary sage, violet leaf",
  base: "Pale cedar, moss",
  liquid: "#92a98f",
  pale: "#dce7d9",
  ink: "#455b45",
  shape: "square",
  prices: { 3: 250, 6: 450, 9: 620, 15: 940, 50: 2700 }
},
{
  id: 6,
  name: "Lavender Hush",
  family: "Floral",
  badge: "Bedtime soft",
  notes: "Lavender mist · iris · cashmere musk",
  description: "Lavender softened with iris and cashmere musk. Serene, powdery, and close to the skin—designed to comfort rather than announce itself.",
  top: "Lavender mist, pear",
  heart: "Iris, heliotrope",
  base: "Cashmere musk",
  liquid: "#afa3c1",
  pale: "#e7e2ef",
  ink: "#5f5471",
  shape: "arch",
  prices: { 3: 270, 6: 490, 9: 670, 15: 1020, 50: 2900 }
},
{
  id: 7,
  name: "Amber Light",
  family: "Amber",
  badge: "Golden glow",
  notes: "Mandarin · sheer amber · tonka",
  description: "A golden amber with plenty of breathing room. Mandarin opens the scent, while sheer resins and tonka settle into a soft, familiar warmth.",
  top: "Mandarin, cardamom",
  heart: "Sheer amber, labdanum",
  base: "Tonka, vanilla wood",
  liquid: "#c99b61",
  pale: "#eddcbe",
  ink: "#6b4a26",
  shape: "round",
  prices: { 3: 300, 6: 540, 9: 740, 15: 1120, 50: 3200 }
},
{
  id: 8,
  name: "Citrus Silk",
  family: "Fresh",
  badge: "Bright & mild",
  notes: "Yuzu · orange blossom · silk musk",
  description: "A smooth citrus with none of the sharp edges. Yuzu and orange blossom feel bright and clean, then settle into a silky skin musk.",
  top: "Yuzu, sweet lime",
  heart: "Orange blossom, tea",
  base: "Silk musk, cedar",
  liquid: "#d8c576",
  pale: "#f1eac7",
  ink: "#6e622b",
  shape: "tall",
  prices: { 3: 230, 6: 420, 9: 570, 15: 860, 50: 2450 }
},
{
  id: 9,
  name: "Moon Musk",
  family: "Floral",
  badge: "Skin scent",
  notes: "Aldehydes · white rose · cloud musk",
  description: "A clean, softly glowing musk that feels like freshly moisturised skin. Subtle florals keep it polished while the finish remains intimate.",
  top: "Soft aldehydes, pear",
  heart: "White rose, iris",
  base: "Cloud musk, ambrette",
  liquid: "#c4b7bd",
  pale: "#ebe4e7",
  ink: "#62555c",
  shape: "square",
  prices: { 3: 290, 6: 520, 9: 710, 15: 1080, 50: 3100 }
}
];

export const GIFTS: GiftSet[] = [
  {
    id: "gift-discovery",
    name: "Gentle Discovery Six",
    description: "Six 3 ml decants, softly wrapped with a handwritten scent guide.",
    price: 1490,
    accent: "#d6acba",
  },
  {
    id: "gift-trio",
    name: "The Serenity Trio",
    description: "Three 15 ml favourites in a reusable linen-touch presentation box.",
    price: 2790,
    accent: "#9eb09f",
  },
  {
    id: "gift-signature",
    name: "Signature Gift Bottle",
    description: "One 50 ml bottle with gift wrap, a personal message, and optional engraving.",
    price: 3290,
    accent: "#b2a6c4",
  },
];

const OIL_BRANDS = [
  "Al Rehab", "Al Wataniah", "Rayhaan", "Paris Corner", "Victoria's Secret", "Huda Beauty",
  "Ahmed Al Magribi", "Elizabeth Arden", "Maison Al Hambra", "Lattafa", "Maison Asrar", "Rasasi",
  "Zimaya", "Burberry", "French Avenue", "Nusuk", "Gulf Orchid", "Yusuf Bhai",
];

export const OILS: OilProduct[] = OIL_BRANDS.map((brand, index) => ({
  id: `oil-${index}`,
  brand,
  name: `${brand} Roll-On`,
  price: 350,
}));

export const CUSTOM_SCENTS = ["Quiet Bloom", "Soft Oud", "Linen Sky", "Vanilla Veil", "Sage Rain", "Lavender Hush"];
