# Dreamland Prototype Spec (extracted from `design-handoff/Dreamland Order.dc.html`)

Source of truth for exact values. Only add to this doc if the prototype disagrees with what we're building — do not paraphrase the README, which stands as its own high-level guide.

---

## 1. Seed data

### Zones (`design-handoff/Dreamland Order.dc.html:822-828`)
| id | name | code | color |
|----|------|------|-------|
| A | Wave Pool | DL-WAVE-01 | #0BA5E9 |
| B | Lazy River | DL-LAZY-02 | #14B8A6 |
| C | Kids' Splash Zone | DL-KIDS-03 | #22C55E |
| D | Cabanas | DL-CABA-04 | #FF6B4A |
| E | Main Lawn | DL-LAWN-05 | #16A34A |

QR format: `DL-<ZONE_ABBR>-<PADDED_INDEX>`

### Restaurants (`:830-886`)
| id | name | type | cuisine | zone | prep | rating | pin | mapX | mapY | thumb |
|----|------|------|---------|------|------|--------|-----|------|------|-------|
| grill | Splash Grill | Restaurant | Burgers & Fries | A | 15 | 4.7 | #FF6B4A | 28 | 30 | burgers |
| tacos | Tiki Tacos | Restaurant | Tacos & Burritos | E | 12 | 4.6 | #16A34A | 62 | 24 | tacos |
| pizza | Wave Pizza Co. | Restaurant | Wood-fired Pizza | D | 20 | 4.8 | #FF6B4A | 44 | 62 | pizza |
| scoops | Cool Scoops | Kiosk | Ice Cream & Shakes | C | 6 | 4.9 | #0BA5E9 | 74 | 55 | scoops |
| smooth | Lagoon Smoothies | Kiosk | Smoothies & Juice | A | 5 | 4.7 | #14B8A6 | 18 | 66 | smooth |
| bites | Beach Bites | Kiosk | Snacks & Corn Dogs | B | 8 | 4.5 | #22C55E | 52 | 42 | bites |

All start `active: true`.

### Menus per restaurant
- **grill** — Mains: Classic Cheeseburger $12, Bacon Double $15, Crispy Chicken Sandwich $13. Sides: Loaded Fries $8, Onion Rings $6, Garden Salad $9.
- **tacos** — Tacos: Baja Fish $6, Carne Asada $6, Veggie $5. Bigger bites: Burrito Bowl $13, Loaded Nachos $11, Quesadilla $10.
- **pizza** — Pizzas: Margherita $14, Pepperoni $16, Veggie Supreme $17. Extras: Garlic Knots $7, Caesar Salad $9, Cheesy Bread $8.
- **scoops** — Cones & cups: Single Scoop $5, Double Scoop $7, Waffle Cone Sundae $9. Shakes: Vanilla $7, Chocolate $7, Berry Blast $8.
- **smooth** — Smoothies: Mango Tango $8, Berry Beach $8, Green Machine $9. Juices: Fresh OJ $6, Watermelon Cooler $6, Lemonade $5.
- **bites** — Hot snacks: Corn Dog $6, Chicken Tenders $9, Pretzel Bites $7. Cool treats: Fruit Cup $5, Frozen Lemonade $6, Popcorn $5.

All items start `availability: true`. Categorize under `food` (grill/tacos/pizza/bites) or `sweets`/`drinks` where relevant — check the category filter chips (`all, food, drinks, sweets`).

### Staff (`:889-898`)
| id | name | role | kioskId | removable |
|----|------|------|---------|-----------|
| u0 | Dana Owner | owner | null | false |
| u1 | Marcus Bell | manager | null | false |
| u2 | Priya Shah | cashier | grill | true |
| u3 | Leo Turner | cashier | tacos | true |
| u4 | Aya Kimura | cashier | pizza | true |
| u5 | Sam Cortez | cashier | scoops | true |

Initial `nextId: 1043`. 12 seed orders IDs 1027–1042 with a full status distribution across statuses `confirmed / preparing / ready / delivering / delivered / picked_up`.

