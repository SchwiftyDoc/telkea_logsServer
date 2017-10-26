const jsonServerReq = require('json-server');
const syslogParser = require('glossy').Parse;
const syslogSender = require('glossy').Produce;
const syslogServer = require('syslog-server');
const request = require('request');
const config = require('./config.json');
const syslogs = require('./syslogs.json');
const fs = require('fs');


/* ------------------- */
/*     JSon Server     */
/* ------------------- */

const jsonConf = config.jsonServer;
const jsonServer = jsonServerReq.create();
const jsonRouter = jsonServerReq.router('./syslogs.json');
const jsonMiddlewares = jsonServerReq.defaults();
jsonServer.use(jsonMiddlewares);
jsonServer.use(jsonRouter);
jsonServer.listen(jsonConf.port, () => {
    console.log('JSON Server is running and listening on port ' + jsonConf.port);
});


/* ------------------- */
/*    Syslog Server    */
/* ------------------- */

const mainServer = new syslogServer();
const sysConf = config.syslogServer;

mainServer.on('message', (value) => {

    // Parse raw Syslog into Javascript Object
    let msg;
    syslogParser.parse(value.message.toString('utf8', 0), function(parsedMessage){
        msg = parsedMessage;
    });

    // TODO: Create commun library of Syslog model for the different servers.
    let log = {
        date: value.date,
        ip: msg.host,
        host: value.host,
        prival: number,
        severity: msg.severityID,
        facility: msg.facilityID,
        protocol: value.protocol,
        message: msg.message
    };

    console.log('Syslog received : ' + log);

    // Add the new Syslog into the Elasticsearch System
    let elasticOptions = {
        url: config.eslaticsearch + ':' + config.elasticsearch.port + '/'
                + config.elasticsearch.index + '/'
                + 'syslogs',
        method: 'Post',
        headers: { 'Content-type': 'application/json' },
        json: JSON.stringify(log)
    }

    // Add the new Syslog into the Json Server
    let options = {
        url: config.jsonServer.url + ':' + config.port + '/' + config.file,
        method: 'POST',
        headers: { 'Content-type': 'application/json' },
        json: JSON.stringify(log)
    };

    request(options, (err, res, body) => {
        if (res && (res.statusCode == 200 || res.statusCode == 201))
            console.log('Syslog received and saved in Json Server : ' + options.url);
    });

    if(config.elasticsearch.types.includes("syslogs")) {
        console.log('Test');
        request(elasticOptions, (err, res, body) => {
            if (res && (res.statusCode== 200 || res.statusCode == 201))
                console.log('Syslog received and saved in Elasticsearch : ' + elasticOptions.url);
        });
    }

    // Save raw message in another file
    fs.append('syslogs.mock', value);

});

mainServer.start(sysConf, (err) => {
    if (err)
        console.error(err);
    else
        console.log('Syslog Server is running and listening on port ' + sysConf.port);
});