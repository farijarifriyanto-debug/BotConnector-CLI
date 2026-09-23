import { A } from "@solidjs/router"
import { Title } from "@solidjs/meta"
import { useLanguage } from "~/context/language"

// BotConnector does not currently offer a paid "Black" subscription, or any
// paid subscription of its own (see https://botconnector.id/pricing). Local
// models are free; cloud routing is bring-your-own-API-key with no
// BotConnector markup. This route previously rendered opencode's real Black
// plan-selection UI (the $20/$100/$200 tiers and icons defined in
// ./common.tsx, plus a Stripe-stage-gated "paused" state); that UI is
// replaced with an honest static notice. ./common.tsx is left untouched and
// unused, same as the underlying billing.ts/Stripe integration, so this is
// reversible if BotConnector ever introduces its own paid plans.
export default function Black() {
  const language = useLanguage()
  return (
    <>
      <Title>Black</Title>
      <section data-slot="cta">
        <p data-slot="paused">
          BotConnector has no paid subscriptions, payment processing, or active billing today. Local models are free
          -- you cover your own hardware. Cloud routing uses your own provider API keys, billed directly by that
          provider at their standard rates; BotConnector adds no markup. If BotConnector introduces paid services in
          the future, pricing will be published before anything is charged.
        </p>
        <p data-slot="fine-print">
          <A href={language.route("/legal/terms-of-service")}>Terms of Service</A>
        </p>
      </section>
    </>
  )
}
