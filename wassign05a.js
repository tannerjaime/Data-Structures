var fs = require('fs');
var cheerio = require('cheerio');
var request = require('request'); // npm install request
var async = require('async'); // npm install async

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

//function to clean meeting names 
// function fixNames(oldName) {
//     // if (oldName.indexOf(' - ') == -1) {
//     //     console.log("no dash found.");
//     // }
//     // else {
//     var indexed = oldName.indexOf('-');
//     var firstPart = oldName.substr(0, (indexed - 1)).toUpperCase();
//     var second = oldName.substr(indexed + 1, firstPart.length).toUpperCase();
//     console.log("firstPark : " + firstPart + "   second" + second);
//     if (oldName.indexOf("(:") = -1){
//         oldName.splice("(");
//     }
//     else if (firstPart == second) {
//         finished = firstPart;
//     }
//     else if (second == " ") {
//         var finished = firstPart;
//     }
//     else {
//         finished = oldName;
//     }

//     return finished;
//     // }
// }
// console.log(meetingName);
// for (var i in meetingName){
// meetingNameClean.push(fixNames(meetingName[i]));
// }


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


async.eachSeries(addresses, function(value, callback) {
    var apiRequest = 'https://maps.googleapis.com/maps/api/geocode/json?address=' + fixAddress(value).split(' ').join('+') + '&key=' + apikey;
    var thisMeeting = new Object;
    thisMeeting.address = value;

    // var apiRequest = 'https://maps.googleapis.com/maps/api/geocode/json?address=' + cleanAddress + '&key=' + apikey;
    // console.log(cleanAddress[2]);
    console.log(apiRequest);
    request(apiRequest, function(err, resp, body) {
        if (err) {
            throw err;
        }

        thisMeeting.latLong = JSON.parse(body).results[0].geometry.location; //.parse indicates that its an object 
        meetingsData.push(thisMeeting);

    });
    setTimeout(callback, 500);
}, function() {
    //console.log(meetingsData);
    fs.writeFileSync('./aaMeetingsArrayArea2.txt', JSON.stringify(meetingsData));
});