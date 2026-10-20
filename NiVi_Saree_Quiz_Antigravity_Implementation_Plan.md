# NiVi — Find Your Perfect Saree Quiz
## Complete Implementation Plan for Antigravity AI IDE

> **Important project context:** This feature is being added to an existing application. The application already has a home screen. Do not replace, redesign, or remove the existing home screen. Add the quiz entry point to the existing home screen using the project's current design conventions. When a customer completes the quiz and submits their answers, navigate to a **separate recommendation results page/dashboard** within the existing application. This results page should show the selected styling recommendation and matching in-stock products.

---

## 1. Objective

Build the NiVi “Find Your Perfect Saree” experience:

1. Admins add relevant product attributes/tags when creating or editing saree products.
2. Customers open the quiz from the existing home screen.
3. Customers answer the 8 quiz questions.
4. On submission, the application selects the most relevant reusable recommendation.
5. The customer navigates to a separate results page/dashboard showing styling advice and matching in-stock products.

There are 73,728 possible answer combinations, but do not create a separate content set or page for each combination. Reuse the 12 recommendation sets supplied by the client, with clear matching rules and sensible fallbacks.

## 2. Required workflow

```text
Existing Home Screen (already exists)
        |
        | Customer clicks “Find Your Perfect Saree”
        v
8-Question Saree Quiz
        |
        | Customer submits answers
        v
Recommendation Matching Logic
        |
        v
Separate Recommendation Results Page / Dashboard
        |
        +--> Selected styling recommendation
        +--> Optional recommendation banner/image
        +--> Matching in-stock saree products
        +--> Existing product detail / add-to-cart actions
```

**Navigation requirement:** The quiz must not replace the home screen. Use the existing routing/navigation pattern. After quiz submission, navigate to a separate results route/page. If the project already has route conventions, follow them rather than inventing an unrelated architecture.

---

## 3. Phase One — Inspect the existing application

Before editing code, inspect the repository and report:
- Framework, routing approach and existing home-screen component.
- Existing product schema/model and product create/edit forms.
- Current product tags, categories, fabric, colour, occasion, border, stock and availability fields.
- Product create/edit APIs, server actions, validation and database migrations.
- Existing product listing, product detail and add-to-cart flows.
- Existing styling system and responsive layout conventions.
- Whether any quiz, recommendation or result-page components already exist.

Do not immediately rewrite components or change the database. Reuse existing patterns and fields where possible. Avoid duplicate fields and avoid breaking the existing home screen or shopping flow.

---

## 4. Phase Two — Add product attributes/tags first

### Purpose

Product tagging must be implemented before the quiz matching logic. During product creation or editing, admins need to assign consistent attributes so quiz answers can be matched to products.

Use existing fields if equivalent ones already exist. Do not duplicate stock, category or fabric fields unnecessarily.

### Suggested attributes

| Attribute | Example values |
|---|---|
| Saree type / fabric | Kanchi Cotton, Sungudi Cotton, Kora Organza, Banarasi Katan Silk, Maheshwari Cotton, Silk Cotton |
| Occasion | daily wear, office, formal, family function, festive, wedding, temple visit, reception |
| Style | traditional, elegant, modern, minimal, rich, royal, simple, graceful |
| Comfort / feel | lightweight, breathable, structured, crisp, rich texture, luxurious, versatile |
| Border | grand zari, small/subtle, contrast colour, minimal/no prominent border |
| Colour palette | rich/vibrant, soft/pastel, earthy/muted, classic/timeless |
| Specific colours | red, green, royal blue, blush, lavender, mint, beige, rust, olive, black, cream, maroon |
| Inventory | Use the existing stock/availability field |

### Requirements

- Add appropriate controls to both create-product and edit-product forms.
- Prefer controlled multi-selects or consistent reusable tags, following the existing architecture.
- Normalize tag values (examples: `family-function`, `grand-zari`, `lightweight`, `pastel`) and prevent spelling variants/duplicates.
- Save and load the values correctly through database/API layers.
- Keep product creation working for products that do not yet have all quiz attributes.
- Plan a safe admin backfill for existing products. Do not guess tags for products when their details are unknown.
- Use existing inventory logic to exclude out-of-stock/unavailable products.
- Do not add a separate product-tagging worksheet or separate tagging workflow: tags belong in the product creation/editing flow.

