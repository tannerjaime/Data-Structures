var fs = require('fs');
var database = "AAtimes"
var collName = "manhattan";
process.env.TZ = 'America/New_York'


var data1 = fs.readFileSync(__dirname + '/index1.html');
var data3 = fs.readFileSync(__dirname + '/index3.html');

var app = require('http').createServer(handler);

function handler(req, res) {

    var url = 'mongodb://localhost:27017/' + database;

    //get todays minutes
    var add = 0;
    var d = new Date();
    var dayJS = d.getDay();
    var hourJS = d.getHours();
    var minutes = d.getMinutes();
    var minuteNow = dayJS + hourJS + minutes - 20;
    if (hourJS == 7) {
        add = -8;
    }
    var tomorrow = dayJS + add + 1;

    // Retrieve
    var MongoClient = require('mongodb').MongoClient; // npm install mongodb

    //retrieve
    MongoClient.connect(url, function(err, db) {
        if (err) {
            return console.dir(err);
        }

        var collection = db.collection(collName);

        // query all meetings at or after 7 on tuesdays 
        collection.aggregate([{
                $unwind: "$hours"
            },

            {
                $match: {

                    $or: [{

                            $and: [{
                                "hours.day": dayJS
                            }, {
                                "hours.startHour": {
                                    $gte: hourJS,
                                    $lte: 24
                                }
                            }]
                        },

                        {
                            $and: [{
                                "hours.day": tomorrow
                            }, {
                                "hours.startHour": {
                                    $gte: 0,
                                    $lt: 4
                                }
                            }]
                        }
                    ]
                }
            },

            {
                $group: {
                    _id: {
                        meetingName: "$meetingName",
                        meetingHouse: "$locationName",
                        address: "$address",
                        meetingAddress2: "$addressWhole",
                        meetingDetails: "$additionalInfo",
                        meetingWheelchair: "$accessibility",
                        latLong: "$latLong"
                    },
                    meetingDay: {
                        $push: "$hours.day"
                    },
                    startTime: {
                        $push: "$hours.wholeTime"
                    },
                    // startTimeHour : { $push : "$hours.startHour" },
                    // endTime : { $push : "$meetingList.endTime" },
                    meetingType: {
                        $push: "$hours.meetingType"
                    },
                    specialInterest: {
                        $push: "$hours.specialInterests"
                    }
                }
            },

            {
                $group: {
                    _id: {
                        latLong: "$_id.latLong"
                    },
                    meetingGroups: {
                        $addToSet: {
                            meetingGroup: "$_id",
                            meetings: {
                                meetingDays: "$meetingDay",
                                startTimes: "$startTime",
                                // startTimeHours : "$startTimeHour",
                                meetingTypes: "$meetingType",
                                specialInterest: "$specialInterest"
                            }
                        }
                    }
                }
            }

        ]).toArray(function(err, docs) {
            if (err) {
                console.log("Not Working!");
                console.log(err);
            }
            else {
                var cleaned = docs;
                // console.log(JSON.stringify(docs));
                for (var i = 0; i < cleaned.length; i++) {
                    console.log(JSON.stringify(cleaned[i], null, 4));
                    console.log('');
                }
                console.log(JSON.stringify(cleaned));
                res.write(data1);
                res.write("var meetings = " + JSON.stringify(cleaned) + ";");
                res.write(data3);
                res.end();
            }
            db.close();

        });

    });
};

app.listen(process.env.PORT);