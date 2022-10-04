const { assert } = require('chai')

const EthSwap = artifacts.require('EthSwap')
const Token = artifacts.require('Token')

require('chai').use(require('chai-as-promised')).should()

const tokens = (n) => web3.utils.toWei(n, 'ether')

contract('EthSwap', ([deployer, investor]) => {
  let token, ethSwap

  before(async () => {
    token = await Token.new()
    ethSwap = await EthSwap.new(token.address)
    await token.transfer(ethSwap.address, tokens('1000000'))
  })

  describe('Token deployment', async () => {
    it('token has a name', async () => {
      const name = await token.name()
      assert.equal(name, 'RC Token')
    })
  })
  describe('EthSwap deployment', async () => {
    it('contract has a name', async () => {
      const name = await ethSwap.name()
      assert.equal(name, 'EthSwap Instant Exchange')
    })

    it('contract has tokens', async () => {
      const ethSwapBalance = await token.balanceOf(ethSwap.address)
      assert.equal(ethSwapBalance.toString(), tokens('1000000'))
    })
  })

  describe('Buy tokens', async () => {
    let result

    before(async () => {
      result = await ethSwap.buyTokens({
        from: investor,
        value: web3.utils.toWei('10', 'ether'),
      })
    })

    it('allows users to buy tokens instantly', async () => {
      let investorBalance = await token.balanceOf(investor)
      assert.equal(investorBalance.toString(), tokens('1000'))

      let ethSwapBalance = await token.balanceOf(ethSwap.address)
      assert.equal(ethSwapBalance.toString(), tokens('999000'))

      ethSwapBalance = await web3.eth.getBalance(ethSwap.address)
      assert.equal(ethSwapBalance.toString(), web3.utils.toWei('10', 'ether'))

      const event = result.logs[0].args
      assert.equal(event.account, investor)
      assert.equal(event.token, token.address)
      assert.equal(event.amount.toString(), tokens('1000').toString())
      assert.equal(event.rate.toString(), '100')
    })
  })

  describe('Sell tokens', async () => {
    let result

    before(async () => {
      await token.approve(ethSwap.address, tokens('1000'), { from: investor })
      result = await ethSwap.sellTokens(tokens('1000'), { from: investor })
    })

    it('allows users to sell tokens instantly', async () => {
      let investorBalance = await token.balanceOf(investor)
      assert.equal(investorBalance.toString(), tokens('0'))

      let ethSwapBalance = await token.balanceOf(ethSwap.address)
      assert.equal(ethSwapBalance.toString(), tokens('1000000'))

      ethSwapBalance = await web3.eth.getBalance(ethSwap.address)
      assert.equal(ethSwapBalance.toString(), web3.utils.toWei('0', 'ether'))

      const event = result.logs[0].args
      assert.equal(event.account, investor)
      assert.equal(event.token, token.address)
      assert.equal(event.amount.toString(), tokens('1000').toString())
      assert.equal(event.rate.toString(), '100')

      // FAILURE: Investors can't sell more tokens than they have
      await ethSwap.sellTokens(tokens('5000'), { from: investor }).should.be
        .rejected
    })
  })
})
