import {
  listenToExtensionMessages,
  processLunieExtensionMessages,
  getWalletsFromExtension,
  signWithExtension
} from "scripts/extension-utils.js"

describe(`Extension Utils`, () => {
  describe("listenToExtensionMessages", () => {
    let store

    beforeEach(() => {
      store = {
        commit: jest.fn(),
        dispatch: jest.fn()
      }
    })

    it("listens for extension messages", () => {
      const spy = jest.spyOn(global, "addEventListener")
      listenToExtensionMessages(store)
      expect(spy).toHaveBeenCalledWith("message", expect.any(Function))
    })

    it("should signal that the extension is enabled", () => {
      processLunieExtensionMessages(store)({
        source: global,
        data: {
          type: "FROM_LUNIE_EXTENSION",
          message: {
            type: "INIT_EXTENSION"
          }
        }
      })

      expect(store.commit).toHaveBeenCalledWith("setExtensionAvailable")
      expect(store.dispatch).toHaveBeenCalledWith("getAddressesFromExtension")
    })

    it("should ignore messages not from the extension", () => {
      processLunieExtensionMessages(store)({
        source: global,
        data: {
          type: "NOT_FROM_LUNIE_EXTENSION",
          message: {
            type: "INIT_EXTENSION"
          }
        }
      })

      expect(store.commit).not.toHaveBeenCalledWith("setExtensionAvailable")
    })
  })

  describe("messages", () => {
    beforeEach(() => {
      jest.spyOn(global, "postMessage")
      global.postMessage.mockClear()
    })
    afterAll(() => {
      global.postMessage.mockReset()
    })

    it("should request wallets", async () => {
      const spy = jest.spyOn(global, "addEventListener")
      getWalletsFromExtension()
      expect(spy).toHaveBeenCalledWith("message", expect.any(Function))
      expect(global.postMessage.mock.calls).toEqual([
        [
          {
            payload: { type: "GET_WALLETS" },
            skipResponse: false,
            type: "FROM_LUNIE_IO"
          },
          "*"
        ]
      ])
    })

    it("should receive wallets", async () => {
      global.addEventListener.mockImplementationOnce((type, callback) => {
        callback({
          source: global,
          data: {
            message: {
              payload: {
                wallets: [{ name: "Baz", address: "cosmos1" }]
              },
              type: "GET_WALLETS_RESPONSE"
            },
            type: "FROM_LUNIE_EXTENSION"
          }
        })
      })
      const result = await getWalletsFromExtension("abc")
      expect(result).toEqual({
        wallets: [{ name: "Baz", address: "cosmos1" }]
      })
    })

    describe("sign", () => {
      beforeEach(() => {
        jest.spyOn(global, "addEventListener")
        global.postMessage.mockClear()
      })

      afterAll(() => {
        global.addEventListener.mockReset()
      })

      it("should request a signature", () => {
        signWithExtension("abc", "cosmos1234")
        expect(global.postMessage.mock.calls).toEqual([
          [
            {
              payload: {
                payload: {
                  senderAddress: "cosmos1234",
                  signMessage: "abc"
                },
                type: "LUNIE_SIGN_REQUEST"
              },
              skipResponse: false,
              type: "FROM_LUNIE_IO"
            },
            "*"
          ]
        ])
      })

      it("should react to signature rejection", () => {
        global.addEventListener.mockImplementationOnce((type, callback) => {
          callback({
            source: global,
            data: {
              message: {
                payload: {
                  rejected: true
                },
                type: "LUNIE_SIGN_REQUEST_RESPONSE"
              },
              type: "FROM_LUNIE_EXTENSION"
            }
          })
        })
        expect(signWithExtension("abc")).rejects.toThrow(
          "User rejected action in extension."
        )
      })

      it("should react to signature approval", async () => {
        global.addEventListener.mockImplementationOnce((type, callback) => {
          callback({
            source: global,
            data: {
              message: {
                payload: {
                  signature: "abcd",
                  publicKey: "1234"
                },
                type: "LUNIE_SIGN_REQUEST_RESPONSE"
              },
              type: "FROM_LUNIE_EXTENSION"
            }
          })
        })
        const result = await signWithExtension("abc")
        expect(result).toEqual({
          signature: expect.any(Buffer),
          publicKey: expect.any(Buffer)
        })
      })
    })
  })
})
