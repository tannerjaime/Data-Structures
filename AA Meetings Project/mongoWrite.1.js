 /*
AA MEETINGS OF MANHATTAN
Jaime Tanner 

Install Following Node Modules: 
request
cheerio
async
mongodb
*/

var fs = require('fs');
var cheerio = require('cheerio');
var request = require('request'); 
var async = require('async'); 
var MongoClient = require('mongodb').MongoClient; 

var apikey = process.env.API_KEY;
var addressesFloors = []; 
var addresses = []; 
var locationName = []; 
var meetingName = []; 
var wheelChair = []; 
var additionalInfo = []; 
var hours = [];
var data = []; 
var meetingNameClean = [];
var meetingsData = [];
var hoursSplit = [];
var cleanAdd = [];


/*------------web scraping---------*/

//making request for content
var fileContent = fs.readFileSync('allManhattanWebInfo.txt');
var $ = cheerio.load(fileContent);

var obj;

$('table').each(function(i, elem) {
    //if the table has a cellpadding of 5
    if ($(elem).attr("cellpadding") == '5') {
        //for every row
        $(elem).find('tr').each(function(i, elem) {
            obj = {};
            //Address/Location 
            $(elem).find('td').eq(0).each(function(i, elem) {
                //ADDRESSES WITH FLOOR DETAILS
                //log all the html, but split at the the <br>, taking the 3rd item from the index
                obj.floors = $(elem).html().split('<br>')[2].trim();
                //ADDRESSES WITHOUT FLOOR DETAILS
                obj.address = fixAddress($(elem).html().split('<br>')[2].trim().split(',', 1)[0]);
                //LOCATION NAMES 
                //some are not in h4 header
                obj.locationName = $(elem).find('h4').text();
                //MEETING NAMES
                obj.meetingName = fixNames($(elem).find('b').text());
                //WHEELCHAIR ACCESS
                obj.wheelChair = $(elem).find('img').attr('alt');
                //ADDITIONAL NOTES
                obj.additionalInfo = $(elem).find('div').text().trim();
            });
            //Hours
            $(elem).find('td').eq(1).each(function(i, elem) {
                obj.hours = splitHours($(elem).contents().text().trim());                
            });
            addresses.push(obj);
        });
    }
});
/*------------cleaning---------*/
//function to split hours and push into object
function splitHours(tableCellString) {
    tableCellString = tableCellString.replace(/[ \t]+/g, " ");
    tableCellString = tableCellString.replace(/[\r\n|\n]/g, " ");
    tableCellString = tableCellString.split("           ");

    return tableCellString.map(function(oldHours){
        oldHours = oldHours.trim();
        var beginFrom = oldHours.indexOf(oldHours.match("From"));
        var meetingType = oldHours.substr(oldHours.indexOf(oldHours.match("Type")) + 5, 2);
        var startHour = oldHours.substr(beginFrom + 4, 3);
        var wholeTime = oldHours.substr(beginFrom + 4, 9);
        var pm = oldHours.substr(beginFrom + 10, 2);

        startHour = parseInt(startHour);
        var days = oldHours.substring(0, beginFrom - 1);
        if (pm == ' P' || pm == "PM") {
            startHour = startHour + 12;
            var amPM = "PM";
        }
        else {
            amPM = "AM";
        }

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
            "wholeTime": wholeTime,
            "amPM": amPM,
            "meetingType": meetingType,
            "specialInterests": specialInterest
        };
    })
}


//clean meeting names 
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

/*------------call API---------*/

function fixAddress(oldAddress) {
    if (oldAddress == "83 Christopher Street (Red Door"){
        oldAddress = "83 CHristopher Street";
    }
    return oldAddress + ', New York, NY,';
}

addresses.splice(0,1)

async.forEachOfSeries(addresses, function(object, i, callback) {
    var apiRequest = 'https://maps.googleapis.com/maps/api/geocode/json?address=' + object.address.replace(/ /g, "+") + '&key=' + apikey;

    console.log(apiRequest);

    request(apiRequest, function(err, resp, body) {
        if (err) {
            console.log(body);
            throw err;
        }

        object.latLong = JSON.parse(body).results[0].geometry.location; 
        meetingsData.push(obj);
        
    });
    setTimeout(callback, 500);
}, function() {
/*------------write to mongo database---------*/
    var url = 'mongodb://localhost:27017/AAtimes';

    //retrieve
    MongoClient.connect(url, function(err, db) {
        if (err) {
            return console.dir(err);
        }

        var collection = db.collection('manhattan');

        // THIS IS WHERE THE DOCUMENT(S) WHERE INSERTED TO MONGO:

        collection.insert(meetingsData);
        console.log("Inserted " + meetingsData.length + " into the document collection");
        db.close();
        collection.aggregate(

        )
    }); //MongoClient.connect

    fs.writeFileSync('./NEWaaManhattanMeetings.txt', JSON.stringify(data));
});

fs.writeFileSync("./NEWaddresses.txt", JSON.stringify(addresses));
