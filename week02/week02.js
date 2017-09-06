// npm install cheerio

var fs = require('fs');
var cheerio = require('cheerio');

// load the m05 text file into a variable, `content`
var content = fs.readFileSync('data/m05.txt');

// load `content` into a cheerio object
var $ = cheerio.load(content);

// print addresses of meetings

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
    
    console.log(addr);
});