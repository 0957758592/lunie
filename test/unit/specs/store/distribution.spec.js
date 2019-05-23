import distributionModule from "modules/distribution.js"

describe(`Module: Fee Distribution`, () => {
  let module, state, commit, dispatch, actions, mutations, rootState
  const coinArray = [
    { denom: `stake`, amount: `100` },
    { denom: `photino`, amount: `15` }
  ]
  const parameters = {
    base_proposer_reward: `10.00`,
    bonus_proposer_reward: `3.5`,
    community_tax: `15`
  }
  const node = {
    get: {
      delegatorRewards: jest.fn(async () => coinArray),
      delegatorRewardsFromValidator: jest.fn(async () => coinArray),
      distributionParameters: jest.fn(async () => parameters),
      distributionOutstandingRewards: jest.fn(async () => coinArray)
    }
  }
  const rewards = {
    stake: 100,
    photino: 15
  }

  beforeEach(() => {
    module = distributionModule({ node })
    state = module.state
    actions = module.actions
    mutations = module.mutations

    commit = jest.fn()
    dispatch = jest.fn()

    rootState = {
      session: { address: `cosmos1address` },
      wallet: { address: `cosmos1address` }
    }
  })

  describe(`Mutations`, () => {
    it(`sets the total delegator rewards earned from all delegations`, async () => {
      mutations.setTotalRewards(state, rewards)
      expect(state.totalRewards).toMatchObject(rewards)
    })

    it(`sets the delegation rewards from a `, () => {
      const validatorAddr = `cosmosvalopr1address`
      mutations.setDelegationRewards(state, { validatorAddr, rewards })
      expect(state.rewards[validatorAddr]).toBe(rewards)
    })

    it(`sets the account public key`, () => {
      mutations.setDistributionParameters(state, parameters)
      expect(state.parameters).toMatchObject(parameters)
    })

    it(`updates the state if the device is connected`, () => {
      mutations.setOutstandingRewards(state, rewards)
      expect(state.outstandingRewards).toMatchObject(rewards)
    })

    it(`sets an error`, () => {
      const error = Error(`distribution error`)
      mutations.setDistributionError(state, error)
      expect(state.error).toBe(error)
    })
  })

  describe(`Actions`, () => {
    describe(`reconnection`, () => {
      it(`gets total rewards when the user has logged in and is loading`, async () => {
        await actions.reconnected({
          state: { loading: true },
          dispatch,
          rootState: { session: { signedIn: true } }
        })
        expect(dispatch).toHaveBeenCalledWith(`getTotalRewards`)
      })

      it(`fails getting total rewards if it's not loading`, async () => {
        await actions.reconnected({
          state: { loading: false },
          dispatch,
          rootState: { session: { signedIn: true } }
        })
        expect(dispatch).not.toHaveBeenCalledWith(`getTotalRewards`)
      })

      it(`fails getting total rewards if the user hasn't logged in`, async () => {
        await actions.reconnected({
          state: { loading: true },
          dispatch,
          rootState: { session: { signedIn: false } }
        })
        expect(dispatch).not.toHaveBeenCalledWith(`getTotalRewards`)
      })
    })

    describe(`resetSessionData`, () => {
      it(`should clear all distribution data`, () => {
        state.totalRewards = { stake: 10 }
        actions.resetSessionData({ rootState })
        expect(rootState.distribution.totalRewards).toEqual({})
      })
    })

    describe(`getTotalRewards`, () => {
      beforeEach(() => {
        node.get.delegatorRewards.mockClear()
      })

      it(`success`, async () => {
        await actions.getTotalRewards({ state, rootState, commit })
        expect(node.get.delegatorRewards).toHaveBeenCalledWith(
          rootState.session.address
        )
        expect(commit).toHaveBeenCalledWith(`setTotalRewards`, rewards)
      })

      it(`fails`, async () => {
        node.get.delegatorRewards = jest.fn(async () =>
          Promise.reject(Error(`invalid address`))
        )
        await actions.getTotalRewards({ state, rootState, commit })
        expect(node.get.delegatorRewards).toHaveBeenCalledWith("cosmos1address")
        expect(commit).not.toHaveBeenCalledWith(`setTotalRewards`, rewards)
        expect(commit).toHaveBeenCalledWith(
          `setDistributionError`,
          Error(`invalid address`)
        )
      })

      it(`ignores calls if no address is present`, async () => {
        rootState = { session: { address: null } }
        await actions.getTotalRewards({ state, rootState, commit })
        expect(node.get.delegatorRewards).not.toHaveBeenCalled()
      })
    })

    describe(`withdrawAllRewards`, () => {
      it(`should simulate a withdrawal transaction`, async () => {
        const { actions } = module
        const self = {
          rootState,
          dispatch: jest.fn(() => 123123)
        }
        const res = await actions.simulateWithdrawAllRewards(self)

        expect(self.dispatch).toHaveBeenCalledWith(`simulateTx`, {
          type: `MsgWithdrawDelegationReward`,
          txArguments: {
            toAddress: `cosmos1address`,
            validatorAddresses: []
          }
        })
        expect(res).toBe(123123)
      })

      it(`success withdrawal`, async () => {
        await actions.withdrawAllRewards(
          {
            rootState,
            dispatch,
            getters: {
              committedDelegations: {
                coolval1: {}
              }
            }
          },
          {
            gas: 456,
            gasPrice: 123,
            password: ``,
            submitType: `ledger`
          }
        )
        expect(dispatch).toHaveBeenCalledWith(`sendTx`, {
          type: `MsgWithdrawDelegationReward`,
          txArguments: {
            toAddress: `cosmos1address`,
            validatorAddresses: [`coolval1`]
          },
          password: ``,
          submitType: `ledger`,
          gas: "456",
          gas_prices: [{ amount: "123000000", denom: undefined }]
        })
        expect(dispatch).toHaveBeenCalledWith(`getTotalRewards`)
      })

      it(`success withdrawal one address`, async () => {
        await actions.withdrawAllRewards(
          {
            rootState,
            dispatch,
            getters: {
              committedDelegations: {
                address1: 100,
                address2: 1,
                address3: 5,
                address4: 3,
                address5: 0,
                address6: 99,
                address7: 9,
                address8: 96,
                address9: 98,
                address10: 97
              }
            }
          },
          {
            gas: 456,
            gasPrice: 123,
            password: ``,
            submitType: `ledger`,
            validatorAddress: `address4`
          }
        )
        expect(dispatch).toHaveBeenCalledWith(`sendTx`, {
          type: `MsgWithdrawDelegationReward`,
          txArguments: {
            toAddress: `cosmos1address`,
            validatorAddresses: [`address4`]
          },
          password: ``,
          submitType: `ledger`,
          gas: "456",
          gas_prices: [{ amount: "123000000", denom: undefined }]
        })
        expect(dispatch).toHaveBeenCalledWith(`getTotalRewards`)
      })

      it(`success withdrawal top 5`, async () => {
        await actions.withdrawAllRewards(
          {
            rootState,
            dispatch,
            getters: {
              committedDelegations: {
                address1: 100,
                address2: 1,
                address3: 5,
                address4: 3,
                address5: 0,
                address6: 99,
                address7: 9,
                address8: 96,
                address9: 98,
                address10: 97
              }
            }
          },
          {
            gas: 456,
            gasPrice: 123,
            password: ``,
            submitType: `ledger`
          }
        )
        expect(dispatch).toHaveBeenCalledWith(`sendTx`, {
          type: `MsgWithdrawDelegationReward`,
          txArguments: {
            toAddress: `cosmos1address`,
            validatorAddresses: [
              `address1`,
              `address6`,
              `address9`,
              `address10`,
              `address8`
            ]
          },
          password: ``,
          submitType: `ledger`,
          gas: "456",
          gas_prices: [{ amount: "123000000", denom: undefined }]
        })
        expect(dispatch).toHaveBeenCalledWith(`getTotalRewards`)
      })
    })

    describe(`getRewardsFromMyValidators`, () => {
      it(`success`, async () => {
        const validators = [
          { operator_address: `cosmosvaloper1address1` },
          { operator_address: `cosmosvaloper1address2` }
        ]
        await actions.getRewardsFromMyValidators({
          state,
          dispatch,
          getters: { lastHeader: { height: `44` }, yourValidators: validators }
        })
        expect(dispatch).toBeCalledTimes(2)
        expect(dispatch).toBeCalledWith(
          `getRewardsFromValidator`,
          validators[0].operator_address
        )
        expect(dispatch).toBeCalledWith(
          `getRewardsFromValidator`,
          validators[1].operator_address
        )
      })

      it(`fails`, async () => {
        const validators = [
          { operator_address: undefined },
          { operator_address: `cosmosvaloper1address2` }
        ]
        dispatch = jest.fn(async () => Promise.reject(Error(`invalid address`)))
        await expect(
          actions.getRewardsFromMyValidators({
            state,
            dispatch,
            getters: {
              lastHeader: { height: `44` },
              yourValidators: validators
            }
          })
        ).rejects.toThrowError(`invalid address`)
      })

      it(`throttle to every 20 blocks`, async () => {
        const validators = [
          { operator_address: `cosmosvaloper1address1` },
          { operator_address: `cosmosvaloper1address2` }
        ]
        state.lastValidatorRewardsUpdate = 0
        await actions.getRewardsFromMyValidators({
          state,
          dispatch,
          getters: { lastHeader: { height: `43` }, yourValidators: validators }
        })
        expect(state.lastValidatorRewardsUpdate).toBe(43)
        dispatch.mockClear()
        await actions.getRewardsFromMyValidators({
          state,
          dispatch,
          getters: { lastHeader: { height: `44` }, yourValidators: validators }
        })
        expect(dispatch).not.toHaveBeenCalled()
      })
    })

    describe(`getRewardsFromValidator`, () => {
      it(`success`, async () => {
        const validatorAddr = `cosmosvaloper1address`
        await actions.getRewardsFromValidator(
          { state, rootState, commit },
          validatorAddr
        )
        expect(node.get.delegatorRewardsFromValidator).toHaveBeenCalledWith(
          rootState.session.address,
          validatorAddr
        )
        expect(commit).toHaveBeenCalledWith(`setDelegationRewards`, {
          validatorAddr,
          rewards
        })
      })

      it(`fails`, async () => {
        const validatorAddr = null
        node.get.delegatorRewardsFromValidator = jest.fn(async () =>
          Promise.reject(Error(`invalid validator address`))
        )
        await actions.getRewardsFromValidator(
          { state, rootState, commit },
          validatorAddr
        )
        expect(node.get.delegatorRewardsFromValidator).toHaveBeenCalledWith(
          rootState.session.address,
          null
        )
        expect(commit).not.toHaveBeenCalledWith(`setDelegationRewards`, {
          validatorAddr,
          rewards
        })
        expect(commit).toHaveBeenCalledWith(
          `setDistributionError`,
          Error(`invalid validator address`)
        )
      })
    })

    describe(`getDistributionParameters`, () => {
      it(`success`, async () => {
        await actions.getDistributionParameters({ state, rootState, commit })
        expect(node.get.distributionParameters).toHaveBeenCalled()
        expect(commit).toHaveBeenCalledWith(
          `setDistributionParameters`,
          parameters
        )
      })

      it(`fails`, async () => {
        node.get.distributionParameters = jest.fn(async () =>
          Promise.reject(Error(`unexpected error`))
        )
        await actions.getDistributionParameters({ state, rootState, commit })
        expect(node.get.distributionParameters).toHaveBeenCalled()
        expect(commit).not.toHaveBeenCalledWith(
          `setDistributionParameters`,
          parameters
        )
        expect(commit).toHaveBeenCalledWith(
          `setDistributionError`,
          Error(`unexpected error`)
        )
      })
    })

    describe(`getOutstandingRewards`, () => {
      it(`success`, async () => {
        await actions.getOutstandingRewards({ state, rootState, commit })
        expect(node.get.distributionOutstandingRewards).toHaveBeenCalled()
        expect(commit).toHaveBeenCalledWith(`setOutstandingRewards`, rewards)
      })

      it(`fails`, async () => {
        node.get.distributionOutstandingRewards = jest.fn(async () =>
          Promise.reject(Error(`unexpected error`))
        )
        await actions.getOutstandingRewards({ state, rootState, commit })
        expect(node.get.distributionOutstandingRewards).toHaveBeenCalled()
        expect(commit).not.toHaveBeenCalledWith(
          `setOutstandingRewards`,
          rewards
        )
        expect(commit).toHaveBeenCalledWith(
          `setDistributionError`,
          Error(`unexpected error`)
        )
      })
    })
  })
})
