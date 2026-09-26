/* The approved component categories we install.
   Shared by the hero rail and the packages page so the two can never end up
   describing different kit — the rail is where most people first see this list,
   and the packages page is where they go to read it properly.

   Names and tags are verbatim from the What We Do section of the masonco build
   so both sites describe the same thing. Photography is ours — that project's
   whatwedo/ images are abstract background washes, not product shots. */

/* Approved common installation kit. Quantities are exact units, not a count
   invented from the older Standard/Advanced distinction. */
export type KitItem = {
  id: string;
  title: string;
  label: string;
  img: string;
  qty?: number;
};

export const KIT: KitItem[] = [
  { id: "vertical-grab-bars", title: "Vertical grab bars", label: "Grab support", img: "/prerna/images/bath-3.jpg", qty: 3 },
  { id: "angled-grab-bar", title: "L / angled grab bar", label: "Grab support", img: "/prerna/images/bath-5.jpg", qty: 1 },
  { id: "folding-bar", title: "Flip-up / folding support bar", label: "Grab support", img: "/prerna/images/bath-1.jpg", qty: 1 },
  { id: "anti-slip-coating", title: "Anti-slip surface treatment", label: "Traction", img: "/prerna/images/shower-3.jpg", qty: 1 },
  { id: "anti-slip-mat-shower", title: "Shower anti-slip mat", label: "Traction", img: "/prerna/images/shower-4.jpg", qty: 1 },
  { id: "anti-slip-mat-post-shower", title: "Post-shower anti-slip mat", label: "Traction", img: "/prerna/images/care-2.jpg", qty: 1 },
  { id: "shower-stool", title: "Shower seating stool", label: "Support", img: "/prerna/images/shower-2.jpg", qty: 1 },
  { id: "two-way-lock", title: "Two-way lock", label: "Safety", img: "/prerna/images/detail-1.jpg", qty: 1 },
  { id: "corner-safety", title: "Edge & corner protection", label: "Protection", img: "/prerna/images/bath-2.jpg", qty: 1 },
  { id: "drainage-solution", title: "Drainage support", label: "Hygiene", img: "/prerna/images/shower-1.jpg", qty: 4 },
  { id: "slippers-one", title: "Bathroom slippers", label: "Comfort", img: "/prerna/images/care-1.jpg", qty: 1 },
  { id: "total-support-solution", title: "Reinforced fixture support", label: "Stability", img: "/prerna/images/bath-4.jpg", qty: 1 },
  { id: "raised-toilet-seat", title: "Raised Toilet Seat", label: "Support", img: "/images/stock-web/upgrades/upgrade-toilet-support.jpg" },
];
