// npm install mongodb
var request = require('request'); // npm install request
var async = require('async'); // npm install async
var fs = require('fs');
var cheerio = require('cheerio'); // npm install cheerio

// IN MONGO exists a database `AAmeetings` with a collection `m05meetings`
var dbName = 'AAmeetings'; // name of Mongo database (created in the Mongo shell)
var collName = 'm05meetings'; // name of Mongo collection (created in the Mongo shell)

// load the m05_LatLong file into a variable
var content = fs.readFileSync('data/m05_LatLong.txt');
var meetingsData = JSON.parse(content);

// Insert the meetingsData array in the Mongo collection

    // Connection URL
    var url = 'mongodb://' + process.env.IP + ':27017/' + dbName;

    // Retrieve
    var MongoClient = require('mongodb').MongoClient; 

    MongoClient.connect(url, function(err, db) {
        if (err) {return console.dir(err);}

        var collection = db.collection(collName);

        // THIS IS WHERE THE DOCUMENT(S) IS/ARE INSERTED TO MONGO:
        collection.insert(meetingsData);
        db.close();

    }); //MongoClient.connect