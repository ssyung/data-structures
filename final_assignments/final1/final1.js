var fs = require('fs');
var cheerio = require('cheerio'); // npm install cheerio
var request = require('request'); // npm install request
var moment = require('moment'); // npm install moment
var mongodb = require('mongodb');
var async = require('async'); // npm install async

// SETTING ENVIRONMENT VARIABLES (in Linux): 
// export NEW_VAR="Content of NEW_VAR variable"
// printenv | grep NEW_VAR
const apiKey = process.env.GMAKEY;

function getEntriesData(rawData) {
    // load `content` into a cheerio object
    var $ = cheerio.load(rawData);
    // create empty array to store records
    var entriesData = [];
    // set elem as tr style
    $('tr[style="margin-bottom:10px"]').each(function(i, elem) {
        
        // create empty object to store record
        var entry = {};
        
        // create var to store details
        entry.details = $(elem).find('div.detailsBox').text().trim();
        
        // create var to store first td style
        var td1 = $(elem).find('td[style="border-bottom:1px solid #e3e3e3; width:260px"]');
        
        // create var to store <h4> location name 
        entry.locationName = td1.find('h4').text().trim();
        
        // create var to store <b> meeting name
        entry.meetingName = td1.find('b').text().trim();
    
        // create var to store wheelchair access information
        entry.accessible = td1.find('span').text().trim();
    
        // create var to store wanted parts of address
        var addr = "";      
        // store full address in string, removing parentheses and spaces
        td1.children().remove();
        var origaddr = td1.text().trim();
        var fulladdr = td1.text().trim()
            .replace(/\(.*?\)/, '') // remove everything inside paren
            .replace(/\s+/g, ' ')   // replace all consecutive white space and replace with single space
            .replace(/(\d)-(\d)/, "$1###$2") // temporarily replace dash between two digits with ###
            .replace("W.", 'West')
            .replace('&', "and");
        // save part of address before first comma, period or dash
        var partaddr = fulladdr.split(/[\.,-]/); // split address on period, comma or dash
        partaddr[0] = partaddr[0].replace("###", "-"); // replace ### with -
        addr = addr + partaddr[0];
        // save part of address after last space (zip code)
        var zip = fulladdr.split(" ");
        addr = addr + " NY, NY " + zip[zip.length - 1];
        entry.address = addr;
        entry.original_address = origaddr;
        
        // create var to store second td style
        var td2 = $(elem).find('td[style="border-bottom:1px solid #e3e3e3;width:350px;"]');   
        
        // create empty array to store meeting objects
        var meetings = [];
        
        // create array of meeting times separated by <br> <br>
        var mtgRaw = td2.html().split(/<br>\s+<br>/);
        // create for loop to iterate through each line in meeting array, trim
        for (var i = 0; i < mtgRaw.length; i++) {
            var curr = mtgRaw[i].trim();
            if (curr === "") continue; // skip empty lines
            
            // store meetings in an array, separated by <br>
            var mtgLines = curr.split("<br>");
            var mtg = {};
            
            // store meetings days in an array, separated by <b>
            for (var j = 0; j < mtgLines.length; j++) {
                
                // in a date time line
                if (mtgLines[j].indexOf('<b>to</b>') >= 0) {
                    
                    // save day, trim "s"
                    mtg.day = mtgLines[j].substring(3, mtgLines[j].indexOf(" ")-1);
    
                    // delete everything before start time
                    var stringOfTimes = mtgLines[j].substring(mtgLines[j].indexOf("  ")).trim();
                    
                    // store start and end time as array, saving them as 24hr format using moment
                    var times = stringOfTimes.split(" <b>to</b> ");
                    mtg.start = moment(times[0], ["h:mm A"]).format("HH:mm");
                    mtg.end = moment(times[1], ["h:mm A"]).format("HH:mm");
    
                } else if (mtgLines[j].indexOf('Meeting Type') >= 0) {
                    var mtgType = mtgLines[j].replace("<b>Meeting Type</b> ", "");
                    mtg.type = mtgType;
                    
                } else if (mtgLines[j].indexOf('Special Interest') >= 0) {
                    var mtgSpecial = mtgLines[j].replace("<b>Special Interest</b> ", "");
                    mtg.Special = mtgSpecial;
                    
                }
            }
            meetings.push(mtg);
        }
        entry.meetings = meetings;
        entriesData.push(entry);
    });
    return entriesData;
}

// create array of data files paths
var dataFiles = [
    'data/m01.txt',
    'data/m02.txt',
    'data/m03.txt',
    'data/m04.txt',
    'data/m05.txt',
    'data/m06.txt',
    'data/m07.txt',
    'data/m08.txt',
    'data/m09.txt',
    'data/m10.txt',
];

// create empty array to add data from each file
var allEntriesData = [];

for (const filename of dataFiles) {
    // load the text file into a variable, `content`
    var content = fs.readFileSync(filename);
    
    // add data returned from getEntriesData() to allEntriesData
    allEntriesData = allEntriesData.concat(getEntriesData(content));
}


// ============================================================

// eachSeries in the async module iterates over an array and operates on each item in the array in series
async.eachSeries(allEntriesData, function(entry, callback) {
    var apiRequest = 'https://maps.googleapis.com/maps/api/geocode/json?address=' + entry.address.split(' ').join('+') + '&key=' + apiKey;
    request(apiRequest, function(err, resp, body) {
        if (err) {throw err;}
        var obj = JSON.parse(body);
        if (obj.results[0]) {
            entry.geolocation = obj.results[0].geometry.location;
        } else {
            console.log("ERR: " + JSON.stringify(obj));
        }
    });
    setTimeout(callback, 2000);
}, function(err, results) {
    if (err) {
        return console.log(err);
    }
    // console.log(entriesData);


    // IN MONGO exists a database `AAmeetings` with a collection `meetings`
    var dbName = 'stephanie'; // name of Mongo database (created in the Mongo shell)
    var collName = 'meetings'; // name of Mongo collection (created in the Mongo shell)
    
    // Insert the entriesData array in the Mongo collection
    // Connection URL
    // var url = 'mongodb://' + process.env.IP + ':27017/' + dbName;
    var url = 'mongodb://shies425:Dp79iCs4UKt1ufi9@cluster0-shard-00-00-rzdcl.mongodb.net:27017,cluster0-shard-00-01-rzdcl.mongodb.net:27017,cluster0-shard-00-02-rzdcl.mongodb.net:27017/stephanie?ssl=true&replicaSet=Cluster0-shard-0&authSource=admin';
    
    // Retrieve
    var MongoClient = mongodb.MongoClient; 
    
    MongoClient.connect(url, function(err, db) {
        if (err) {return console.dir(err);}
    
        var collection = db.collection(collName);
        collection.remove({}); // empty the collection
        collection.insert(allEntriesData); // populate the collection
        
        db.close();
          
    
    }); //MongoClient.connect

}); 