### Acceptance checks

- Admin can create a saree with multiple attributes.
- Admin can edit a saree and see its existing attributes.
- Attributes persist after refresh and are available to product filtering.
- Existing products and product flows do not break.
- Only matching in-stock products are shown in quiz results.

---

## 5. Phase Three — Customer-facing quiz

Use the client’s exact finalized questions and answer options below. You may improve visual presentation, but do not change the meaning or silently remove options.

### Question 1: Which body shape best describes you?
- Pear-shaped
- Apple-shaped
- Hourglass-shaped
- Rectangle-shaped
- Oval or fuller-figured
- Not sure

### Question 2: What is your height?
- Petite
- Average
- Tall

### Question 3: What is your skin undertone?
*Choose your best estimate.*
- Warm — golden, peachy or yellowish
- Cool — pinkish, rosy or bluish
- Neutral — a mix of warm and cool
- I’m not sure

### Question 4: What is the occasion?
- Daily wear
- Office or formal wear
- Festive or family function
- Wedding or grand occasion

### Question 5: Which style do you prefer?
- Traditional and elegant
- Modern and minimal
- Rich and royal
- Simple and graceful

### Question 6: What matters most when choosing a saree?
- Light and comfortable
- Structured and crisp
- Rich texture and luxurious feel
- Versatile for many occasions

### Question 7: Which border do you love?
- Grand zari border
- Small or subtle border
- Contrast colour border
- Minimal or no prominent border

### Question 8: Which colour palette attracts you?
- Rich and vibrant — red, green, royal blue
- Soft and pastel — blush, lavender, mint
- Earthy and muted — beige, rust, olive
- Classic and timeless — black, cream, maroon

### Quiz UI requirements

- Add a “Find Your Perfect Saree” entry point to the **existing home screen** without replacing it.
- Use the current app’s visual style and component conventions.
- Make the quiz responsive on mobile, tablet and desktop.
- Show progress, such as “Question 3 of 8”.
- Clearly distinguish selected and unselected answers.
- Let customers go back and change answers.
- Validate required answers before continuing.
- Treat “Not sure” / “I’m not sure” as valid answers.
- Provide a clear final action such as **“Find My Saree Style”**.
- Keep body-shape and height advice positive and non-absolute; avoid promising that a style will change someone’s body.
- Preserve answers during navigation within the quiz.

---

## 6. Phase Four — Client-provided recommendation content (include all 12)

The following recommendation content was supplied by the NiVi client. Preserve it in the application content/configuration. You may correct obvious formatting inconsistencies, but do not silently replace their advice or remove fields.

**Banner status:** In the client document, all 12 recommendation entries say the picture is not available. Therefore, banner images must be optional. Do not invent image URLs. If there is no approved banner image, use an intentional no-image layout or an existing approved product image where appropriate.

### 1. The Timeless Traditionalist

- **Saree:** Kanchi Cotton
- **Occasion:** Office, temple visits, family functions
- **Saree style suggestion:** Kanchi cotton saree with a rich zari border and contrasting pallu.
- **Why it works:** The structured cotton fabric creates a graceful silhouette, while the zari adds traditional elegance.
- **Blouse recommendation:** Elbow-length sleeves, boat neck, contrasting solid-colour blouse.
- **Draping tip:** Keep the front pleats crisp and evenly spaced; pin the pallu neatly over the shoulder.
- **Jewellery and accessories:** Antique gold jhumkas, a simple chain, bangles and a small bindi.
- **Colour guidance:** Maroon, bottle green, mustard, rust and royal blue.
- **Banner image:** Traditional Kanchi cotton saree with a grand zari border. Picture not available.

### 2. The Effortless Everyday Elegant

