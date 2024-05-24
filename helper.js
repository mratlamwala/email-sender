const dns = require('dns');

const checkMXRecords = (email) => new Promise((resolve, reject) => {
    const domain = email.split('@')[1];
    dns.resolveMx(domain, (err, addresses) => {
        if (err) reject(err);
        else resolve(addresses);
    });
})

module.exports = { checkMXRecords }