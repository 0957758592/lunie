import { shallowMount, createLocalVue } from "@vue/test-utils"
import LiProposal from "renderer/components/governance/LiProposal"

import { proposals, tallies } from "../../store/json/proposals"

const proposal = proposals[`1`]

describe(`LiProposal`, () => {
  const localVue = createLocalVue()
  localVue.directive(`tooltip`, () => { })

  let wrapper

  beforeEach(() => {
    const $store = {
      commit: jest.fn(),
      dispatch: jest.fn(),
      getters: {
        proposals: {
          tallies
        }
      }
    }

    wrapper = shallowMount(LiProposal, {
      localVue,
      mocks: {
        $store
      },
      propsData: { proposal },
      stubs: [`router-link`]
    })
  })

  it(`has the expected html structure`, () => {
    expect(wrapper.vm.$el).toMatchSnapshot()
  })

  it(`should return status info for passed proposals`, () => {
    wrapper.setProps({
      proposal: {
        proposal_status: `Passed`,
        proposal_id: `2`,
        title: `Really Cool Proposal `,
        description: `Really cool proposal description`,
      },
    })
    expect(wrapper.vm.status).toEqual({
      message: `This proposal has passed`
    })
  })

  it(`should return status info for rejected proposals`, () => {
    wrapper.setProps({
      proposal: {
        proposal_status: `Rejected`,
        proposal_id: `2`,
        title: `Really Cool Proposal `,
        description: `Really cool proposal description`,
      },
    })
    expect(wrapper.vm.status).toEqual({
      message: `This proposal has been rejected and voting is closed`,
      color: `red`
    })
  })

  it(`should return status info for active proposals`, () => {
    wrapper.setProps({
      proposal: {
        proposal_status: `VotingPeriod`,
        proposal_id: `2`,
        title: `Really Cool Proposal `,
        description: `Really cool proposal description`,
      },
    })
    expect(wrapper.vm.status).toEqual({
      message: `Voting for this proposal is open`,
      color: `green`
    })
  })

  it(`should return status info for 'DepositPeriod' proposals`, () => {
    wrapper.setProps({
      proposal: {
        proposal_status: `DepositPeriod`,
        proposal_id: `2`,
        title: `Really Cool Proposal `,
        description: `Really cool proposal description`,
      },
    })
    expect(wrapper.vm.status).toEqual({
      message: `Deposits are open for this proposal`,
      color: `yellow`
    })
  })

  it(`should return status info for an unknown proposal type`, () => {
    wrapper.setProps({
      proposal: {
        proposal_status: `Unknown`,
        proposal_id: `2`,
        title: `Really Cool Proposal `,
        description: `Really cool proposal description`,
      },
    })
    expect(wrapper.vm.status).toEqual({
      message: `There was an error determining the status of this proposal.`,
      color: `grey`
    })
  })

  it(`should not truncate the description or add an ellipsis`, () => {
    expect(wrapper.vm.description).toEqual(`Proposal description`)
  })

  it(`should truncate the description and add an ellipsis`, () => {
    wrapper.setProps({
      proposal: {
        proposal_status: `Status`,
        proposal_id: `2`,
        title: `Really Cool Proposal `,
        description: `This is some kind of long description. longer than 100 characters for optimum-maximum-ideal truncation.`,
      },
    })
    expect(wrapper.vm.description).toEqual(
      `This is some kind of long description. longer than 100 characters for optimum-maximum-ideal truncati…`
    )
  })

  it(`should survive the tally result not being present yet`, () => {
    const $store = {
      commit: jest.fn(),
      dispatch: jest.fn(),
      getters: {
        proposals: {
          tallies: {}
        }
      }
    }

    wrapper = shallowMount(LiProposal, {
      localVue,
      mocks: {
        $store
      },
      propsData: { proposal },
      stubs: [`router-link`]
    })

    expect(wrapper.vm.$el).toMatchSnapshot()
  })
})
