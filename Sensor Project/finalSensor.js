var pg = require('pg');

// supply connection string through an environment variable
var conString = "postgres://jaime:parsonsdv@data-structures.cdp3q92nnmui.us-west-2.rds.amazonaws.com:5432/postgres";


var app = require('http').createServer(handler);
var io = require('socket.io')(app);

app.listen(8080);

function handler(req, res) {

    // get a pg client from the connection pool
    pg.connect(conString, function(err, client, done) {

        var handleError = function(err) {
            // no error occurred, continue with the request
            if (!err) return false;

            // An error occurred, remove the client from the connection pool.
            // A truthy value passed to done will remove the connection from the pool
            // instead of simply returning it to be reused.
            // In this case, if we have successfully received a client (truthy)
            // then it will be removed from the pool.
            if (client) {
                done(client);
            }
            res.writeHead(500, {
                'content-type': 'text/plain'
            });
            res.end('An error occurred');
            return true;
        };

        // handle an error from the connection
        if (handleError(err)) return;

        // get the total number of visits today (including the current visit)
        client.query('SELECT * FROM gender ORDER BY timedate DESC LIMIT 16;', function(err, result) {
            console.log(result.rows);
            // handle an error from the query
            if (handleError(err)) return;

            // return the client to the connection pool for other requests to reuse
            done();
            res.writeHead(200, {
                'content-type': 'application/json'
            });
            res.write(JSON.stringify(result.rows));
            res.end();

        });
    });
}

io.on('connection', function(socket) {
    socket.on('buttonPress', function(data) {
        io.emit('newData', {
            newD: 'relay data to browser'
        });
        console.log('button was pressed on local client');
        window.location.reload(true);
    });
});
