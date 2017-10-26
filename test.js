const syslogProducer = require('glossy').Produce; // or wherever glossy lives

let msg = syslogProducer.produce({
    facility: 'local4', // these can either be a valid integer,
    severity: 'error',  // or a relevant string
    host: 'localhost',
    appName: 'sudo',
    pid: '123',
    date: new Date(Date()),
    message: 'Nice, Neat, New, Oh Wow'
});