var request = require('request');
var fs = require('fs');
//making request website
request('http://www.nyintergroup.org/meetinglist/meetinglist.cfm?searchstr=&borough=M&zone=Zone&zipcode=Zip+Code&day=&StartTime=&EndTime=&meetingtype=&SpecialInterest=&Go=Go', function (error, response, body) { 
  if (!error && response.statusCode == 200) {
    fs.writeFileSync('/home/ubuntu/workspace/data/allManhattanWebInfo.txt', body); // gunna write it into a text file 
  }
  else {console.error('request failed')}
});

//also had to mkdir data to have a place to send the text file too. 