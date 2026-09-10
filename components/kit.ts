/* The twelve items we actually install.
   Shared by the hero rail and the packages page so the two can never end up
   describing different kit — the rail is where most people first see this list,
   and the packages page is where they go to read it properly.

   Names and tags are verbatim from the What We Do section of the masonco build
   so both sites describe the same thing. Photography is ours — that project's
   whatwedo/ images are abstract background washes, not product shots. */

/* Approved common installation kit. Quantities are exact units, not a count
   invented from the older Standard/Advanced distinction. */
export type KitItem = {
  title: string;
  label: string;
  img: string;
  qty: number;
};

export const KIT: KitItem[] = [
  { title: "Vertical grab bars", label: "Grab support", img: "/prerna/images/bath-3.jpg", qty: 3 },
  { title: "PVD-coated L / angled grab bar", label: "Grab support", img: "/prerna/images/bath-5.jpg", qty: 1 },
  { title: "PVD-coated flip-up / folding bar", label: "Grab support", img: "/prerna/images/bath-1.jpg", qty: 1 },
  { title: "Anti-slip surface treatment", label: "Traction", img: "/prerna/images/shower-3.jpg", qty: 1 },
  { title: "Shower anti-slip mat", label: "Traction", img: "/prerna/images/shower-4.jpg", qty: 1 },
  { title: "Post-shower anti-slip mat", label: "Traction", img: "/prerna/images/care-2.jpg", qty: 1 },
  { title: "Shower seating stool", label: "Support", img: "/prerna/images/shower-2.jpg", qty: 1 },
  { title: "Two-way lock", label: "Safety", img: "/prerna/images/detail-1.jpg", qty: 1 },
  { title: "Edge & corner protection", label: "Protection", img: "/prerna/images/bath-2.jpg", qty: 1 },
  { title: "Drainage support", label: "Hygiene", img: "/prerna/images/shower-1.jpg", qty: 4 },
  { title: "Bathroom slippers", label: "Comfort", img: "/prerna/images/care-1.jpg", qty: 1 },
  { title: "Reinforced fixture support", label: "Stability", img: "/prerna/images/bath-4.jpg", qty: 1 },
];
