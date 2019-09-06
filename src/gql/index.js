/* istanbul ignore file */

import gql from "graphql-tag"

export const schemaMap = {
  cosmoshub: "",
  [`gaia-testnet`]: "gaia_testnet_"
}

const ValidatorFragment = `
    avatarUrl
    consensus_pubkey
    customized
    delegator_shares
    details
    id
    identity
    jailed
    keybaseId
    lastUpdated
    max_change_rate
    max_rate
    min_self_delegation
    moniker
    operator_address
    profileUrl
    rate
    status
    tokens
    unbonding_height
    unbonding_time
    update_time
    uptime_percentage
    userName
    voting_power
    website
`

export const AllValidators = schema => gql`
  query AllValidators {
    ${schemaMap[schema]}allValidators {
      ${ValidatorFragment}
    }
  }
`

export const ValidatorProfile = schema => gql`
  query ValidatorInfo($address: String) {
    ${schemaMap[schema]}allValidators(where: { operator_address: { _eq: $address } }) {
      ${ValidatorFragment}
    }
  }
`

export const SomeValidators = schema => gql`
  query ValidatorInfo($addressList: [String!]) {
    ${schemaMap[schema]}allValidators(where: { operator_address: { _in: $addressList } }) {
      ${ValidatorFragment}
    }
  }
`

// export const AllValidatorsResult = schema => data =>
//   data[`${schema}${"allValidators"}`]

export const AllValidatorsResult = schema => data =>
  data[`${schemaMap[schema]}allValidators`]

export const ValidatorResult = schema => data =>
  data[`${schemaMap[schema]}allValidators`][0]

export const Networks = gql`
  query Networks {
    networks {
      id
      chain_id
      logo_url
      testnet
      title
      rpc_url
    }
  }
`

export const NetworkCapabilities = networkId => gql`
query Networks {
  networks(where: {id: {_eq: "${networkId}"}}) {
    action_delegate
    action_proposal
    action_deposit
    action_vote
    action_redelegate
    action_send
    action_undelegate
    action_withdraw
  }
}
`

// capability is 'feature_portfolio' / 'action_send'
export const NetworkCapability = (networkId, capability) => gql`
query Networks {
  networks(where: {id: {_eq: "${networkId}"}, ${capability}: {_eq: true}}) {
    id
  }
}
`

export const NetworkCapabilityResult = data => data.networks.length === 1
export const NetworksResult = data => data.networks
