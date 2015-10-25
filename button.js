var five = require("johnny-five"),
  bumper, led;
  //two other variables declared 

//board calss emits several things, one of the 
five.Board().on("ready", function() {

  bumper = new five.Button(7);
  led = new five.Led(13);

//when bumper hit, turn on
  bumper.on("hit", function() {

    led.on();
    console.log("button was pressed at: ");

  }).on("release", function() {

    led.off();

  });
});