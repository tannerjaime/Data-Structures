var request = require('request'); // npm install request
var async = require('async'); // npm install async
var fs = require('fs');

// SETTING ENVIRONMENT VARIABLES (in Linux): 
// export NEW_VAR="Content of NEW_VAR variable"
// printenv | grep NEW_VAR
var apikey = process.env.API_KEY
// var URLtoParse = 

var meetingsData = [];
var addresses = [fs.readFileSync('/home/ubuntu/workspace/addresses.txt').toString()];
// console.log(addresses);

// eachSeries in the async module iterates over an array and operates on each item in the array in series
// // calls for array and the function ot ogo over 
async.eachSeries(addresses, function(value, callback) {
    var apiRequest = 'https://maps.googleapis.com/maps/api/geocode/json?address=' + value.split(' ').join('+') + '&key=' + apikey;
    var thisMeeting = new Object;
    thisMeeting.address = value;
    request(apiRequest, function(err, resp, body) {
        if (err) {throw err;}
        thisMeeting.latLong = JSON.parse(body).results[0].geometry.location; //.parse indicates that its an object 
        meetingsData.push(thisMeeting);
    });
    setTimeout(callback, 4000);
}, function() {
    console.log(meetingsData);
});

//how to break the code down so that its not to many requests

//save array 2 as text file. start new program that reads in that text file and goes down that path. 

