import "./index.css"
import { createAsync, query } from "@solidjs/router"
import { Title, Meta } from "@solidjs/meta"
import { EmailSignup } from "~/component/email-signup"
import { Legal } from "~/component/legal"
import { Footer } from "~/component/footer"
import { Header } from "~/component/header"
import { getLastSeenWorkspaceID } from "../workspace/common"
import { useLanguage } from "~/context/language"
import { LocaleLinks } from "~/component/locale-links"
import styles from "./not-active.module.css"

const checkLoggedIn = query(async () => {
  "use server"
  return await getLastSeenWorkspaceID().catch(() => {})
}, "checkLoggedIn.get")

// BotConnector does not currently offer a paid "Zen" plan, or any paid
// subscription of its own (see https://botconnector.id/pricing). Local
// models are free; cloud routing is bring-your-own-API-key with no
// BotConnector markup. This route previously rendered opencode's real Zen
// marketing page (pricing, checkout CTA, testimonials); that content is
// replaced with an honest static notice. The underlying Zen proxy routes
// and pricing utilities (zen/util/pricing.ts, zen/v1/*, zen/go/v1/*) are
// untouched and still power BYOK cloud routing -- only this marketing page
// stops advertising a paid tier that does not exist.
export default function Home() {
  const loggedin = createAsync(() => checkLoggedIn())
  const language = useLanguage()
  return (
    <main data-page="zen">
      <Title>Zen</Title>
      <LocaleLinks path="/zen" />
      <Meta name="opencode:auth" content={loggedin() ? "true" : "false"} />

      <div data-component="container">
        <Header zen hideGetStarted />

        <div data-component="content">
          <div class={styles.root}>
            <h1>No paid "Zen" plan</h1>
            <p>
              BotConnector has no paid subscriptions, payment processing, or active billing today. Local models are
              free -- you cover your own hardware. Cloud routing uses your own provider API keys, billed directly by
              that provider at their standard rates; BotConnector adds no markup.
            </p>
            <p>
              If BotConnector introduces paid services in the future, pricing and usage terms will be published
              before anything is charged.
            </p>
            <p>
              <a href="/auth">Get started</a> · <a href={language.route("/docs")}>Read the docs</a>
            </p>
          </div>

          <EmailSignup />

          <Footer />
        </div>
      </div>

      <Legal />
    </main>
  )
}