Order shape: `{ id, restoId, items[{name,price,qty}], fulfillment: 'delivery'|'pickup', zoneId (delivery only), status, placedAt, hour, total }`.

---

## 2. Design tokens (supplement to README)

Fonts: **Baloo 2** for display/CTAs (700/800), **Nunito** for body/UI (600/700/800).

Gradients:
- Gate: `linear-gradient(165deg,#0EA5A4 0%,#0BA5E9 62%,#0A7FC0 100%)`
- Menu/browse header banner: `linear-gradient(150deg,#0EA5A4,#0BA5E9)`
- Tracking success header: `linear-gradient(150deg,#16A34A,#0EA5A4)`
- Empty map bg: `linear-gradient(135deg,#CDEFEA,#D6ECF9)`
- Diagonal stripes: `repeating-linear-gradient(45deg, rgba(255,255,255,0.16) 0 12px, transparent 12px 24px)`
- Page: `radial-gradient(1200px 600px at 80% -10%, #E4F7FB 0%, transparent 55%), radial-gradient(900px 500px at -5% 10%, #E7F8F0 0%, transparent 50%), #F4FBF9`

Keyframes:
```css
@keyframes dl-pop  { 0%{transform:scale(.7);opacity:0} 60%{transform:scale(1.08)} 100%{transform:scale(1);opacity:1} }
@keyframes dl-spin { to { transform: rotate(360deg) } }
@keyframes dl-fade { from{opacity:0} to{opacity:1} }
@keyframes dl-up   { from{transform:translateY(100%)} to{transform:translateY(0)} }
@keyframes dl-pulse{ 0%,100%{opacity:1} 50%{opacity:.35} }
@keyframes dl-scan { 0%{top:12%} 50%{top:80%} 100%{top:12%} }
```

---

## 3. Order state machine (`:952, :979-995`)

Sequences:
- **delivery**: confirmed → preparing → ready → delivering → delivered
- **pickup**: confirmed → preparing → ready → picked_up

`placeOrder` timing (must preserve):
1. Set `payStatus:'processing'` immediately
2. After **1400 ms** → `payStatus:'success'`
3. After **2100 ms** (total from start) → `finalizeOrder`: create order (status confirmed, placedAt now, prep = max of participating restaurants' prep), clear cart, navigate to `tracking`.

Guard: if `payStatus` already set, `placeOrder` is a no-op.

---

## 4. Reassign flow (`:1039, :1046`)

`openReassign(userId)` opens `modal:'reassign'` with `form.userId` and `form.kioskId = user.kioskId || ''`.
`submitModal` maps `staff` with `u.id === form.userId ? {...u, kioskId: form.kioskId || null} : u` and clears modal. `''` → `null` = Unassigned.

---

## 5. Screen backgrounds
- Gate: teal→blue gradient (see above), white text, padding `60px 24px 40px`.
- Browse (list & map): header teal gradient, page `#EAF7F5`.
- Menu: `#EAF7F5`, top banner 150px gradient with stripes; restaurant card overlaps banner by `margin-top:-24px`.
- Cart / Checkout: `#EAF7F5`, sticky bottom CTA.
- Tracking: `#EAF7F5`, top header green→teal 60px top padding, 26px bottom radius.

---

## 6. Chrome
- **iOS frame**: 402×874 px viewport, notch, status bar row "9:41 · signal wifi battery".
- **Desktop frame**: ~1180 px wide, sidebar 230 px wide, content flex:1.
- **Top-of-page toggle pill**: Customer app / Back office, teal when active.

---

## 7. Fixed classes to preserve for parity
- `.cta-coral` — coral primary
- `.pill-toggle` — active #0EA5A4 white / idle transparent
- `.pin-teardrop` — border-radius `50% 50% 50% 2px`, rotate 45°, content counter-rotated
- `.pay-overlay` — `position:absolute inset:0 background:rgba(15,46,46,0.55) backdrop-filter:blur(3px)`
- Tracking timeline dot states — done `#16A34A`, active `#0EA5A4` with 5px halo `rgba(14,165,164,0.18)`, pending `#D6E6E4`.
