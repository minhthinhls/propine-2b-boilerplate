// Write your answer here

const axios = require('axios').default;

const {getLastLine, traverseLines, getLastNthLine} = require('./readline');

// By default, running `index.js` via `NODE_ENV=COMMAND` will not start ExpressJS Server.
if (!process.argv[2]) {
    process.argv[2] = "NODE_ENV=COMMAND";
}

const [, env] = process.argv[2].split("=");

const getAllTokens = async (filePath) => {
    const tokens = new Set();

    await traverseLines(`${filePath}`, (_timestamp, _transaction_type, _token, _amount) => {
        if (_token === 'token') {
            return void 0; // Skip first line in CSV file.
        }
        tokens.add(_token);
    });

    return [...tokens];
};

const main = async () => {
    const filePath = 'data/transactions.csv';
    // Can be ENUM in TypeScript.
    const TRANSACTION_TYPE = {
        DEPOSIT: 'DEPOSIT',
        WITHDRAWAL: 'WITHDRAWAL',
    };
    /*
    const nthLastLines = await getLastNthLine('data/transactions.csv', 5);
    console.log(nthLastLines);
    const lastLine = await getLastLine(`${filePath}`);
    if (!lastLine) {
        throw new Error("Empty Data !");
    }
     */

    const tokens = await getAllTokens(`${filePath}`);
    const balanceMapperByTokens = {};

    tokens.forEach((token) => {
        balanceMapperByTokens[token] = 0;
    });

    await traverseLines(`${filePath}`, (_timestamp, _transaction_type, _token, _amount) => {
        if (_token === 'token') {
            return void 0; // Skip first line in CSV file.
        }
        if (_transaction_type === TRANSACTION_TYPE.DEPOSIT) {
            balanceMapperByTokens[_token] -= +(_amount); // Cast `_amount` first to number.
            return void 0;
        }
        if (_transaction_type === TRANSACTION_TYPE.WITHDRAWAL) {
            balanceMapperByTokens[_token] += +(_amount); // Cast `_amount` first to number.
            return void 0;
        }
    });

    // Call APIs for load Token Portfolio into USD.
    // @example: 'https://min-api.cryptocompare.com/data/price?fsym=XRP&tsyms=USD,JPY,EUR'
    const response = await Promise.all([
        ...tokens.map((token) => {
            return axios.get(`https://min-api.cryptocompare.com/data/price`, {
                params: {
                    fsym: token,
                    tsyms: 'USD',
                },
            });
        }),
    ]);

    const tokenByUSD = {};
    tokens.forEach((token, index) => {
        tokenByUSD[token] = response[index].data.USD;
    });

    const outputs = [];

    for (const [token, balance] of Object.entries(balanceMapperByTokens)) {
        const output = `${token} Portfolio: ${balance * tokenByUSD[token]} (USD)`;
        outputs.push(output);
        console.log(`${token} Portfolio:`, balance * tokenByUSD[token], '(USD)');
    }

    return outputs.join("\n");
};

// Implements ExpressJS to Server HTTP Request here.

(() => {
    if (env === "COMMAND") {
        return main();
    }
    const express = require('express');
    const app = express();

    app.get('/', async function (req, res) {
        res.send(await main());
    });

    app.listen(80);
    app.listen(443);
})();
