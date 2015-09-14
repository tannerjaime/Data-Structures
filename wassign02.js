var fs = require('fs');
var cheerio = require('cheerio');


//making request for the content
var fileContent = fs.readFileSync('/home/ubuntu/workspace/data/aameetinglist02M.txt');
var $ = cheerio.load(fileContent);

// for every table tag
$('table').each(function(i, elem) {
//if the table has a cellpadding of 5
    if ($(elem).attr("cellpadding") == '5') {
//for every row
        $(elem).find('tr').each(function(i, elem){
//for every td
            $(elem).find('td').eq(0).each(function(i, elem){
//log all the html, but split at the the <br>, taking the 3rd item from the index
                console.log($(elem).html().split('<br>')[2].trim());
                
            });
    });

}
});


