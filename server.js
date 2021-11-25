const express = require('express');
const cors = require('cors');
const https = require('https');
const app = express();
const port = 3000;

var onlineMS = [];
var offlineMS = [];
var STATUS = 'ok';

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send(JSON.stringify({
      status: STATUS
  }));
});

app.post('/register', (req, res) => {
    const body = req.body;
    if (body) {
        var ms = createMs(body);
        addMsToOnline(ms);
        console.log('Added MS to onlineMS', ms.ip);
    }
    res.send(JSON.stringify({
        status: STATUS
    }));
});

app.get('/online', (req, res) => {
    res.send(JSON.stringify({
        status: STATUS,
        response: onlineMS
    }));
});

app.get('/offline', (req, res) => {
    res.send(JSON.stringify({
        status: STATUS,
        response: offlineMS
    }));
});

app.listen(port, () => {
  console.log(`Gateway app listening at http://localhost:${port}`);
  addHbCheck();
});

function createMs(msObj) {
    return {
        ip: msObj.ip,
        name: msObj.name,
    }
}

function addMsToOnline(msObj) {
    addElementToArray(msObj, onlineMS);
}

function addMsToOffline(msObj) {
    addElementToArray(msObj, offlineMS);
}

function addElementToArray(element, array) {
    var alreadyIn = array.filter(currMsObj => {
        return currMsObj.ip === element.ip
    }).length;

    if (!alreadyIn) {
        array.push(element);
    }
}

function removeMsFromOnline(msObj) {
    onlineMS = onlineMS.filter(currMsObj => {
        return currMsObj.ip !== msObj.ip;
    });
}

function addHbCheck() {
    var p;
    const options = {
        hostname: 'example.com',
        port: 4000,
        path: '/',
        method: 'GET'
    };

    setInterval(() => {
        onlineMS.forEach((currMsObj) => {
            options.hostname = currMsObj.ip;
            const req = https.request(options, res => {
                var data;
                res.on('data', d => {
                    data += d;
                });
                res.on('end', () => {
                    var d = JSON.parse(data).explanation;
                    console.log('MS Still alive:', d);
                });
            });
            req.on('error', error => {
                removeMsFromOnline(currMsObj);
                addMsToOffline(currMsObj);
                console.log('MS detached from onlineMS', currMsObj.ip);
            });
            req.end();           
        });
    }, 60*1000);
}