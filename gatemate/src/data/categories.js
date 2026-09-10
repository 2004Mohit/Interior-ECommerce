// DEVELOPMENT DEMO DATA
// Replace with Supabase catalogue data when backend catalogue is connected.

export const CATEGORY_IMAGES = {
  Cement:
    "https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&w=600&q=80",
  "Steel & TMT":
    "https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=600&q=80",
  "Bricks & Blocks":
    "https://images.unsplash.com/photo-1584463623578-301147571343?auto=format&fit=crop&w=600&q=80",
  "Sand & Aggregates":
    "https://images.unsplash.com/photo-1578844251758-2f71da64c96f?auto=format&fit=crop&w=600&q=80",
  Plumbing:
    "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=600&q=80",
  Electrical:
    "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80",
  "Pipes & Fittings":
    "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80",
  "Plywood & Boards":
    "https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=600&q=80",
  Roofing:
    "https://images.unsplash.com/photo-1632759145351-1d592919f522?auto=format&fit=crop&w=600&q=80",
  "Paints & Construction Chemicals":
    "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=600&q=80",
  Hardware:
    "https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?auto=format&fit=crop&w=600&q=80",
  Tools:
    "https://images.unsplash.com/photo-1581147036324-c17ac41dfa6c?auto=format&fit=crop&w=600&q=80",
  Waterproofing:
    "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=600&q=80",
  "Adhesives & Sealants":
    "https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?auto=format&fit=crop&w=600&q=80",
};

export const CATALOGUE_CATEGORIES = [
  {
    id: "cement",
    slug: "cement",
    name: "Cement",
    descriptor: "OPC 53, PPC & Weather-Shield Bags",
    image: CATEGORY_IMAGES["Cement"],
    isNew: false,
    isHot: true,
    displayOrder: 1,
  },
  {
    id: "steel-tmt",
    slug: "steel-tmt",
    name: "Steel & TMT",
    descriptor: "Fe 550D Rebars & Structural Billets",
    image: CATEGORY_IMAGES["Steel & TMT"],
    isNew: false,
    isHot: true,
    displayOrder: 2,
  },
  {
    id: "bricks-blocks",
    slug: "bricks-blocks",
    name: "Bricks & Blocks",
    descriptor: "AAC Lightweight Blocks & Red Bricks",
    image: CATEGORY_IMAGES["Bricks & Blocks"],
    isNew: false,
    isHot: false,
    displayOrder: 3,
  },
  {
    id: "sand-aggregates",
    slug: "sand-aggregates",
    name: "Sand & Aggregates",
    descriptor: "Crushed M-Sand, Plaster Sand & 20mm Grit",
    image: CATEGORY_IMAGES["Sand & Aggregates"],
    isNew: false,
    isHot: false,
    displayOrder: 4,
  },
  {
    id: "plumbing",
    slug: "plumbing",
    name: "Plumbing",
    descriptor: "CPVC, SWR Pipes & Commercial Water Tanks",
    image: CATEGORY_IMAGES["Plumbing"],
    isNew: false,
    isHot: false,
    displayOrder: 5,
  },
  {
    id: "electrical",
    slug: "electrical",
    name: "Electrical",
    descriptor: "FR Copper Cables, MCBs & Switchgear",
    image: CATEGORY_IMAGES["Electrical"],
    isNew: false,
    isHot: false,
    displayOrder: 6,
  },
  {
    id: "pipes-fittings",
    slug: "pipes-fittings",
    name: "Pipes & Fittings",
    descriptor: "UPVC, GI Couplers, Elbows & Brass Valves",
    image: CATEGORY_IMAGES["Pipes & Fittings"],
    isNew: false,
    isHot: false,
    displayOrder: 7,
  },
  {
    id: "plywood-boards",
    slug: "plywood-boards",
    name: "Plywood & Boards",
    descriptor: "Film-Faced Shuttering & Marine BWP Ply",
    image: CATEGORY_IMAGES["Plywood & Boards"],
    isNew: false,
    isHot: false,
    displayOrder: 8,
  },
  {
    id: "roofing",
    slug: "roofing",
    name: "Roofing",
    descriptor: "Color Coated Profile Sheets & Polycarbonate",
    image: CATEGORY_IMAGES["Roofing"],
    isNew: false,
    isHot: false,
    displayOrder: 9,
  },
  {
    id: "waterproofing",
    slug: "waterproofing",
    name: "Waterproofing",
    descriptor: "SBR Latex, Damp Proof Coatings & Chemical Admixtures",
    image: CATEGORY_IMAGES["Waterproofing"],
    isNew: true,
    isHot: false,
    displayOrder: 10,
  },
  {
    id: "paints-construction-chemicals",
    slug: "paints-construction-chemicals",
    name: "Paints & Construction Chemicals",
    descriptor: "Polymer Wall Putty, Primers & Concrete Additives",
    image: CATEGORY_IMAGES["Paints & Construction Chemicals"],
    isNew: false,
    isHot: false,
    displayOrder: 11,
  },
  {
    id: "hardware",
    slug: "hardware",
    name: "Hardware",
    descriptor: "Anchor Fasteners, Gate Latches & Heavy Hardware",
    image: CATEGORY_IMAGES["Hardware"],
    isNew: false,
    isHot: true,
    displayOrder: 12,
  },
  {
    id: "tools",
    slug: "tools",
    name: "Tools",
    descriptor: "Tile Cutters, Angle Grinders & Rebar Benders",
    image: CATEGORY_IMAGES["Tools"],
    isNew: false,
    isHot: false,
    displayOrder: 13,
  },
];
