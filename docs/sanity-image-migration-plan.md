# Sanity image migration preparation — Phase 1

Prepared against `origin/main` at `c2975d67668ad1349e877c620e5a302615ecad99` on 2026-09-28. This is a read-only plan. No Drive file was downloaded, converted, uploaded to Sanity, or published.

The [machine-readable manifest](./sanity-image-migration-manifest.json) records Drive file IDs, exact published document IDs and field paths, current `fallbackSrc`, provisional alt text, expected aspect ratio, crop guidance, desktop/mobile role, and status for every destination. Array paths use the published `_key` to identify the intended founder or gallery tile; the manifest is **not an executable patch**.

## Ready mappings

| Destination | Drive source | Sanity field |
|---|---|---|
| Homepage hero | `01_Hero_Installation.png` | `hero.backgroundImage` |
| Homepage visit / inspection image | `05_Book_Visit_Bathroom.png` | `whatWeDoSection.sideImage` |
| Transformations comparison — before | `Transformations_Before_Image` | `sliderBefore` |
| Transformations comparison — after | `Transformation_After_Image` | `sliderAfter` |
| Packages page top image | `06_Installer_Packages_Top.png` | `image` |
| About founder — Tarang Doshi | `Tarang_About_Profile.heic` | `team.founders[_key=="1-tarang-doshi"].photo` |
| About founder — Pranay Gupta | `Pranay_About_Profile` | `team.founders[_key=="2-pranay-gupta"].photo` |
| Contact page image | `10_Installer_Contact_Page.png` | `contactImage` |
| Package component — Edge & Corner Protection | `Edge_Proofing.webp` | `image` |
| Package component — Drainage Support | `Drain_Clear1.webp` | `image` |
| Package component — Raised Toilet Seat | `Raised_Toilet_Seat.HEIC` | `image` |

`READY_TO_UPLOAD` means the filename-to-field mapping is clear. It does **not** mean an HEIC file is verified for this Studio upload workflow or that the photograph's crop and alt text have been visually approved.

## Founder selection needed

The following pools have not been assigned to a particular destination. Reuse of a candidate in more than one slot is possible, but should be a deliberate editorial decision.

- **Transformations gallery — Guest bathroom after safety upgrade** (`tiles[_key=="tile-1"].image`): `Transformations_Gallery_1`, `Transformations_Gallery_3`, `Transformations_Gallery_4`, `04_Bathroom_Gallery_A.png`.
- **Transformations gallery — Walk-in shower · Goa** (`tiles[_key=="tile-2"].image`): `Transformations_Gallery_1`, `Transformations_Gallery_3`, `Transformations_Gallery_4`, `04_Bathroom_Gallery_A.png`.
- **Transformations gallery — Master bathroom after safety upgrade** (`tiles[_key=="tile-3"].image`): `Transformations_Gallery_1`, `Transformations_Gallery_3`, `Transformations_Gallery_4`, `04_Bathroom_Gallery_A.png`.
- **Transformations gallery — Ensuite shower · Goa** (`tiles[_key=="tile-4"].image`): `Transformations_Gallery_1`, `Transformations_Gallery_3`, `Transformations_Gallery_4`, `04_Bathroom_Gallery_A.png`.
- **Homepage final booking CTA** (`finalCtaSection.backgroundImage`): `BookFreeInspection_Background_Homepage`, `Form_Section_Homepage`.
- **About page hero** (`hero.image`): `08_Second_Home_Bathroom_B.png`, `04_Bathroom_Gallery_A.png`.
- **About story** (`story.image`): `08_Second_Home_Bathroom_B.png`, `04_Bathroom_Gallery_A.png`, `PranayTarang_About_Together.heic`.
- **About approach** (`approach.image`): `08_Second_Home_Bathroom_B.png`, `04_Bathroom_Gallery_A.png`.
- **About closing** (`closing.image`): `08_Second_Home_Bathroom_B.png`, `04_Bathroom_Gallery_A.png`.
- **Package component — Vertical grab bars** (`image`): `Vertical_GrabBar_RoseGold6.HEIC`, `Vertical_GrabBar_BlackLogo.heic`, `Vertical_GrabBar_Black2.HEIC`, `Vertical_GrabBar_RoseGold5.HEIC`, `Vertical_GrabBar_RoseGold3.heic`, `Vertical_LongGrabBar_Silver2.heic`, `Vertical_GrabBar_SilverLogo.heic`, `Vertical_LongGrabBar_Silver1.HEIC`, `Vertical_GrabBar_RoseGold3.HEIC`, `Vertical_GrabBar_RoseGold2.heic`, `Vertical_GrabBar_Silver2.heic`, `Vertical_GrabBar_Gold1.heic`, `Vertical_GrabBar_Gold2.heic`, `Vertical_GrabBar_RoseGold.heic`, `Vertical_GrabBar_Silver.heic`, `Vertical_GrabBar_Variety1.HEIC`, `Vertical_GrabBar1`.
- **Package component — L / angled grab bar** (`image`): `LShaped_GrabBar3.HEIC`, `LShaped_GrabBar1.HEIC`.
- **Package component — Folding support bar** (`image`): `Folding_SupportBar5.HEIC`, `Folding_SupportBar4.HEIC`, `Folding_SupportBar3.HEIC`, `Folding_SupportBar2.heic`, `Folding_SupportBar1.HEIC`.
- **Package component — Shower anti-slip mat** (`image`): `Shower_Anti-Slip_Mat4.HEIC`, `Shower_Anti-Slip_Mat3.HEIC`, `Shower_Anti-Slip_Mat2.HEIC`, `Shower_Anti-Slip_Mat1.HEIC`.
- **Package component — Post-shower anti-slip mat** (`image`): `Post_Shower_Mat3.HEIC`, `Post_Shower_Mat2.HEIC`, `Post_Shower_Mat1.HEIC`.
- **Package component — Shower stool** (`image`): `Shower_Stool2.HEIC`, `Shower_Stool.HEIC`.
- **Package component — Two-way lock** (`image`): `Two-way_Lock_Silver5.heic`, `Two-way_Lock_Black&Silver.heic`, `Two-way_Lock_Black3.heic`, `Two-way_Lock_Black2.heic`, `Two-way_Lock_Black1.heic`, `Two-way_Lock_Silver4.heic`, `Two-way_Lock_Silver3.heic`, `Two-way_Lock_Silver2.HEIC`.
- **Package component — Reinforced Fixture Support** (`image`): `Reinforced_Fixture_Support8.HEIC`, `Reinforced_Fixture_Support7.HEIC`, `Reinforced_Fixture_Support6HEIC`, `Reinforced_Fixture_Support5.HEIC`, `Reinforced_Fixture_Support4.HEIC`, `Reinforced_Fixture_Support3.HEIC`, `Reinforced_Fixture_Support2.HEIC`, `Reinforced_Fixture_Support1.HEIC`.

