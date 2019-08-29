import Router from "vue-router"
import routes from "./routes"
import Vue from "vue"

/* istanbul ignore next */
Vue.use(Router)

export const routeGuard = store => async (to, from, next) => {
  await waitForAvailable(() => store.state.networks.network)
  if (
    to.meta.feature &&
    !store.state.networks.network[`feature_${to.meta.feature.toLowerCase()}`]
  ) {
    next(`/feature-not-available/${to.meta.feature}`)
  }
  if (from.fullPath !== to.fullPath && !store.state.session.pauseHistory) {
    store.commit(`addHistory`, from.fullPath)
  }

  next()
}

/* istanbul ignore next */
const router = new Router({
  scrollBehavior: () => ({ y: 0 }),
  routes
})

export default router

async function waitForAvailable(selectorFn) {
  if (selectorFn() === null || selectorFn() === undefined) {
    await new Promise(resolve =>
      setTimeout(async () => {
        await waitForAvailable(selectorFn)
        resolve()
      }, 50)
    )
  }
}
