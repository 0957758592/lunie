/* istanbul ignore file: really just integrations */

import { listenToExtensionMessages } from "scripts/extension-utils"
import {
  enableGoogleAnalytics,
  setGoogleAnalyticsPage
} from "scripts/google-analytics"
import config from "src/config"
import router, { routeGuard } from "./router"
import Store from "./vuex/store"
import { createApolloProvider } from "src/gql/apollo.js"

function setOptions(urlParams, store) {
  if (urlParams.experimental) {
    store.commit(`setExperimentalMode`)
  }
  if (urlParams.rpc) {
    store.commit(`setRpcUrl`, urlParams.rpc)
  }
  if (config.mobileApp || urlParams.insecure) {
    store.commit(`setInsecureMode`)
  }
}

export default function init(urlParams, env = process.env) {
  // add error handlers in production
  if (env.NODE_ENV === `production`) {
    enableGoogleAnalytics(config.google_analytics_uid)
  }

  const stargate = urlParams.stargate || config.stargate
  console.log(`Expecting stargate at: ${stargate}`)

  const apolloProvider = createApolloProvider(urlParams)
  const apolloClient = apolloProvider.clients.defaultClient

  const store = Store({ apollo: apolloClient })

  setGoogleAnalyticsPage(router.currentRoute.path)
  router.beforeEach(routeGuard(store, apolloClient))
  router.afterEach(to => {
    /* istanbul ignore next */
    setGoogleAnalyticsPage(to.path)
  })

  setOptions(urlParams, store)

  store.dispatch(`loadLocalPreferences`)
  store.dispatch(`checkForPersistedSession`)
  store.dispatch(`checkForPersistedAddresses`)

  listenToExtensionMessages(store)

  return { store, router, apolloProvider }
}