- **Saree:** Sungudi Cotton
- **Occasion:** Daily wear, shopping, casual gatherings
- **Saree style suggestion:** Lightweight Sungudi cotton with traditional dots and a contrasting border.
- **Why it works:** Breathable cotton and simple patterns make it comfortable while retaining a distinctly traditional look.
- **Blouse recommendation:** Short-sleeve round-neck blouse in a border-matching colour.
- **Draping tip:** Choose a lightweight, comfortable drape with five to seven neat pleats.
- **Jewellery and accessories:** Small studs, thin bangles, a watch and comfortable sandals.
- **Colour guidance:** Indigo, brick red, mustard, teal and black with contrasting borders.
- **Banner image:** Everyday Sungudi cotton saree with a traditional printed pattern. Picture not available.

### 3. The Soft Glamour Look

- **Saree:** Kora Organza
- **Occasion:** Engagements, receptions, festive lunches
- **Saree style suggestion:** Sheer Kora organza with a delicate zari or embroidered border.
- **Why it works:** Its crisp structure and light-catching transparency create an airy, refined appearance.
- **Blouse recommendation:** Fitted blouse with a square neckline, elbow sleeves or delicate embroidery.
- **Draping tip:** Use carefully arranged pleats and a neatly pinned pallu to preserve the fabric’s shape.
- **Jewellery and accessories:** Pearl drops, a delicate bracelet and a small clutch.
- **Colour guidance:** Powder blue, lavender, blush pink, ivory, sage green and champagne.
- **Banner image:** Pastel organza saree with subtle shimmer and an elegant border. Picture not available.

### 4. The Royal Celebration

- **Saree:** Banarasi Katan Silk
- **Occasion:** Weddings, receptions, grand celebrations
- **Saree style suggestion:** Rich Katan silk with intricate Banarasi brocade and a statement pallu.
- **Why it works:** The lustrous silk and elaborate weaving create a luxurious, occasion-ready look.
- **Blouse recommendation:** Structured blouse with a sweetheart or square neckline and elbow-length sleeves.
- **Draping tip:** Keep the pleats compact and showcase the pallu prominently.
- **Jewellery and accessories:** Gold temple jewellery, layered haram, statement earrings and a traditional bun.
- **Colour guidance:** Deep red, emerald green, wine, royal purple and gold.
- **Banner image:** Jewel-toned Banarasi Katan silk with rich brocade details. Picture not available.

### 5. The Understated Professional

- **Saree:** Maheshwari Cotton
- **Occasion:** Work, meetings, formal events
- **Saree style suggestion:** Maheshwari cotton or cotton-silk with clean stripes and a subtle border.
- **Why it works:** The lightweight fabric and understated design offer an elegant, professional appearance.
- **Blouse recommendation:** Three-quarter sleeves, a boat neck or a modest collared neckline.
- **Draping tip:** Use evenly spaced pleats and secure the pallu for easy movement.
- **Jewellery and accessories:** Stud earrings, a slim watch, a structured handbag and simple flats.
- **Colour guidance:** Navy, charcoal, olive, muted teal, beige and maroon.
- **Banner image:** Maheshwari saree with refined stripes and a minimal border. Picture not available.

### 6. The Festive Comfort Queen

- **Saree:** Silk Cotton
- **Occasion:** Festivals, poojas, family gatherings
- **Saree style suggestion:** Silk cotton with a lustrous body, contrasting pallu and subtle zari detailing.
- **Why it works:** It combines the comfort of cotton with the festive sheen of silk.
- **Blouse recommendation:** Contrast-colour blouse with elbow sleeves and a round or U-shaped neckline.
- **Draping tip:** Create balanced pleats and arrange the pallu to display its woven details.
- **Jewellery and accessories:** Gold jhumkas, bangles, a medium-length necklace and jasmine flowers.
- **Colour guidance:** Coral, peacock blue, fuchsia, leaf green and turmeric yellow.
- **Banner image:** Bright silk-cotton saree with a contrasting gold border. Picture not available.

### 7. The Tall and Graceful Look

