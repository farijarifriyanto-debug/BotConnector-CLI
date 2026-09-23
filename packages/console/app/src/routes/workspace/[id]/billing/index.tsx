import { Show } from "solid-js"
import { createAsync, useParams } from "@solidjs/router"
import { querySessionInfo } from "../../common"
import styles from "./billing-not-active.module.css"

// BotConnector does not currently offer paid subscriptions, payment
// processing, or a public billing portal (see https://botconnector.id/pricing).
// Cloud routing is bring-your-own-API-key with no BotConnector markup; local
// models are free. The original Stripe-backed checkout sections (billing,
// reload, black, monthly-limit, payment, redeem) are left in place but
// intentionally not rendered here, so this can be turned back on later
// without re-writing the billing logic if BotConnector ever introduces paid
// plans of its own -- with transparent pricing published first, per that
// same commitment.
export default function () {
  const params = useParams()
  const sessionInfo = createAsync(() => querySessionInfo(params.id!))

  return (
    <div data-page="workspace-[id]">
      <div data-slot="sections">
        <Show when={sessionInfo()?.isAdmin}>
          <div class={styles.root}>
            <h2>Billing</h2>
            <p>
              BotConnector has no paid subscriptions, payment processing, or billing portal active today. Local
              models are free -- you cover your own hardware. Cloud routing uses your own provider API keys, billed
              directly by that provider at their standard rates; BotConnector adds no markup.
            </p>
            <p>
              If BotConnector introduces paid services in the future, pricing and usage terms will be published
              before anything is charged.
            </p>
          </div>
        </Show>
      </div>
    </div>
  )
}
