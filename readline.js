const fs = require('fs');
const readline = require('readline');
const {Writable} = require('stream');

/**
 * @param {string} filePath - Relative File Path: [root === process.cwd()].
 * @returns {Promise<string>}
 */
exports.getLastLine = (filePath) => {
    const inputStream = fs.createReadStream(filePath);
    const outputStream = new Writable();

    return new Promise((resolve, reject) => {
        const cursor = readline.createInterface(inputStream, outputStream);

        let lastLine = '';
        cursor.on('line', function (line) {
            lastLine = line;
        });

        cursor.on('error', reject);

        cursor.on('close', function () {
            resolve(lastLine);
        });
    });
};

/**
 * @param {string} filePath - Relative File Path: [root === process.cwd()].
 * @param {function} callback - Receives 4 parameters.
 * @returns {Promise<string>}
 */
exports.traverseLines = (filePath, callback) => {
    const inputStream = fs.createReadStream(filePath);
    const outputStream = new Writable();

    return new Promise((resolve, reject) => {
        const cursor = readline.createInterface(inputStream, outputStream);

        cursor.on('line', function (line) {
            const [timestamp, transaction_type, token, amount] = line.split(',');
            // Since NodeJS run concurrency, there were no case of 2 write procedure access the same heap memory range.
            callback(timestamp, transaction_type, token, amount);
        });

        cursor.on('error', reject);

        cursor.on('close', function () {
            resolve(true);
        });
    });
};

/**
 * @param {string} filePath
 * @returns {ReadStream}
 */
const getInputStream = (filePath) => {
    return fs.createReadStream(filePath);
};

const getOutputStream = () => {
    return new Writable();
};

/**
 * @description - Get Nth last lines from the end of the file.
 * @param {string} filePath - Relative File Path: [root === process.cwd()].
 * @param {number} numLines - Num of lines to takes compared to the last index [-1].
 * @returns {Promise<string>}
 */
exports.getLastNthLine = async (filePath, numLines) => {

    const totalLines = await new Promise((resolve, reject) => {
        const cursor = readline.createInterface(getInputStream(filePath), getOutputStream());
        let counter = 0;

        cursor.on('line', function (line) {
            counter += 1;
        });

        cursor.on('error', reject);

        cursor.on('close', function () {
            resolve(counter);
        });
    });

    let currLine = 0;
    return new Promise((resolve, reject) => {
        const cursor = readline.createInterface(getInputStream(filePath), getOutputStream());
        const lastNthLines = [];

        cursor.on('line', function (line) {
            currLine += 1;
            if (currLine > totalLines - numLines) {
                lastNthLines.push(line);
            }
        });

        cursor.on('error', reject);

        cursor.on('close', function () {
            resolve(lastNthLines);
        });
    });
};
