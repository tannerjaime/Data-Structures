var fs = require('fs');
var cheerio = require('cheerio');
var addressesFloors = []; //done
var addresses = []; //done
var locationName = []; //done
var meetingName = []; //done
var wheelChair = []; //done
var additionalInfo = []; //done 
var hours = []; //done, needs cleaning


//making request for the content
var fileContent = fs.readFileSync('/home/ubuntu/workspace/data/aameetinglist02M.txt');
var $ = cheerio.load(fileContent);

// COLUMN 1
$('table').each(function(i, elem) {
    //if the table has a cellpadding of 5
    if ($(elem).attr("cellpadding") == '5') {
        //for every row
        $(elem).find('tr').each(function(i, elem) {
            //COLUMN 1
            $(elem).find('td').eq(0).each(function(i, elem) {
                //ADDRESSES WITH FLOOR DETAILS
                //log all the html, but split at the the <br>, taking the 3rd item from the index
                addressesFloors.push($(elem).html().split('<br>')[2].trim());
                //ADDRESSES WITHOUT FLOOR DETAILS
                addresses.push($(elem).html().split('<br>')[2].trim().split(',', 1));
                //LOCATION NAMES 
                //some are not in h4 header
                locationName.push($(elem).find('h4').text());
                //MEETING NAMES
                meetingName.push($(elem).find('b').text());
                //WHEELCHAIR ACCESS
                wheelChair.push($(elem).find('img').attr('alt'));
                //ADDITIONAL NOTES
                additionalInfo.push($(elem).find('div').text().trim());
            });
            //COLUMN 2
            $(elem).find('td').eq(1).each(function(i, elem) {
                //HOURS
                hours.push($(elem).contents().text().trim());
            });
        });
    }
});

//after splitting twice above, merge nested array into one array
addresses = Array.prototype.concat.apply([], addresses);
//get rid of the (red door) directions
addresses[11] = addresses[11].split('(', 1);
//caused addresss[11] to be nestd again, so merge again
addresses = Array.prototype.concat.apply([], addresses);




console.log(hours);
// fs.writeFileSync("./addresses3.txt", JSON.stringify(addresses));
