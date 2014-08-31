var serialport = require("serialport"),
    sm = require('javascript-state-machine');

var fsm = sm.create({
    initial: 'INITIALIZING',
    events: [{
        name: 'open',
        from: 'INITIALIZING',
        to: 'READY_TO_RECIEVE'
    }, {
        name: 'send',
        from: 'READY_TO_RECIEVE',
        to: 'SENDING'
    }, {
        name: 'finishedSending',
        from: 'SENDING',
        to: 'READY_TO_RECIEVE'
    }],
    callbacks: {
        onopen: function() {
            console.log("Serialport open");
        },
        onSENDING: function(event, from, to, msg) {
            fsm.finishedSending(msg);
        }, // THis is weird... Must refactor async thingy 
        onleaveSENDING: function(_, _, _, msg) {
            var serialCmd;
            if (msg == 'red') serialCmd = color("255", "000", "000");
            else if (msg == 'green') serialCmd = color("000", "255", "000");
            else if (msg == 'blue') serialCmd = color("000", "000", "255");
            else throw "No such command"
            sp.write(serialCmd, function(err, results) {
                if (err) {
                    throw err;
                } else {
                    sp.drain(function() {
			console.log("Sent: " + serialCmd);
                        fsm.transition(); // This allows for leaving state
                    });
                }
            });
            return sm.ASYNC;
        }
    }
});

// Takes input in forms of three-char strings of ints such as "000", "255", "124"
// and returns a formatted string to send to Rapiro to change colors of eyes
function color(r, g, b) {
    if (r.length != 3 || g.length != 3 || b.length != 3) throw "Input 0 as 000 etc"
    if (parseInt(r) < 0 || parseInt(r) > 255 || parseInt(g) < 0 || parseInt(g) > 255 || parseInt(b) < 0 || parseInt(b) > 255) throw "Values out of range";
    return "#PR" + r + "G" + g + "B" + b + "T001";
}

//var sp = new serialport.SerialPort("/dev/ttyAMA0", {
var sp = new serialport.SerialPort("/dev/pts/23", {
    baudrate: 300
});


sp.on("open", function() {
    // Notify state machine that serialport is open
    fsm.open();
});

exports.send = function(msg) {
    fsm.send(msg);
};
exports.state = function() {
    return fsm.current;
};
