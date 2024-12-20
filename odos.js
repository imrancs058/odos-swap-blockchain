const { Web3 } = require('web3');
const axios = require('axios'); // Import axios

const quoteUrl = 'https://api.odos.xyz/sor/quote/v2';
const assembleUrl = 'https://api.odos.xyz/sor/assemble'; // Add the assembleUrl

const main = async () => {
   
  const quoteRequestBody = {
    chainId: 324, // Replace with desired chainId
    "gasPrice": 20,
    inputTokens: [
      {
        tokenAddress: '0x493257fD37EDB34451f62EDf8D2a0C418852bA4C', // checksummed input token address
        amount: '2', // input amount as a string in fixed integer precision
      }
    ],
    outputTokens: [
      {
        tokenAddress: '0x1d17CBcF0D6D143135aE902365D2E5e2A16538D4', // checksummed output token address
        proportion: '1'
      }
    ],
    userAddr: 'my wallet address', // checksummed user address
    slippageLimitPercent: 0.3, // set your slippage limit percentage (1 = 1%),
    referralCode: 0, // referral code (recommended)
    disableRFQs: true,
    compact: true,
  };

  try {
    // 1. Send quote request using axios
    const quoteResponse = await axios.post(quoteUrl, quoteRequestBody, {
      headers: { 'Content-Type': 'application/json' },
    });

    if (quoteResponse.status === 200) {
      const quote = quoteResponse.data; // Handle quote response data

      const assembleRequestBody = {
        userAddr: 'my wallet address', // the checksummed address used to generate the quote
        pathId: quote.pathId, // Replace with the pathId from quote response in step 1
        simulate: true, // this can be set to true if the user isn't doing their own estimate gas call for the transaction
      };

      // 2. Send assemble request using axios
      const assembleResponse = await axios.post(assembleUrl, assembleRequestBody, {
        headers: { 'Content-Type': 'application/json' },
      });

      if (assembleResponse.status === 200) {
        const assembledTransaction = assembleResponse.data; // Handle Transaction Assembly response data

        // 3. Create web3 provider
        const web3 = new Web3('https://zksync-mainnet.g.alchemy.com/v2/secretID');

        // 4. Extract transaction object from assemble API response
        const transaction = assembledTransaction.transaction;

        // 5. Sign transaction with a web3 provider / wallet
        let txHash;
        
        txHash = await web3.eth.accounts.signTransaction(transaction);

        // 6. Sign transaction with private key
        const pk = 'Private Key'; // Use your private key securely
        const signedTx = await web3.eth.accounts.signTransaction(transaction, pk);

        // 7. Send the signed transaction
        const sendTx = await web3.eth.sendRawTransaction(signedTx.rawTransaction);
        txHash = sendTx.transactionHash;

        console.log('Transaction Hash:', txHash); // Output transaction hash
      } else {
        console.error('Error in Transaction Assembly:', assembleResponse);
      }
    } else {
      console.error('Error in Quote:', quoteResponse);
    }
  } catch (error) {
    console.error('Error:', error);
  }
};

main().then((data) => {
  console.log(data);
}).catch((err) => {
  console.log(err);
});
