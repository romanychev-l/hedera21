import {
    server
} from './sets.js';

const {
    Client,
    PrivateKey,
    TokenCreateTransaction,
    AccountBalanceQuery,
    TransferTransaction,
    TokenAssociateTransaction,
    TokenMintTransaction,
    Hbar,
    getAccountDetails
} = require("@hashgraph/sdk");
require("dotenv").config();

const treasuryAccountId = server.accountId;
const treasuryPrivateKey = server.privateKey;
const adminPrivateKey = PrivateKey.fromString(treasuryPrivateKey);
const adminPublicKey = adminPrivateKey.publicKey;

const client = Client.forTestnet();
client.setOperator(treasuryAccountId, treasuryPrivateKey);

export async function createToken(name, symbol) {
    const transaction = await new TokenCreateTransaction()
        .setTokenName(name)
        .setTokenSymbol(symbol)
        .setTreasuryAccountId(treasuryAccountId)
        .setInitialSupply(5000)
        .setAdminKey(adminPublicKey)
        .freezeWith(client);

    const preTx = await transaction.sign(adminPrivateKey);
    const signTx = await preTx.sign(adminPrivateKey);
    const txResponse = await signTx.execute(client);
    const txReceipt = await txResponse.getReceipt(client);

    return txReceipt.tokenId.toString();
}

export async function buyToken(tokenId, count, accountId, accountKey) {
    // Associate

    try {
        const transaction_ass = await new TokenAssociateTransaction()
            .setAccountId(accountId)
            .setTokenIds([tokenId])
            .freezeWith(client);

        const signTx_ass = await transaction_ass.sign(PrivateKey.fromString(accountKey));
        const txResponse_ass = await signTx_ass.execute(client);

        // const txReceipt_ass = await txResponse_ass.getReceipt(client);
        // console.log(txReceipt_ass.status);
    } catch {
        // console.log('already');
    }

    // Transfer

    const transaction = await new TransferTransaction()
        .addTokenTransfer(tokenId, treasuryAccountId, -count)
        .addTokenTransfer(tokenId, accountId, count)
        .freezeWith(client);

    const signTx = await transaction.sign(adminPrivateKey);
    const txResponse = await signTx.execute(client);

    // console.log(txResponse.transactionId.toString());
}

export async function getBalance(accountId) {
    const query = new AccountBalanceQuery().setAccountId(accountId);
    const tokenBalance = await query.execute(client);
    return tokenBalance.tokens.toString();
}

export async function transfer(fromId, toId, fromKey) {
    const transferTransactionResponse = await new TransferTransaction()
        .addHbarTransfer(fromId, Hbar.fromTinybars(-5000))
        .addHbarTransfer(toId, Hbar.fromTinybars(5000))
        .execute(client);

    // const transactionReceipt = await transferTransactionResponse.getReceipt(client);
    // console.log(transactionReceipt.status.toString());

    const getNewBalance = await new AccountBalanceQuery()
        .setAccountId(toId)
        .execute(client);

    return getNewBalance.hbars.toTinybars().toString();
}


// const token = await createToken("Token", "TOK");
// console.log(token);
//
// const balance_transfer = await transfer(treasuryAccountId, "0.0.307141", treasuryPrivateKey);
// console.log(balance_transfer);
//
// await buyToken("0.0.305536", 1, "0.0.307141", "302e020100300506032b6570042204201b00250e3e1892eba8f81ee42b401354095bc59e2017c4942b6be8daf7a76844");
//
// const balance = await getBalance("0.0.307141");
// console.log(balance);