- **Style focus:** Enhancing vertical lines
- **Saree:** Kanchi Cotton
- **Saree style suggestion:** Kanchi cotton with a continuous vertical pattern, medium border or elongated motifs.
- **Why it works:** Vertical design elements can visually lengthen the overall silhouette, if that is the look you prefer.
- **Blouse recommendation:** A well-fitted blouse with a V-neck or elongated neckline.
- **Draping tip:** Keep pleats narrow and aligned; an open pallu can create a flowing vertical line.
- **Jewellery and accessories:** Long earrings, a single long necklace and elegant footwear.
- **Colour guidance:** Deep teal, navy, wine, forest green and monochrome combinations.
- **Banner image:** Kanchi cotton saree with vertical motifs and an elegant pallu. Picture not available.

### 8. The Balanced Silhouette

- **Style focus:** Balanced proportions
- **Saree:** Sungudi Cotton
- **Saree style suggestion:** Sungudi cotton with a medium-width border and evenly distributed prints.
- **Why it works:** Balanced pattern placement and a defined drape can create a harmonious overall appearance.
- **Blouse recommendation:** A well-fitted blouse with elbow-length sleeves and a square or round neckline.
- **Draping tip:** Arrange front pleats evenly and secure the waist comfortably without excessive tightness.
- **Jewellery and accessories:** Medium-sized jhumkas, a short necklace and coordinated bangles.
- **Colour guidance:** Magenta, cobalt blue, emerald, red and contrasting two-tone combinations.
- **Banner image:** Printed Sungudi saree with a balanced border and neatly arranged pleats. Picture not available.

### 9. The Petite Elegance Edit

- **Style focus:** A visually elongated look
- **Saree:** Kora Organza
- **Saree style suggestion:** Lightweight organza with small-scale motifs and a narrow or medium border.
- **Why it works:** A less bulky drape and smaller patterns can help maintain a streamlined appearance.
- **Blouse recommendation:** A fitted blouse with a V-neck or a subtle square neckline.
- **Draping tip:** Keep pleats narrow and avoid excessive fabric gathering around the waist.
- **Jewellery and accessories:** Delicate earrings, a slim bracelet and understated footwear.
- **Colour guidance:** Lavender, rose pink, powder blue, soft peach and monochrome pastels.
- **Banner image:** Pastel Kora organza with delicate motifs and a refined blouse. Picture not available.

### 10. The Statement-Maker

- **Style focus:** Dramatic festive styling
- **Saree:** Banarasi Katan Silk
- **Saree style suggestion:** Bold Banarasi silk with intricate motifs, a rich pallu and a contrasting blouse.
- **Why it works:** Rich weaving, colour contrast and statement accessories create a memorable occasion look.
- **Blouse recommendation:** A deep-back or square-neck blouse with structured shoulders and elbow sleeves.
- **Draping tip:** Choose a neat front drape and display the pallu over the shoulder or in a carefully arranged open style.
- **Jewellery and accessories:** Statement haram, chandelier earrings, bangles and a decorative clutch.
- **Colour guidance:** Emerald, wine, ruby red, midnight blue and antique gold.
- **Banner image:** Rich Banarasi silk with ornate gold weaving and statement jewellery. Picture not available.

### 11. The Minimalist Muse

- **Style focus:** Simple, contemporary elegance
- **Saree:** Maheshwari Cotton
- **Saree style suggestion:** Solid or subtly striped Maheshwari cotton with a restrained border.
- **Why it works:** Clean lines and minimal embellishment create a polished look without overwhelming the saree’s natural texture.
- **Blouse recommendation:** Sleeveless, short-sleeve or three-quarter-sleeve blouse with a clean neckline.
- **Draping tip:** Use simple, well-defined pleats and a clean shoulder drape.
- **Jewellery and accessories:** Geometric earrings, a minimalist bracelet and a compact handbag.
- **Colour guidance:** Sand beige, sage, ivory, rust, olive and muted grey.
- **Banner image:** Earth-toned Maheshwari saree with minimal accessories. Picture not available.

