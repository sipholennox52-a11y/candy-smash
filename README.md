# 🍬 Candy Blast Saga

An addictive Candy Crush–style match-3 web game designed with a monetization funnel to turn players into buyers.

## Play (web)

Serve the `www/` folder:

```bash
cd www && python3 -m http.server 8000
# open http://localhost:8000
```

## Android app (Capacitor)

```bash
npm install
npx cap sync android
cd android && ./gradlew assembleDebug
# APK at android/app/build/outputs/apk/debug/app-debug.apk
```

Requires JDK 21 and the Android SDK (platform 34).

## Gameplay

- 8x8 match-3 board — swap adjacent candies to match 3+ in a row/column
- Cascading combos with chain multipliers
- Level progression with rising score targets and shrinking move budgets
- Boosters: 🔨 Hammer, 💣 Bomb, 🔀 Shuffle

## Monetization funnel (turning players into buyers)

- **Limited lives** (regenerate over time) — creates scarcity; refill instantly via the shop
- **Out-of-moves paywall** — the highest-converting moment: "5 more moves" offer right when a player is about to lose progress
- **Coin economy** — coins earned slowly through play, spent quickly on boosters/moves; coin packs sold for real money ($1.99–$19.99)
- **Boosters** — consumables that run out, driving repeat purchases
- **Limited-time sale banner** with countdown (FOMO)
- **Starter pack / bundles** with "POPULAR" / "BEST VALUE" badges (price anchoring)
- Progress persists in `localStorage`, so players return to their streak

Purchases are **simulated** in this demo. For production, wire the `buy()` function in `game.js` to Stripe Checkout (web), Google Play Billing (Android), or Apple IAP (iOS).
