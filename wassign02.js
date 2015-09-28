var fs = require('fs');
var cheerio = require('cheerio');
var addresses = [];

//making request for the content
var fileContent = fs.readFileSync('/home/ubuntu/workspace/data/aameetinglist02M.txt');
var $ = cheerio.load(fileContent);

// for every table tag
$('table').each(function(i, elem) {
    //if the table has a cellpadding of 5
    if ($(elem).attr("cellpadding") == '5') {
        //for every row
        $(elem).find('tr').each(function(i, elem) {
            //for every td
            $(elem).find('td').eq(0).each(function(i, elem) {
                //log all the html, but split at the the <br>, taking the 3rd item from the index
                addresses.push($(elem).html().split('<br>')[2].trim());
            });
        });
    }
});


for (var i=0; i<addresses.length; i++){
    addresses[i] = addresses[i] + ' New York, NY,';
}
console.log(addresses);




// AIzaSyC_TtJWGQ31r5SRl2NeeLkpMg91keTnxFQ
// https://maps.googleapis.com/maps/api/geocode/json?address=1600+Amphitheatre+Parkway,+Mountain+View,+CA&key=AIzaSyC_TtJWGQ31r5SRl2NeeLkpMg91keTnxFQ


fs.writeFile("./addresses.txt", addresses, function(err) {
if(err) {
        console.log(err);
  } 
  else {
    console.log("Output saved to /addressest.txt.");
    }
}); 


