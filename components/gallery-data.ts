/* Finished bathrooms, with the room and the city they are in.

   Out here rather than inside Transformations because a caption is a claim
   about a real job in a real city - which room, which city - and the moment a
   second section shows the same three photographs, the two must not disagree
   about either. Cheap to keep honest now; expensive to reconcile later. */

export type GalleryItem = { img: string; label: string };

export const GALLERY: GalleryItem[] = [
  { img: "/prerna/images/bath-2.jpg", label: "Guest bathroom after safety upgrade" },
  { img: "/prerna/images/shower-2.jpg", label: "Walk-in shower · Goa" },
  { img: "/prerna/images/bath-4.jpg", label: "Master bathroom after safety upgrade" },
  { img: "/prerna/images/shower-3.jpg", label: "Ensuite shower · Goa" },
];
