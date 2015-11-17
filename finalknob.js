var pg = require('pg');

// add connection string here
var conString = "postgres://jaime:parsonsdv@data-structures.cdp3q92nnmui.us-west-2.rds.amazonaws.com:5432/postgres";

var five = require("johnny-five"), board, potentiometer;

board = new five.Board();

board.on("ready", function() {

  // Create a new `potentiometer` hardware instance.
  potentiometer = new five.Sensor({
    pin: "A3",
    freq: 2000
  });

  // Inject the `sensor` hardware into
  // the Repl instance's context;
  // allows direct command line access
  board.repl.inject({
    pot: potentiometer
  });

  // "data" get the current reading from the potentiometer
  potentiometer.on("data", function() {
    console.log(this.value, this.raw);
    var number = this.value;
    pg.connect(conString, function(err, client, done) {
      if(err) {
        return console.error('error fetching client from pool', err);
      }

      client.query("INSERT INTO gender VALUES (DEFAULT," + number + ", FALSE);", function(err, result) {
        //call `done()` to release the client back to the pool
        done();

        if(err) {
          return console.error('error running query', err);
        }
        console.log(result);
      });
    });
  });
});

//references says that is the potentiometer is a VARIABLE RESISTOR, so the feedback is giving numbers that range from 0 to 1023
//from reference: "analogRead() command converts the input voltage range, 0 to 5 volts, to a digital value between 0 and 1023"

// References
//
// http://arduino.cc/en/Tutorial/AnalogInput