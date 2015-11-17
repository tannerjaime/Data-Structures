var request = require('request');
var fs = require('fs');
//making request for the website
request('http://www.nyintergroup.org/meetinglist/meetinglist.cfm?zone=02&borough=M', function (error, response, body) { //we can expect to possiblt get an error, response, and body, derived from documentation for request
  if (!error && response.statusCode == 200) {
    fs.writeFileSync('/home/ubuntu/workspace/data/aameetinglist02M.txt', body); // gunna write it into a text file 
  }
  else {console.error('request failed')}
});

//also had to mkdir data to have a place to send the text file too. 