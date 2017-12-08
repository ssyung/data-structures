var express = require('express'),
    app = express();
var fs = require('fs');

// Postgres
const { Pool } = require('pg');
var db_credentials = new Object();
db_credentials.user = 'shies425';
db_credentials.host = process.env.AWSRDS_EP;
db_credentials.database = 'fridge_phototemp';
db_credentials.password = process.env.AWSRDS_PW;
db_credentials.port = 5432;

// Mongo
var collName = 'meetings';
var MongoClient = require('mongodb').MongoClient;
var url = 'mongodb://localhost:27017/AAmeetings';
// process.env.ATLAS;

// HTML wrappers for AA data
var index1 = fs.readFileSync("index1.txt");
var index3 = fs.readFileSync("index3.txt");

app.get('/', function(req, res) {
    // Connect to the AWS RDS Postgres database
    const client = new Pool(db_credentials);

    // SQL query
    var q = `SELECT EXTRACT(DAY FROM sensortime AT TIME ZONE 'America/New_York') as sensorday, 
             EXTRACT(MONTH FROM sensortime AT TIME ZONE 'America/New_York') as sensormonth, 
             count(*) as num_obs, 
             max(lightsensor) as max_light, 
             min(lightsensor) as min_light,
             max(tempsensor) as max_temp, 
             min(tempsensor) as min_temp
             FROM sensordata 
             GROUP BY sensormonth, sensorday;`;
             
    client.connect();
    client.query(q, (qerr, qres) => {
        res.send(qres.rows);
        console.log('responded to request');
    });
    client.end();
});

app.get('/aa', function(req, res) {

    MongoClient.connect(url, function(err, db) {
        if (err) {return console.dir(err);}
        var numToDay = [
            'Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'
            ];
        var dateTimeNow = new Date();
        var todayNum = dateTimeNow.getDay();
        var today = numToDay[todayNum];
        var tomorrow;
        if (todayNum == 6) {tomorrow = 0;}
        else {tomorrow = todayNum + 1}
        tomorrow = numToDay[tomorrow];
        // ----------------------------------
        var hour = dateTimeNow.getHours();
        var hourStart;
        var hourEnd;
        if (hour > 9) {
            hourStart = "0" + hour + ":00";
        } else {
            hourStart = hour + ":00";
        }
        if (hour >= 20) {
            hourEnd = (hour + 6) % 24;
        }

        var collection = db.collection(collName);
        var matchpart1;
        if (hour >= 20) {
            matchpart1 = { $match : 
                { $or : [
                    { $and: [
                        { "meetings.day" : today } , { "meetings.start" : { $gte: hourStart } }
                    ]},
                    { $and: [
                        { "meetings.day" : tomorrow } , { "meetings.end" : { $lte: hourEnd } }
                    ]}
                ]}
            }
        } else  {
            matchpart1 = { $match :  
                { $and: [
                    { "meetings.day" : today } , { "meetings.start" : { $gte: hourStart } }
                ]}
            }
        }
        collection.aggregate([ // start of aggregation pipeline
            { $unwind: "$meetings" },
            // match by day and time
            matchpart1,
            
            // group by meeting details
            { $group: {
                  _id: {
                    geolocation : "$geolocation",
                    meetingName : "$meetingName" ,
                    meetingAddress : "$original_address",
                    meetingDetails : "$details",
                    meetingWheelchair : "$accessible",
                  },
                  meetings: { $push : "$meetings" }
              }},
              
            // group by latlong  
            { $group: {
                  _id: { geolocation : "$_id.geolocation" },
                  meetingGroups: { $push : {
                    groupInfo : "$_id",
                    meetingDay : "$meeting.day",
                    meetingStartTime : "$meetings.start",
                    meetingType : "$meetings.type"
                  }}
              }}
            ]).toArray(function(err, docs) { // end of aggregation pipeline
            if (err) {console.log(err)}
            
            else {
                res.writeHead(200, {'content-type': 'text/html'});
                res.write(index1);
                res.write(JSON.stringify(docs));
                res.end(index3);
            }
            db.close();
        });
    });
    
});

// app.listen(process.env.PORT, function() {
app.listen(3001, function() {
    console.log('Server listening...');
});
