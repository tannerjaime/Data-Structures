var request = require('request'); // npm install request
var async = require('async'); // npm install async
var fs = require('fs');

// SETTING ENVIRONMENT VARIABLES (in Linux): 
// export NEW_VAR="Content of NEW_VAR variable"
// printenv | grep NEW_VAR

var apikey = process.env.API_KEY;
// var URLtoParse = 

var meetingsData = [];
var addresses = [];

//use JSON.parse() to read data into object
var addresses = JSON.parse(fs.readFileSync('/home/ubuntu/workspace/addresses2.txt'));
console.log(addresses);


// eachSeries in the async module iterates over an array and operates on each item in the array in series
// // calls for array and the function ot ogo over 
function fixAddress (oldAddress) {
    var newAddress = oldAddress.substring(0, oldAddress.indexOf(',')) + ' New York, NY,';
    return newAddress;
}


async.eachSeries(addresses, function(value, callback) {
    var apiRequest = 'https://maps.googleapis.com/maps/api/geocode/json?address=' + value.split(' ').join('+') + '&key=' + apikey;
    var thisMeeting = new Object;
    thisMeeting.address = value;

    // var apiRequest = 'https://maps.googleapis.com/maps/api/geocode/json?address=' + cleanAddress + '&key=' + apikey;
    // console.log(cleanAddress[2]);
    console.log(apiRequest);
    request(apiRequest, function(err, resp, body) {
        if (err) {
            throw err;
        }

        // thisMeeting.latLong = JSON.parse(body).results[0].geometry.location; //.parse indicates that its an object 
        meetingsData.push(thisMeeting);

    });
    setTimeout(callback, 500);
}, function() {
    //console.log(meetingsData);
    fs.writeFileSync('./aaMeetingsArray2.txt', JSON.stringify(meetingsData));
});
