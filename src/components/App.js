import React, { Component } from 'react'
import Navbar from './Navbar'
import Web3 from 'web3'
import EthSwap from '../abis/EthSwap.json'
import Token from '../abis/Token.json'
import './App.css'
import Main from './Main'

class App extends Component {
  async componentDidMount() {
    await this.loadWeb3()
    await this.loadBlockChainData()
  }

  async loadBlockChainData() {
    const web3 = window.web3
    const accounts = await web3.eth.requestAccounts()

    this.setState({ account: accounts[0] })

    const ethBalance = await web3.eth.getBalance(this.state.account)
    this.setState({ ethBalance })

    // Load Token
    const networkId = await web3.eth.net.getId()

    const tokenData = Token.networks[networkId]

    if (tokenData) {
      const token = new web3.eth.Contract(Token.abi, tokenData.address)
      this.setState({ token });

      const tokenBalance = await token.methods.balanceOf(this.state.account).call();
      this.setState({tokenBalance: tokenBalance.toString()});
    } else {
      window.alert('RC Token Contract not found in network')
    }
    
    // Load EthSwap

    const ethSwapData = EthSwap.networks[networkId]

    if (ethSwapData) {
      const ethSwap = new web3.eth.Contract(EthSwap.abi, ethSwapData.address)
      this.setState({ ethSwap });
    } else {
      window.alert('EthSwap contract not found in network')
    }
  }

  async loadWeb3() {
    if (window.etherium) {
      window.web3 = new Web3(window.etherium)
      await window.etherium.enable()
    } else if (window.web3) {
      window.web3 = new Web3(window.web3.currentProvider)
    } else {
      window.alert('Non-etherium browser detected! Try Metamask')
    }
    this.setState({loading: false})
  }


  buyTokens = (etherAmount) => {
    this.setState({ loading: true })
    this.state.ethSwap.methods.buyTokens().send({ value: etherAmount, from: this.state.account }).on('transactionHash', (hash) => {
      this.setState({ loading: false })
    })
  }

  sellTokens = (tokenAmount) => {
    this.setState({ loading: true })
    this.state.token.methods.approve(this.state.ethSwap.address, tokenAmount).send({ from: this.state.account }).on('transactionHash', (hash) => {
      this.state.ethSwap.methods.sellTokens(tokenAmount).send({ from: this.state.account }).on('transactionHash', (hash) => {
        this.setState({ loading: false })
      })
    })
  }

  constructor(props) {
    super(props)
    this.state = {
      account: '',
      token: {},
      ethSwap: {},
      tokenBalance: '0',
      ethBalance: '0',
      loading: true,
    }
  }

  render() {
    let content
    if(this.state.loading) {
      content = <p id="loader" className="text-center">Loading...</p>
    } else {
      content = <Main
        ethBalance={this.state.ethBalance}
        tokenBalance={this.state.tokenBalance}
        buyTokens={this.buyTokens}
        sellTokens={this.sellTokens}
      />
    }

    return (
      <div>
        <Navbar account={this.state.account} />
        <div className="container-fluid mt-5">
          <div className="row">
            <main role="main" className="col-lg-12 d-flex text-center">
              <div className="content mr-auto ml-auto">
                <a
                  href="https://github.com/w3rc"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                </a>

                {content}

              </div>
            </main>
          </div>
        </div>
      </div>
    )
  }
}

export default App