### 12. The Traditional Festive Diva

- **Style focus:** Classic South Indian festive look
- **Saree:** Silk Cotton or Kanchi Cotton
- **Saree style suggestion:** Bright silk cotton or Kanchi cotton with a contrasting pallu and a traditional border.
- **Why it works:** Traditional colours, visible woven details and classic accessories create a celebratory look.
- **Blouse recommendation:** Contrast blouse with elbow sleeves, a round neck and optional piping to match the border.
- **Draping tip:** Use crisp front pleats and arrange the pallu to highlight the border.
- **Jewellery and accessories:** Temple jewellery, layered haram, gold bangles, jasmine flowers and a traditional bindi.
- **Colour guidance:** Mustard and pink, red and green, purple and gold, or turquoise and maroon.
- **Banner image:** Festive South Indian saree with a contrast blouse, temple jewellery and jasmine. Picture not available.

---

## 7. Phase Five — Sample quiz scenario and expected result page

Implement and test at least the following exact scenario.

### Customer selections

| Quiz question | Selected answer |
|---|---|
| 1. Body shape | Pear-shaped |
| 2. Height | Average |
| 3. Skin undertone | Cool — pinkish, rosy or bluish |
| 4. Occasion | Festive or family function |
| 5. Preferred style | Modern and minimal |
| 6. What matters most | Light and comfortable |
| 7. Preferred border | Grand zari border |
| 8. Colour palette | Soft and pastel — blush, lavender, mint |

### Expected navigation

When the customer clicks **“Find My Saree Style”**, the application must navigate from the quiz to a **separate recommendation results page/dashboard**. This is a new page within the existing application, not a replacement for the existing home screen.

### Expected result content for this scenario

- **Headline:** Pastel Regal Grace — Modern Comfort Meets Festive Heritage
- **Saree style suggestion:** Lightweight soft silk or silk cotton with a grand zari border.
- **Why it works:** A lightweight drape keeps the customer comfortable during family festivities, while the grand zari border adds celebratory richness.
- **Blouse recommendation:** Boat-neck or elbow-sleeve blouse with subtle detailing.
- **Draping tip:** Neat front pleats with a freely flowing pallu to highlight the zari border.
- **Jewellery and accessories:** Silver-toned, white-gold or rhodium-finish jewellery with soft pearl accents to complement cool undertones.
- **Colour guidance:** Blush pink, lavender, mint and related pastel shades.
- **Banner:** Optional. No client-provided banner image is currently available for this scenario.
- **Products:** Below the styling advice, automatically display matching in-stock products from the store. Use product attributes saved during product creation/editing. Show the existing product image, name, price and shopping actions supported by the app.

This sample scenario is an example of the intended behaviour. It is not one of the 12 named recommendation sets supplied by the client. Reuse and adapt the closest approved recommendation content where practical, without silently deleting the client’s 12 sets. If a separate sample result is needed for this exact combination, store it as a reusable content entry or map it to the most appropriate approved recommendation.

---

## 8. Phase Six — Recommendation matching logic

There are 73,728 possible combinations of the answers. Do not create 73,728 unique pages or recommendation records.

Use the 12 client recommendations as reusable content and implement clear, testable rules to decide which recommendation is most appropriate.

### Suggested priorities

1. **Occasion** — daily, office/formal, festive/family, wedding/grand.
2. **Comfort/feel** — lightweight, structured, luxurious, versatile.
3. **Preferred style** — traditional/elegant, modern/minimal, rich/royal, simple/graceful.
4. **Border preference** — grand zari, subtle, contrast, minimal.
5. **Colour palette** — vibrant, pastel, earthy, classic.
6. **Body shape, height and undertone** — use to refine styling advice when relevant and supported by content.

These are implementation starting points, not additional client-approved rules. Keep the matching logic maintainable so it can be adjusted after reviewing real products.

### Matching requirements

