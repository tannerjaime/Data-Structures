var fs = require('fs');
var cheerio = require('cheerio');
var request = require('request'); // npm install request
var async = require('async'); // npm install async
var MongoClient = require('mongodb').MongoClient; // npm install mongodb

var apikey = process.env.API_KEY;
var addressesFloors = []; //done
var addresses = []; //done
var locationName = []; //done
var meetingName = []; //done
var wheelChair = []; //done
var additionalInfo = []; //done 
var hours = []; //done, needs cleaning
var meetingNameClean = [];
var meetingsData = [];



// ~~~~~~~~~ SCRAPING

//making request for the content
var fileContent = fs.readFileSync('/home/ubuntu/workspace/data/aameetinglist02M.txt');
var $ = cheerio.load(fileContent);

// COLUMN 1
$('table').each(function(i, elem) {
    //if the table has a cellpadding of 5
    if ($(elem).attr("cellpadding") == '5') {
        //for every row
        $(elem).find('tr').each(function(i, elem) {
            //COLUMN 1
            $(elem).find('td').eq(0).each(function(i, elem) {
                //ADDRESSES WITH FLOOR DETAILS
                //log all the html, but split at the the <br>, taking the 3rd item from the index
                addressesFloors.push($(elem).html().split('<br>')[2].trim());
                //ADDRESSES WITHOUT FLOOR DETAILS
                addresses.push($(elem).html().split('<br>')[2].trim().split(',', 1));
                //LOCATION NAMES 
                //some are not in h4 header
                locationName.push($(elem).find('h4').text());
                //MEETING NAMES
                meetingName.push($(elem).find('b').text());
                //WHEELCHAIR ACCESS
                wheelChair.push($(elem).find('img').attr('alt'));
                //ADDITIONAL NOTES
                additionalInfo.push($(elem).find('div').text().trim());
            });
            //COLUMN 2
            $(elem).find('td').eq(1).each(function(i, elem) {
                //HOURS
                hours.push($(elem).contents().text().trim());
            });
        });
    }
});
//after splitting twice above, merge nested array into one array
addresses = Array.prototype.concat.apply([], addresses);
//get rid of the (red door) directions
addresses[11] = addresses[11].split('(', 1);
//caused addresss[11] to be nestd again, so merge again
addresses = Array.prototype.concat.apply([], addresses);


// ~~~~~~~~~ SCRAPING END
// ~~~~~~~~~ CLEANING FUNCTION

// function to clean meeting names 
function fixNames(oldName) {
    // if (oldName.indexOf(' - ') == -1) {
    //     console.log("no dash found.");
    // }
    // else {
    var indexed = oldName.indexOf('-');
    oldName = oldName.replace(/\(:I+\)/g, "").trim();
    oldName = oldName.replace(/\(:II+\)/g, "").trim();
    oldName = oldName.replace(/\(I+\)/g, "").trim();
    oldName = oldName.replace(/\(II+\)/g, "").trim();
    var firstPart = oldName.substr(0, (indexed - 1)).toUpperCase().trim();
    var second = oldName.substr(indexed + 1, firstPart.length).toUpperCase();
    console.log("firstPart : " + firstPart + "|||   second" + second);
    // oldName = oldName.replace(/\(:II+\)/g, "");
    // if (oldName.indexOf("(:") != -1){
    //     oldName = oldName.slice(0, oldName.indexOf("("));
    // }

    if (firstPart == second) {
        var finished = firstPart;
    }
    else if (second == "") {
        finished = firstPart;
    }
    else {
        finished = oldName;
    }

    return finished;
    // }
}
console.log(meetingName);
for (var i in meetingName) {
    meetingNameClean.push(fixNames(meetingName[i]));
}
console.log(meetingNameClean);

// ~~~~~~~~~ CLEANING FUNCTION END 

// console.log(meetingName);
// fs.writeFileSync("./addresses3.txt", JSON.stringify(addresses));





//~~~~~~~~~~ APIS

function fixAddress (oldAddress) {
    var newAddress = oldAddress + ', New York, NY,';
    return newAddress;
}

// for (var j in addresses){
// addresses.push(fixAddress(addresses[j]));
// }
// console.log(addresses);


// forEachOf calls the function on all array elements IMMEDIATELY IN PARALLEL so google shuts you out
// forEachOfSeries calls them nicely in order so the setTimeout() does what it's supposed to do
async.forEachOfSeries(addresses, function(value, i, callback) {
    var apiRequest = 'https://maps.googleapis.com/maps/api/geocode/json?address=' + fixAddress(value).split(' ').join('+') + '&key=' + apikey;
    var thisMeeting = new Object;
    thisMeeting.address = value;

    // var apiRequest = 'https://maps.googleapis.com/maps/api/geocode/json?address=' + cleanAddress + '&key=' + apikey;
    // console.log(cleanAddress[2]);
    console.log(apiRequest);

    request(apiRequest, function(err, resp, body) {
        if (err) {
            console.log(body);
            throw err;

        }

        thisMeeting.latLong = JSON.parse(body).results[0].geometry.location; //.parse indicates that its an object 
        meetingsData.push(thisMeeting);

        //~~~~~~~~~~ WRITE TO MONGO
        var url = 'mongodb://localhost:27017/AAtest';

        //retrieve
        MongoClient.connect(url, function(err, db) {
            if (err) {
                return console.dir(err);
            }

            var collection = db.collection('meetingsArea2');

            // THIS IS WHERE THE DOCUMENT(S) IS/ARE INSERTED TO MONGO:
            //nsert batches. inset all doc in array as seperate docs 

            collection.insert({address : meetingsData[i], addressWhole : addressesFloors[i], locationName : locationName[i], meetingName: meetingName[i], additionalInfo : additionalInfo[i], hours: hours[i], accessibility: wheelChair[i]});

            db.close();

        }); //MongoClient.connect

        //~~~~~~~~~~ WRITE TO MONGO END 
    });
    setTimeout(callback, 500);
}, function() {
    //console.log(meetingsData);
    fs.writeFileSync('./aaMeetingsArrayArea2.txt', JSON.stringify(meetingsData));
});

//~~~~~~~~~~ APIS END
