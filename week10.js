var express = require('express'), // npm install express --save
    app = express();
const { Pool } = require('pg'); // npm install pg

// AWS RDS POSTGRESQL INSTANCE
var db_credentials = new Object();
db_credentials.user = 'shies425';
db_credentials.host = process.env.AWSRDS_EP;
db_credentials.database = 'fridge_phototemp';
db_credentials.password = process.env.AWSRDS_PW;
db_credentials.port = 5432;

app.get('/', function(req, res) {
    // Connect to the AWS RDS Postgres database
    const client = new Pool(db_credentials);

    // SQL query
    var q = `SELECT fridgetime AT TIME ZONE 'EST' AS fridgetime
            photo, temperature
            FROM fridge_readings
            WHERE photo > 100
            ORDER BY fridgetime;`;
             
    client.connect();
    client.query(q, (qerr, qres) => {
        if (qerr) console.log (qerr);
        else {
            res.send(qres.rows);
            console.log('responded to request');
        }
    });
    client.end();
});

app.listen(3000, function() {
    console.log('Server listening...');
});