## Keep current fallbacks

- **Package component — Anti-slip treatment:** no classified current asset. Keep the published fallback and revisit when the edited source exists.
- **Package component — Bathroom slippers:** no classified current asset. Keep the published fallback and revisit when the edited source exists.

Do not use DNU files or remaining `IMG_xxxx` files. The two Drive listings contained 12 DNU items and 8 `IMG_xxxx` future items; none appears in a destination candidate list.

## Image behavior and upload checks

- The public query fetches each image's `asset`, `crop`, `hotspot`, `alt` and `fallbackSrc`. An uploaded asset becomes a Sanity CDN URL; without one, the published `fallbackSrc` or code fallback is used. If neither exists, optional About images show a labelled placeholder or founder initials.
- The image resolver builds responsive widths of 480, 828, 1200, 1920 and 2400 pixels with `auto=format` and quality 85. It supplies stored crop to the URL builder and uses the hotspot for CSS framing. The Hero uses a responsive `<picture>`; a new master image also supplies mobile unless a separate mobile override is provided.
- Schema guidance sets 4:3 landscape minimum 1200×900, 4:5 portrait minimum 800×1000, and requires alt text when an asset is uploaded. The image field enables hotspot editing. The minimum-dimension rule is a warning, so the future upload review must check source pixels; the 85-quality responsive pipeline cannot restore detail missing from a small original. The paired before/after images should be matched in source dimensions and framing.
- Drive reports HEIC/HEIF MIME for the Tarang portrait, raised toilet seat, and most component candidates. Sanity's [Assets documentation](https://www.sanity.io/docs/content-lake/assets) lists HEIF as supported, while its [Studio image-field documentation](https://www.sanity.io/docs/studio/image-type) gives a narrower list of reliably supported archival originals. Treat direct HEIC upload as **unverified for this exact Studio workflow**. Before any future upload, make a high-quality JPEG master copy for HEIC/HEIF photos, check its pixel dimensions, then test a draft in Preview. Preserve each Drive original. `Pranay_About_Profile` is reported as JPEG but has no filename extension; a `.jpg` copy may be needed for predictable file selection.
- The published Sanity documents inspected for this plan currently use bundled-image paths or empty optional fields; none of these intended slots had an uploaded Sanity asset. Uploading must wait for a separate authorization and Preview review.

## Next review checkpoint

Select the gallery tile order, final booking image, four About placements, and one variant for each multi-option component. Review the JPEG master preparation for HEIC/HEIF files, the 390px and desktop crops, and the alt text against the actual selected photographs. Leave anti-slip treatment and slippers on their current fallbacks.
