var fs = require('fs');
var database = "AAmeetings"
var collName = "manhattan";
process.env.TZ = 'America/New_York'

var url = 'mongodb://localhost:27017/' + database;

//get todays minutes
var add = 0;
var d = new Date();
var dayJS = d.getDay();
var hourJS = d.getHours();
var minutes = d.getMinutes();
var minuteNow = (dayJS + hourJS + minutes) - 20;
if (hourJS == 7){
    add = -7;
}

// Retrieve
var MongoClient = require('mongodb').MongoClient; // npm install mongodb

//retrieve
MongoClient.connect(url, function(err, db) {
    if (err) {
        return console.dir(err);
    }

    var collection = db.collection(collName)

    // query all meetings at or after 7 on tuesdays 
    collection.aggregate([
        { $unwind: "$hours" }, 
        
        { $match: {
        
        $or: [{
        
            $and: [{ "hours.day": dayJS * 1 + add },
            { "hours.startHour": { $gt: hourJS * 1  + add - 1, $lt: 25 } } 
            ]},
        
            { $and: [{ "hours.day": dayJS * 1 + 1 },
            { "hours.startHour": { $gt: -1, $lt: 4 } } 
            ]}
    ]}},
        
        { $group : {  _id : { 
            meetingName : "$meetingName",
            meetingHouse : "$locationName",
            address : "$address",
            meetingAddress2 : "$addressWhole",
            meetingDetails : "$additionalInfo",
            meetingWheelchair : "$accessibility",
            latLong : "$latlong"
            }, 
                meetingDay : { $push : "$hours.day" },
                startTime : { $push : "$hours.wholeTime" },
                // startTimeHour : { $push : "$hours.startHour" },
                // endTime : { $push : "$meetingList.endTime" },
                meetingType : { $push : "$hours.meetingType" },
                specialInterest : { $push : "$hours.specialInterests" }
        }},
        
        { $group : { _id : { latLong : "$_id.latLong" }, 
                    meetingGroups : { $addToSet : {  meetingGroup : "$_id", 
                                                meetings : {
                                                meetingDays : "$meetingDay",
                                                startTimes : "$startTime",
                                                // startTimeHours : "$startTimeHour",
                                                meetingTypes : "$meetingType",
                                                specialInterest : "$specialInterest"
                                                }
                    } }
                    } }
                    
    ]).toArray(function(err, docs) {
        if (err) {
            console.log(err);
        }
        else {
            var cleaned = docs;
            // console.log(JSON.stringify(docs));
            for (var i = 0; i < cleaned.length; i++) {
                // for (var j = 0; j < cleaned[i].length; j++) {
                // if (cleaned[j].meetings.meetingDays == 0) {
                //     cleaned[j].meetings.meetingDays = "Sundays";
                // }
                // else if (cleaned[j].meetings.meetingDays == 1) {
                //     cleaned[j].meetings.meetingDays = "Mondays";
                // }
                // else if (cleaned[j].meetings.meetingDays == 2) {
                //     cleaned[j].meetings.meetingDays = "Tuesdays";
                // }
                // else if (cleaned[j].meetings.meetingDays == 3) {
                //     cleaned[j].meetings.meetingDays = "Wednesdays";
                // }
                // else if (cleaned[j].meetings.meetingDays == 4) {
                //     cleaned[j].meetings.meetingDays = "Thursdays";
                // }
                // else if (cleaned[j].meetings.meetingDays == 4) {
                //     cleaned[j].meetings.meetingDays = "Fridays";
                // }
                // else {
                //     cleaned[j].meetings.meetingDays = "Saturdays";
                // }
                // }
                console.log(JSON.stringify(cleaned[i], null, 4));
                console.log('');
            }
            // for (var i=0; i < docs.length; i++) {
            //     console.log(JSON.stringify(docs[i], null, 4));
            //     console.log('');
            // }
        }
        db.close();

    });

});