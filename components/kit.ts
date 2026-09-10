/* The twelve items we actually install.
   Shared by the hero rail and the packages page so the two can never end up
   describing different kit — the rail is where most people first see this list,
   and the packages page is where they go to read it properly.

   Names and tags are verbatim from the What We Do section of the masonco build
   so both sites describe the same thing. Photography is ours — that project's
   whatwedo/ images are abstract background washes, not product shots. */

/* `qty` — how many of this item a package includes.

   PLACEHOLDER: every one of these is 1 until the real per-bathroom counts are
   confirmed. It is printed on /packages as a promise about what turns up in
   the van, so a guessed number here is a guessed number in front of a
   customer. Change them here and the page follows; nothing else needs
   touching.

   Note it is a count of units, not of upgrades. KIT.length is the "12
   upgrades" every other line on the site quotes, and that stays 12 however
   these add up. */
export type KitItem = {
  title: string;
  label: string;
  img: string;
  qty: number;
};

export const KIT: KitItem[] = [
  { title: "PVD-coated vertical grab bars", label: "Grab support", img: "/prerna/images/bath-3.jpg", qty: 1 },
  { title: "PVD-coated L / angled grab bar", label: "Grab support", img: "/prerna/images/bath-5.jpg", qty: 1 },
  { title: "PVD-coated flip-up / folding bar", label: "Grab support", img: "/prerna/images/bath-1.jpg", qty: 1 },
  { title: "Anti-slip solution / coating", label: "Traction", img: "/prerna/images/shower-3.jpg", qty: 1 },
  { title: "Premium anti-slip mats", label: "Traction", img: "/prerna/images/shower-4.jpg", qty: 1 },
  { title: "Toilet seat / raised seat / commode support", label: "Support", img: "/prerna/images/bath-4.jpg", qty: 1 },
  { title: "Shower seating stool", label: "Support", img: "/prerna/images/shower-2.jpg", qty: 1 },
  { title: "Sensor lighting unit", label: "Comfort", img: "/prerna/images/bath-6.jpg", qty: 1 },
  { title: "Two-way lock", label: "Safety", img: "/prerna/images/detail-1.jpg", qty: 1 },
  { title: "8-corner equivalent corner safety", label: "Protection", img: "/prerna/images/bath-2.jpg", qty: 1 },
  { title: "Drainage solutions", label: "Hygiene", img: "/prerna/images/shower-1.jpg", qty: 1 },
  { title: "Bathroom slippers", label: "Comfort", img: "/prerna/images/care-1.jpg", qty: 1 },
];
