#!/usr/bin/env node

const fs = require('fs');
const ping = require("ping");
const {AsyncParser} = require("@json2csv/node");
const { program } = require('commander');
const path = require("path");

const bindConfigTemplate = `options {
        directory "/var/cache/bind";
        forwarders {
        ADDRESSES
        };
        dnssec-validation auto;
        listen-on-v6 { any; };
};
`

let useDebugPrint = false;

const debugPrint = (...args) => {
    if (useDebugPrint)
        console.log(...args);
}

const fetchNameservers = async (listingCode, maxServers) => {
    const listingAddress = `https://public-dns.info/nameserver/${listingCode}.txt`;

    debugPrint('Fetching nameservers from', listingAddress);

    let addresses = await fetch(listingAddress).then(response => response.text())
        .catch(err => {
            console.log(err.cause.code);
            return '';
        }).then(rawAddresses => {
            if (!rawAddresses.length)
                throw new Error('Invalid response');
            return rawAddresses.split('\n');
        });

    debugPrint('Done!', addresses.length, 'nameservers found');

    if (addresses.length > maxServers) {
        const newMax = (maxServers - 1);

        debugPrint('Slicing from', addresses.length, 'to', newMax );
        return addresses.slice(0, newMax);
    }

    return addresses
}

const printFastest = (results) => {
    const fastest = results[0];
    debugPrint('The fastest server is', fastest.address, 'at', fastest.average, 'ms');
}

const writeJSON = async (results, basePath, fileName) => {
    const jsonPath = path.join(basePath, `${fileName}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(results));
    debugPrint('Written to', jsonPath);
}

const writeCSV = async (results, basePath, fileName) => {
    const opts = {};
    const transformOpts = {};
    const asyncOpts = {};
    const parser = new AsyncParser(opts, asyncOpts, transformOpts);

    const csvPath = path.join(basePath, `${fileName}.csv`);
    const csv = await parser.parse(results).promise();

    fs.writeFileSync(csvPath, csv);
    debugPrint('Written to', csvPath);
}

const writeBindConfig = async (results, basePath) => {
    const addresses = results.slice(0, 4).map(result => {
        return `    ${result.address};`
    }).join('\n     ');

    const configPath = path.join(basePath, `named.conf.options`);
    const fileContents = `${bindConfigTemplate}`.replace('ADDRESSES', addresses);
    fs.writeFileSync(configPath, fileContents);
    debugPrint('Written to', configPath);
}

const main = async (listingCode, maxServers, minReply, timeout) => {
    const ipV6Regex = /(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))/;
    const addresses = await fetchNameservers(listingCode, maxServers)


    const promises = addresses.map(address => {
        return new Promise(resolve => {
            debugPrint('Pinging', address);
            const isIpV6 = ipV6Regex.test(address);
            const pingCommand = isIpV6 ?  ping.promise.probe(address) : ping.promise.probe(address, {
                timeout,
                min_reply: minReply,
            });

            pingCommand.catch(_ => {
                return {
                    avg: 'unknown',
                }
            }).then(result => {
                debugPrint('Average for', address, 'is', result.avg, 'ms');
                resolve({
                    average: result.avg,
                    address,
                })
            })
        })
    })


   return await Promise.all(promises).then(results => {
       return results.filter(result => result.average !== 'unknown').sort((a, b) => a.average - b.average)
   });
}

(async () => {
    program.name('nameserver-sort')
        .option('-c, --countryCode <countryCode>', 'Country code to fetch DNS entries for', 'US')
        .option('-d, --debug', 'Output debug information')
        .option('-f, --filename <fileName>', 'Filename of outputs')
        .option('-t, --timeout <timeout>', 'Timeout in seconds', '1')
        .option('-r, --replies <replies>', 'Min. number of replies', '10')
        .option('-m, --max <num>', 'Max number of nameservers to test', '200')
        .option('-w, --write <filePath>', 'Write to file at', './')

    program.parse();

    useDebugPrint = program.opts().debug;

    if (useDebugPrint)
        console.clear();

    const basePath = program.opts().write || './';
    debugPrint('Using base path', basePath);

    const listingCode = (program.opts().countryCode || 'US').toLowerCase();
    debugPrint('Using listing code', listingCode);

    const maxServers = parseInt((program.opts().max || 200));
    debugPrint('Using max servers', maxServers);

    const timeout = parseInt((program.opts().timeout) || 1);
    debugPrint('Using timeout', timeout);

    const replies = parseInt((program.opts().replies) || 10);
    debugPrint('Using replies', replies)

    const fileName = (program.opts().filename || `results-${listingCode}`)
        .replace('.json', '')
        .replace('.csv', '');

    debugPrint('Using filename', fileName);

    try {
        debugPrint('Using debug printing');

        const results = await main(listingCode, maxServers, replies, timeout);

        if (!!results && results.length > 0) {
            await writeJSON(results, basePath, fileName)
            await writeCSV(results, basePath, fileName);
            await writeBindConfig(results, basePath);
        } else {
            console.error('No results');
        }

        printFastest(results);
    } catch (e) {
        console.error(e);
    }
})();







