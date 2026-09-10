// DEVELOPMENT DEMO DATA
// Replace with Supabase catalogue data when backend catalogue is connected.

export const CATEGORY_IMAGES = {
  "Wires & Cables":
    "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80",
  "Switches & Sockets":
    "https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=600&q=80",
  "Conduits, Boxes & Fittings":
    "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80",
  "MCB, RCCB & DB":
    "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=600&q=80",
  "Plywood, MDF & HDHMR":
    "https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=600&q=80",
  "Hinges & Channels":
    "https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?auto=format&fit=crop&w=600&q=80",
  "Kitchen & Wardrobe Hardware":
    "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=600&q=80",
  "Fevicol & Sealants":
    "https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?auto=format&fit=crop&w=600&q=80",
  "Plumbing Pipes, Fittings & Tanks":
    "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=600&q=80",
  "Sanitary & Bath Fittings":
    "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80",
};

export const CATALOGUE_CATEGORIES = [
  {
    id: "wires-cables",
    slug: "wires-cables",
    name: "Wires & Cables",
    descriptor: "FR House Wires & Flexible Cables",
    image: CATEGORY_IMAGES["Wires & Cables"],
    isNew: false,
    isHot: true,
    displayOrder: 1,
  },
  {
    id: "switches-sockets",
    slug: "switches-sockets",
    name: "Switches & Sockets",
    descriptor: "Modular Plates, Regulators & USBs",
    image: CATEGORY_IMAGES["Switches & Sockets"],
    isNew: false,
    isHot: false,
    displayOrder: 2,
  },
  {
    id: "conduits-boxes-fittings",
    slug: "conduits-boxes-fittings",
    name: "Conduits, Boxes & Fittings",
    descriptor: "PVC Conduits, Junctions & Bends",
    image: CATEGORY_IMAGES["Conduits, Boxes & Fittings"],
    isNew: false,
    isHot: false,
    displayOrder: 3,
  },
  {
    id: "mcb-rccb-db",
    slug: "mcb-rccb-db",
    name: "MCB, RCCB & DB",
    descriptor: "Distribution Boards & Circuit Breakers",
    image: CATEGORY_IMAGES["MCB, RCCB & DB"],
    isNew: true,
    isHot: false,
    displayOrder: 4,
  },
  {
    id: "plywood-mdf-hdhmr",
    slug: "plywood-mdf-hdhmr",
    name: "Plywood, MDF & HDHMR",
    descriptor: "Commercial & Waterproof Boards",
    image: CATEGORY_IMAGES["Plywood, MDF & HDHMR"],
    isNew: false,
    isHot: false,
    displayOrder: 5,
  },
  {
    id: "hinges-channels",
    slug: "hinges-channels",
    name: "Hinges & Channels",
    descriptor: "Soft-Close Hinges & Drawer Slides",
    image: CATEGORY_IMAGES["Hinges & Channels"],
    isNew: false,
    isHot: true,
    displayOrder: 6,
  },
  {
    id: "kitchen-wardrobe-hardware",
    slug: "kitchen-wardrobe-hardware",
    name: "Kitchen & Wardrobe Hardware",
    descriptor: "Tandem Boxes, Handles & Pull-outs",
    image: CATEGORY_IMAGES["Kitchen & Wardrobe Hardware"],
    isNew: false,
    isHot: false,
    displayOrder: 7,
  },
  {
    id: "fevicol-sealants",
    slug: "fevicol-sealants",
    name: "Fevicol & Sealants",
    descriptor: "Wood Adhesives & Silicone Sealants",
    image: CATEGORY_IMAGES["Fevicol & Sealants"],
    isNew: false,
    isHot: false,
    displayOrder: 8,
  },
  {
    id: "plumbing-pipes-fittings-tanks",
    slug: "plumbing-pipes-fittings-tanks",
    name: "Plumbing Pipes, Fittings & Tanks",
    descriptor: "CPVC/UPVC Pipes, Elbows & Storage",
    image: CATEGORY_IMAGES["Plumbing Pipes, Fittings & Tanks"],
    isNew: false,
    isHot: false,
    displayOrder: 9,
  },
  {
    id: "sanitary-bath-fittings",
    slug: "sanitary-bath-fittings",
    name: "Sanitary & Bath Fittings",
    descriptor: "Faucets, Diverters & Showers",
    image: CATEGORY_IMAGES["Sanitary & Bath Fittings"],
    isNew: false,
    isHot: false,
    displayOrder: 10,
  },
];
