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
var hours = [];
var data = []; //done, needs cleaning
var meetingNameClean = [];
var meetingsData = [];
var hoursSplit = [];

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
            //COLUMN 2
            $(elem).find('td').eq(1).each(function(i, elem) {
                //HOURS
                hours.push($(elem).contents().text().trim());

            });
        });
    }
});

// ~~~~~~~~~ SCRAPING END
// ~~~~~~~~~ CLEANING FUNCTION


//clean up hours text
for (var j in hours) {
    hours[j] = hours[j].replace(/[ \t]+/g, " ");
    hours[j] = hours[j].replace(/[\r\n|\n]/g, " ");
    hours[j] = hours[j].split("           ");
    for (var q in hours[j]) {
        hours[j][q] = hours[j][q].trim();
    }
}

//function to split hours and push into object
function splitHours(oldHours) {
    var beginFrom = oldHours.indexOf(oldHours.match("From"));
    var meetingType = oldHours.substr(oldHours.indexOf(oldHours.match("Type")) + 5, 2);
    var startHour = oldHours.substr(beginFrom + 4, 2);
    var startMinute = oldHours.substr(beginFrom + 7, 2);
    var pm = oldHours.substr(beginFrom + 10, 2);
    


    startHour = parseInt(startHour);
    startMinute = parseInt(startMinute);
    var days = oldHours.substring(0, beginFrom - 1);
    if (pm == ' P' || pm == "PM"){
        startHour = startHour + 12;
        var amPM = "PM";
    } else {
        amPM = "AM";
    }
    console.log(amPM);
    if (oldHours.indexOf('Interest') != -1) {
        var specialInterest = oldHours.substr(oldHours.indexOf(oldHours.match("Interest")) + 8);
    }
    else {
        specialInterest = null;
    }
    if (days == "Mondays") {
        days = 1;
    }
    else if (days == "Tuesdays") {
        days = 2;
    }
    else if (days == "Wednesdays") {
        days = 3;
    }
    else if (days == "Thursdays") {
        days = 4;
    }
    else if (days == "Fridays") {
        days = 5;
    }
    else if (days == "Saturdays" || days == "s") {
        days = 6;
    }
    else if (days == "Sundays") {
        days = 0;
    }

  
    return {
        "day": days,
        "startHour": startHour,
        "startMinute": startMinute,
        "amPM": amPM,
        "meetingType": meetingType,
        "specialInterests": specialInterest
    };
}

//call splitHours
for (var i in hours) {
    for (var a in hours[i]) {
        hours[i][a] = splitHours(hours[i][a]);
    }
    hoursSplit.push(hours[i]);
    
}


//after splitting twice above, merge nested array into one array
addresses = Array.prototype.concat.apply([], addresses);
//get rid of the (red door) directions
addresses[11] = addresses[11].split('(', 1);
//caused addresss[11] to be nestd again, so merge again
addresses = Array.prototype.concat.apply([], addresses);



// function to clean meeting names 
function fixNames(oldName) {
    oldName = oldName.replace(/\(:?I+\)/g, "").toUpperCase().trim();
    var indexed = oldName.indexOf(' -');
    var firstPart = oldName.substr(0, (indexed)).toUpperCase().trim();
    var second = oldName.substr(indexed + 3, firstPart.length).toUpperCase();

    var lastHalfCheck1 = firstPart.substr((firstPart.length) - 10, 10).toUpperCase();
    var firstHalfCheck1 = firstPart.substr(0, 10).toUpperCase();
    var lastHalfCheck2 = second.substr((firstPart.length) - 12, 10).toUpperCase();
    var firstHalfCheck2 = second.substr(0, 10).toUpperCase();
    var lastHalfCheck3 = second.substr((firstPart.length) - 10, 10).toUpperCase();

    if (firstPart == second) {
        var finished = firstPart;
    }
    else if (second == "") {
        finished = firstPart;
    }
    else if (firstPart.indexOf(second) != -1) {
        finished = firstPart;
    }
    else if (firstHalfCheck1 == firstHalfCheck2) {
        finished = firstPart;
    }
    else if (lastHalfCheck1 == lastHalfCheck2) {
        finished = firstPart;
    }
    else if (lastHalfCheck1 == lastHalfCheck3) {
        finished = firstPart;
    }
    else {
        finished = oldName;
    }
    return finished;
}

for (var i in meetingName) {
    meetingNameClean.push(fixNames(meetingName[i]));
}


// ~~~~~~~~~ CLEANING FUNCTION END 

// fs.writeFileSync("./addresses3.txt", JSON.stringify(addresses));

// ~~~~~~~~~~ APIS

function fixAddress(oldAddress) {
    var newAddress = oldAddress + ', New York, NY,';
    return newAddress;
}



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
        meetingsData.push(thisMeeting.latLong);

        //~~~~~~~~~~ WRITE TO MONGO
        var url = 'mongodb://localhost:27017/AAmanhattan';

        //retrieve
        MongoClient.connect(url, function(err, db) {
            if (err) {
                return console.dir(err);
            }

            var collection = db.collection('section2');

            // THIS IS WHERE THE DOCUMENT(S) WHERE INSERTED TO MONGO:
            //commented out for search queries 

            collection.insert({
                locationName: locationName[i],
                meetingName: meetingNameClean[i],
                address: thisMeeting.address,
                addressWhole: addressesFloors[i],
                latlong : thisMeeting.latLong,
                additionalInfo: additionalInfo[i],
                hours: hoursSplit[i],
                accessibility: wheelChair[i]
            });
            
            data = ({
                locationName: locationName[i],
                meetingName: meetingNameClean[i],
                address: thisMeeting.address,
                addressWhole: addressesFloors[i],
                latlong : thisMeeting.latLong,
                additionalInfo: additionalInfo[i],
                hours: hoursSplit[i],
                accessibility: wheelChair[i]
            });

            db.close();
            collection.aggregate(

            )
        }); //MongoClient.connect
        
        //~~~~~~~~~~ WRITE TO MONGO END 
    });
    setTimeout(callback, 500);
}, function() {
    //console.log(meetingsData);
    fs.writeFileSync('./aaMeetingsArrayArea2.txt', JSON.stringify(data));
});

// ~~~~~~~~~~ APIS END
// ~~~~~~~~~CLEANING FUNCTION END

fs.writeFileSync("./addresses3.txt", JSON.stringify(addresses));
