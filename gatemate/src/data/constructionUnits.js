/**
 * Standard Units of Supply for Construction Products
 */

export const CONSTRUCTION_UNITS = [
  { value: "bag", label: "Bag (e.g. 50 kg cement, wall putty)" },
  { value: "piece", label: "Piece (e.g. rebar, block, faucet, switch)" },
  { value: "bundle", label: "Bundle (e.g. TMT rebar bundles, conduits)" },
  { value: "kg", label: "Kg (e.g. structural fasteners, binding wire)" },
  { value: "ton", label: "Ton (e.g. structural steel, bulk aggregates)" },
  { value: "sheet", label: "Sheet (e.g. plywood, roofing, MDF)" },
  { value: "meter", label: "Meter (e.g. CPVC pipe, wiring coils)" },
  { value: "box", label: "Box (e.g. modular switches, anchor bolts)" },
  { value: "pack", label: "Pack (e.g. hardware fittings, screws)" },
  { value: "roll", label: "Roll (e.g. insulation, waterproofing membrane)" },
  { value: "sq ft", label: "Sq Ft (e.g. floor tiles, wooden boards)" },
  { value: "sq m", label: "Sq M (e.g. facade panels, mesh)" },
  { value: "liter", label: "Liter (e.g. waterproofing chemical, primer)" },
  { value: "set", label: "Set (e.g. sanitary diverter set, door lock set)" },
];

export const CATEGORY_UNIT_PRESETS = {
  cement: ["bag", "ton"],
  "steel-tmt": ["piece", "bundle", "ton", "kg"],
  "bricks-blocks": ["piece", "pack"],
  "sand-aggregates": ["ton", "box"],
  plumbing: ["piece", "meter", "set"],
  electrical: ["piece", "meter", "roll", "box", "set"],
  "pipes-fittings": ["piece", "meter", "box"],
  "plywood-boards": ["sheet", "sq ft", "sq m"],
  roofing: ["sheet", "piece", "sq ft"],
  waterproofing: ["liter", "kg", "roll", "pack"],
  "paints-construction-chemicals": ["liter", "kg", "bag"],
  hardware: ["piece", "box", "pack", "set", "kg"],
  tools: ["piece", "set", "box"],
};

export const getRecommendedUnitsForCategory = (categorySlug) => {
  const recommended = CATEGORY_UNIT_PRESETS[categorySlug] || [];
  if (recommended.length === 0) return CONSTRUCTION_UNITS;

  // Return prioritized units first, followed by all remaining standard units
  const primary = CONSTRUCTION_UNITS.filter((u) =>
    recommended.includes(u.value),
  );
  const secondary = CONSTRUCTION_UNITS.filter(
    (u) => !recommended.includes(u.value),
  );
  return [...primary, ...secondary];
};
