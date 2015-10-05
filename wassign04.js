var fs = require('fs');
var addressData = JSON.parse(fs.readFileSync('/home/ubuntu/workspace/aaMeetingsArray3.txt'));
// console.log(addressData);

// Connection URL
var url = 'mongodb://localhost:27017/AA';

// Retrieve
var MongoClient = require('mongodb').MongoClient; // npm install mongodb

//retrieve
MongoClient.connect(url, function(err, db) {
    if (err) {
        return console.dir(err);
    }

    var collection = db.collection('meetingsArea2');

    // THIS IS WHERE THE DOCUMENT(S) IS/ARE INSERTED TO MONGO:
    //nsert batches. inset all doc in array as seperate docs 

    collection.insert(addressData);

    db.close();

}); //MongoClient.connect


// IN MONGO: 

