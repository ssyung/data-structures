var request = require('request'); // npm install request
var async = require('async'); // npm install async
var fs = require('fs');
var cheerio = require('cheerio'); // npm install cheerio

// load the m05 text file into a variable, `content`
var content = fs.readFileSync('data/m05.txt');

// load `content` into a cheerio object
var $ = cheerio.load(content);

// create empty array 
var addressesArray = [];

// set elem as td style, remove all children within td style
$('td[style="border-bottom:1px solid #e3e3e3; width:260px"]') .each(function(i, elem) {
    $(elem).children().remove();
    
    // create empty string to store wanted parts of address
    var addr = "";
    
    // store full address, without parentheses and spaces, in a string
    var fulladdr = $(elem).html().trim().replace(/\(.*?\)/, '').replace(/\s+/g, ' ');
    
    // save part of address before first comma
    var partaddr = fulladdr.split(',');
    addr = addr + partaddr[0];
    
    // save part of address after last space (zip code)
    var zip = fulladdr.split(" ");
    addr = addr + " " + zip[zip.length - 1];
    
    // console.log(addr);
    addressesArray.push(addr); //push addresses to array
    
});

// SETTING ENVIRONMENT VARIABLES (in Linux): 
// export NEW_VAR="Content of NEW_VAR variable"
// printenv | grep NEW_VAR
var apiKey = process.env.GMAKEY;

var meetingsData = []; // create new Array;

// eachSeries in the async module iterates over an array and operates on each item in the array in series
async.eachSeries(addressesArray, function(value, callback) {
    var apiRequest = 'https://maps.googleapis.com/maps/api/geocode/json?address=' + value.split(' ').join('+') + '&key=' + apiKey;
    var thisMeeting = new Object; // {}
    thisMeeting.address = value;
    request(apiRequest, function(err, resp, body) {
        if (err) {throw err;}
        // console.log(body)
        thisMeeting.latLong = JSON.parse(body).results[0].geometry.location;
        meetingsData.push(thisMeeting);
    });
    setTimeout(callback, 500);
}, function() {
    console.log(meetingsData);
    
    fs.writeFile("./data/m05_LatLong.txt", JSON.stringify(meetingsData), 'utf8', function (err) {
    if (err) {
        return console.log(err);
    }
    console.log("The file was saved!");
}); 

});