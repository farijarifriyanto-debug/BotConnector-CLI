import "./index.css"
import { createAsync, query } from "@solidjs/router"
import { Title, Meta } from "@solidjs/meta"
import { EmailSignup } from "~/component/email-signup"
import { Legal } from "~/component/legal"
import { Footer } from "~/component/footer"
import { Header } from "~/component/header"
import { config } from "~/config"
import { getLastSeenWorkspaceID } from "../workspace/common"
import { useLanguage } from "~/context/language"
import { LocaleLinks } from "~/component/locale-links"
import styles from "./not-active.module.css"

const checkLoggedIn = query(async () => {
  "use server"
  return await getLastSeenWorkspaceID().catch(() => undefined)
}, "checkLoggedIn.get")

// BotConnector does not currently offer a paid "Go" subscription, or any
// paid subscription of its own (see https://botconnector.id/pricing). Local
// models are free; cloud routing is bring-your-own-API-key with no
// BotConnector markup. This route previously rendered opencode's real Go
// marketing page (subscription pricing, checkout CTA, per-model retention
// FAQ); that content is replaced with an honest static notice.
export default function Home() {
  const workspaceID = createAsync(() => checkLoggedIn())
  const language = useLanguage()
  return (
    <main data-page="go">
      <Title>Go</Title>
      <Meta name="description" content="BotConnector has no paid subscriptions today." />
      <LocaleLinks path="/go" />
      <Meta property="og:type" content="website" />
      <Meta property="og:url" content={`${config.baseUrl}${language.route("/go")}`} />
      <Meta property="og:title" content="Go" />
      <Meta name="opencode:auth" content={workspaceID() ? "true" : "false"} />

      <div data-component="container">
        <Header go hideGetStarted />

        <div data-component="content">
          <div class={styles.root}>
            <h1>No paid "Go" plan</h1>
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
