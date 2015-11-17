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
                    $gte: 2580,
                    $lt: 3120
                }
            }
        }
    ].toArray();
    db.close();

}); //MongoClient.connect