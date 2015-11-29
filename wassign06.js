var fs = require('fs');
var database = "AAmanhattan"
var collName = "section2";

var url = 'mongodb://localhost:27017/' + database;

// Retrieve
var MongoClient = require('mongodb').MongoClient; // npm install mongodb

//retrieve
MongoClient.connect(url, function(err, db) {
    if (err) {
        return console.dir(err);
    }

    var collection = db.collection(collName)

    // query all meetings at or after 7 on tuesdays 
    collection.aggregate([{
            $unwind: "$hours"
        },

        {
            $project: {
                _id: 0,
                locationName: 1,
                meetingName: 1,
                address: 1,
                addressWhole: 1,
                latlong: 1,
                additionalInfo: 1,
                hours: 1,
                accessibility: 1,
                "cumulative": {
                    $add: [{
                        "$multiply": [1440, "$hours.day"]
                    }, {
                        "$multiply": [60, "$hours.startHour"]
                    }, "$hours.startMinute"]
                }
            }
        }, {
            $match: {
                "cumulative": {
                    $gte: 4015,
                    $lt: 4560
                }
            }
        }

    ]).toArray(function(err, docs) {
        if (err) {
            console.log(err);
        }
        else {
            var cleaned = docs;
            // console.log(JSON.stringify(docs));
            for (var i = 0; i < cleaned.length; i++) {
                if (cleaned[i].hours.day == 0) {
                    cleaned[i].hours.day = "Sundays";
                }
                else if (cleaned[i].hours.day == 1) {
                    cleaned[i].hours.day = "Mondays";
                }
                else if (cleaned[i].hours.day == 2) {
                    cleaned[i].hours.day = "Tuesdays";
                }
                else if (cleaned[i].hours.day == 3) {
                    cleaned[i].hours.day = "Wednesdays";
                }
                else if (cleaned[i].hours.day == 4) {
                    cleaned[i].hours.day = "Thursdays";
                }
                else if (cleaned[i].hours.day == 4) {
                    cleaned[i].hours.day = "Fridays";
                } else {
                    cleaned[i].hours.day = "Saturdays";                   
                }
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