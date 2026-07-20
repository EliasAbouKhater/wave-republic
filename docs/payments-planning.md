# Payments — Planning (NO CODE)

Status: **Planning only.** Not started. Do not build until Phase 1 adoption is proven.

## Guiding constraints (from Elias)

1. **No cash-on-delivery, no pay-at-pickup.** Both open a "order + disappear" abuse path.
2. **Tipping supported** on orders (post-payment surcharge, goes to a pool decided later).
3. **Wallet system**: customers top up in the app, spend at kiosks via QR-scan-at-POS.
4. **Wallet is non-redeemable unless topped up with cash.** Cash top-ups create a "withdrawable balance". Card/wallet top-ups create a "spend-only balance". Simplifies accounting — no chargebacks on withdrawn cash.
5. **UAE market** — Dubai waterpark, most customers pay in AED.

## Online payment provider — cheaper than Stripe

Stripe UAE ≈ 2.9% + AED 1 per transaction. For a busy waterpark this adds up fast. Local options:

| Provider | Local card rate | Notes | Setup complexity |
|---|---|---|---|
| **Telr** | 2.49% (negotiable ~2.0%) | UAE-based, AED settlement, Apple/Google Pay, hosted + iframe options | Low |
| **Checkout.com** | 2.0–2.5% | Good DX, popular in UAE, negotiable at volume | Medium |
| **Network International (N-Genius)** | 1.85–2.25% | Cheapest at high volume, requires bank merchant account | High |
| **PayTabs** | 2.85% | UAE-friendly but similar to Stripe pricing | Low |
| **Tap Payments** | 2.75% | KWA/UAE, decent DX | Low |
| **Stripe UAE** | 2.9% + AED 1 | Familiar, priciest for local cards | Low |

**Recommendation:**
- **Launch on Telr** or **Checkout.com** — best DX-to-price ratio, easy Apple/Google Pay
- **Migrate to N-Genius** once monthly volume passes ~AED 500k (savings pay for the higher setup effort)
- All three integrate via server-side PaymentIntent-style flow, so the wallet-top-up code doesn't lock us to any one provider — we can wrap in a `PaymentProvider` interface

## Wallet system — architecture

### Balances

Two separate balances per customer:
- **`spend_balance`** — from card/Apple Pay/Google Pay top-ups. Can only be spent at kiosks. Never withdrawable.
- **`cash_balance`** — from cash top-ups at POS. Withdrawable to cash at any POS. Also spendable.

Spending order at POS: `spend_balance` first, then `cash_balance` (encourages customers to keep cash balance for withdrawals).

### Ledger

Double-entry, immutable append-only table:

```prisma
model WalletEntry {
  id         String   @id @default(cuid())
  customerId String
  kind       String   // "topup_card" | "topup_cash" | "spend" | "refund" | "withdraw_cash" | "tip"
  bucket     String   // "spend" | "cash"
  amountCents Int     // positive = credit, negative = debit
  balanceAfter Int    // running balance for this bucket
  reference  String?  // orderId / paymentIntentId / posSessionId
  createdAt  DateTime @default(now())

  @@index([customerId, bucket, createdAt])
}
```

Never `UPDATE` or `DELETE`. Reconciliation runs daily: sum of entries per bucket must match `Customer.spendBalance` / `Customer.cashBalance`.

### QR-at-POS flow

1. Customer opens app → "Pay at kiosk" → app generates short-lived token (60s TTL, signed JWT with `customerId + nonce`)
2. Token rendered as QR
3. POS tablet scans QR → hits `/api/pos/scan` with token
4. Backend validates token, returns customer's balances + name
5. Cashier taps "Charge AED X" → backend deducts from balances, writes ledger entry, prints receipt

### Top-up flows

- **Card top-up (in app)**: customer picks amount → PaymentIntent via chosen provider → on success webhook, credit `spend_balance`, write ledger entry
- **Cash top-up (at POS)**: cashier takes cash → hits `/api/pos/topup` → credit `cash_balance`, write ledger entry, print receipt

### Withdraw

Any POS can process a withdraw against `cash_balance`. Customer scans QR, cashier taps "Withdraw AED X", cash drawer opens, ledger entry written.

### Tipping

Post-order surcharge, capped at 25%. Two options TBD:
- Split among the assigned kitchen staff for that order
- Pool to a monthly team fund

Tip amount stored on `Order.tipCents` and creates a `WalletEntry` if paid from wallet, or a separate line on the Stripe/Telr payment.

## Compliance / risk notes

- Wallet balances = customer money held by us. UAE Central Bank has rules on stored-value facilities. **Legal review required before launching wallet.** For Phase 2, might be safer to skip wallet and go direct-charge-per-order first.
- PCI compliance: use hosted fields / redirect flows so we never touch card data.
- Chargebacks: cash top-ups cannot chargeback. Card top-ups can — mitigated by making top-ups non-refundable to card (only redeemable as balance).

## Decision points still open

- [ ] Provider for Phase 2 launch (Telr vs Checkout.com)
- [ ] Whether to launch wallet in Phase 2 or defer to Phase 3 (legal review dependency)
- [ ] Tipping distribution model
- [ ] Minimum / maximum top-up amounts
- [ ] Withdrawal identity check (any minimum? any cap?)
