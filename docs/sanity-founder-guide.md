# Editing the Mason website — founder guide

Everything customers read on masoncompany.in is edited in **Sanity Studio**. You do not need code, GitHub or a new deployment.

## Open the editor

Go to **www.masoncompany.in/crm/content** and sign in with your **Sanity account** (the one invited to the Mason Sanity project). This is separate from the CRM sign-in — CRM passwords do not open the editor.

The left menu lists every part of the website:

| Menu item | What it controls |
| --- | --- |
| **Homepage** | Every homepage section, one tab each: Hero, Research, Book-a-visit strip, Why Mason, Packages preview, How it works, Doctors, Testimonials, Final call to action |
| **About** | The whole About page, including its photos |
| **Packages → Standard / Advanced** | Each package: badge, description, highlight chips, **price**, components included |
| **Packages → Packages page** | The Packages page wording and the checklist shown on both package cards |
| **Packages → Package Components** | Each installed item: name, quantity, category, description, photo |
| **FAQs** | Questions and answers |
| **Testimonials** | Customer quotes |
| **Doctors & Experts** | Doctor names, credentials, quotes, photos |
| **Gallery** | The before/after slider and gallery photos |
| **Contact & Support** | Email, phone, WhatsApp, support hours, footer and Contact page wording |
| **SEO** | Google and social-sharing titles, descriptions and images, per page |

## Edit, preview, publish

1. Open an item and change the text or photo. Changes save automatically as a **draft** — nobody else can see a draft.
2. **Preview:** open the **Presentation** tab at the top of Studio. It shows the real website with your draft changes (it refreshes as you edit; if not, reload the preview). A small “Previewing unpublished changes” bar confirms you are seeing the draft.
3. **Publish:** press the green **Publish** button. The live website updates within about **one minute**.

## Common tasks

- **Headings with a highlighted word.** Type the heading, then add the word(s) under **Highlighted words** exactly as they appear. They show in the green italic accent. Press Enter in a heading to start a new line where the design shows one.
- **Change a price.** Packages → Standard (or Advanced) → **Price** tab. Enter numbers only (e.g. `29999`). The **struck-through price** is optional and must be higher than the price. The new price appears everywhere automatically: package cards, package pages, comparison, checkout, FAQs (see below) and analytics. The team still confirms the final amount before sending a payment link.
- **Prices inside text.** In FAQ answers and the Packages preview text, write `{standard_price}` or `{advanced_price}` instead of typing a number — it always shows the current price.
- **FAQs.** Add with **+ Add item**, drag to reorder, switch on **Hide from website** to remove one without deleting it.
- **Testimonials / Doctors.** Edit any field; set **Order on website** (lower numbers first); switch on **Hide from website** to remove one. Create new ones with the **+** button.
- **Components.** Change a component’s name or quantity once under Package Components — both packages update. To add or remove a component from a package, edit the package’s **Components** tab.

## Photos

- Upload **one high-quality image**. The website automatically creates the right size for phones, tablets and desktops — do not make separate small versions.
- Click the **crop icon** on an image to set its **focal point** (the part that must stay visible). The site keeps that point in view on every screen size.
- Always fill in **Alt text** — a short description for people using screen readers.
- **Mobile image override** (Homepage → Hero only): leave it empty normally. Add one only if phones need a different crop, e.g. a tall portrait version of the hero.
- About page photos: until a photo is uploaded, the page shows a “Photo to come” placeholder in that spot.

## Undo a change

- **Before publishing:** open the item’s menu (⋯) → **Discard changes**.
- **After publishing:** open **History** (clock icon, top right), pick an earlier version and **Restore**, then **Publish**.

## What stays controlled by code

These change only through a code update, on purpose:

- Page addresses (URLs), page layout, design and animations.
- Forms: which fields exist, validation, phone-number rules, where enquiries go (Zoho), duplicate protection, success and error messages.
- Where Mason operates (Goa) — it is tied to how enquiries are classified.
- Package **names** (Standard, Advanced) — analytics and the CRM rely on them. Everything else about a package is editable.
- Button destinations (e.g. “Book Free Inspection” always opens the booking form). Button **labels** are editable.
- Privacy Policy and Terms wording (legal review). Contact details inside them come from **Contact & Support** automatically.
- The “Why Mason” page (/why) wording.
- Analytics and tracking.