- Do not make all eight answers mandatory strict product filters if that causes zero results.
- Use scoring or explicit priority rules to find relevant recommendations/products.
- Avoid contradictory suggestions where possible.
- If multiple recommendations score equally, use a deterministic tie-breaker.
- Use a reasonable fallback when no exact recommendation or product match exists.
- Keep recommendation matching separate from UI components and database queries.
- Do not invent product data, prices, images or availability.
- Only show in-stock products according to the current inventory model.
- If no products match, show a helpful message and, if appropriate, a fallback selection of in-stock products matching the strongest preferences.
- Do not change checkout or cart behaviour unless needed and approved.

---

## 9. Phase Seven — Separate results page/dashboard

Create a separate results page using the existing app’s route, styling and layout conventions.

Recommended content order:

1. Recommendation title/headline.
2. Optional banner or approved image.
3. Saree style suggestion and explanation.
4. Blouse recommendation.
5. Draping tip.
6. Jewellery/accessories and colour guidance.
7. Matching in-stock products with price and existing product actions.
8. “Retake quiz” or “Change answers” action.

Requirements:
- The existing home screen must remain intact.
- The quiz is entered from the existing home screen.
- Quiz submission navigates to the separate results page.
- Results should be refresh-safe if the existing architecture supports persisted/session state; do not lose answers unexpectedly during ordinary navigation.
- Handle missing banner images gracefully.
- Handle empty product matches gracefully.
- Make the page responsive on mobile, tablet and desktop.
- Follow the existing app’s header, footer, typography, spacing and design system.

---

## 10. Phase Eight — Testing checklist

### Product admin
- Create a product with multiple attributes.
- Edit the product and verify saved values are loaded.
- Confirm attributes persist and are available to the matching logic.
- Confirm existing products without attributes do not crash the quiz.
- Confirm out-of-stock products are excluded.

### Quiz and navigation
- Open the quiz from the existing home screen.
- Complete all eight questions.
- Navigate backward and change answers.
- Test “Not sure” answers.
- Confirm the final submit action navigates to the separate results page.
- Confirm the existing home screen remains accessible and unchanged.
- Test mobile, tablet and desktop layouts.

### Recommendation scenarios
Test at least:
1. Daily wear + light/comfortable + subtle border.
2. Office/formal + modern/minimal + earthy/muted colours.
3. Festive/family function + grand zari + rich/vibrant colours.
4. Wedding/grand occasion + rich/royal style.
5. Pastel colours + cool undertone + light/comfortable.
6. Petite height + lightweight fabric preference.
7. Tall height + vertical pattern preference, where supported.
8. “Not sure” body shape and/or undertone.
9. The full sample scenario in Section 7.

For every scenario verify:
- The recommendation is relevant and non-contradictory.
- The result appears on the separate results page.
- Matching in-stock products appear below the styling content.
- Out-of-stock products do not appear.
- Missing banners or products do not break the page.

### Regression
- Run existing lint, type-check, tests and build scripts.
- Fix regressions introduced by this feature.
- Do not claim tests passed unless they were actually run.

---

## 11. Implementation order

1. Inspect the repository and report the current architecture, home screen, routes, product model, admin form and inventory field.
2. Propose the smallest safe schema/UI changes for product attributes.
3. Implement product attribute creation/editing and persistence.
4. Plan a safe way to tag existing products.
5. Add all 12 client-provided recommendations to a maintainable content structure.
6. Implement and test the recommendation matching rules.
7. Add the quiz entry point to the existing home screen.
8. Build the eight-question quiz.
9. Build the separate recommendation results page/dashboard and navigation.
10. Connect recommendations to matching in-stock product filtering.
11. Test the sample scenario and other cases.
12. Report changed files, migrations, assumptions, and actual test results.

## Final instruction to Antigravity

Start by inspecting the existing repository. The application already has a home screen: preserve it. Do not start by rewriting the home screen or replacing the current architecture. First explain the existing product model, admin product form, inventory field, routing and the smallest safe implementation plan. Then implement in the order above, preserving existing functionality and project conventions. Include all 12 client-provided recommendation sets from this document in the implementation; do not omit them.
