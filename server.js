var connect = require('connect'),
    http = require('http'),
    Trello = require('node-trello'),

    APP_KEY = 'e0f4f2383350169cde5a6c64b96626c1'

    app = connect()
  .use(connect.cookieParser(Math.random().toString(36)))
  .use(function(req, res, next) {
    if (req.url === '/') {
      if (req.cookies.hasOwnProperty('TrelloKey')) {
        next();
      } else {
        res.writeHead(303, 'Trello Auth', {
          Location: 'https://trello.com/1/authorize?callback_method=fragment&return_url=http://' + req.headers.host + '/register.html&scope=read,write&expiration=never&name=Tasker&key=' + APP_KEY
        });
        res.end();
      }
    } else {
      next();
    }
  })
  .use(connect.json())
  .use(connect.static('dist'))
  .use(function(req, res, next) {
    if (req.cookies.hasOwnProperty('TrelloKey')) {
      new Trello('e0f4f2383350169cde5a6c64b96626c1',req.cookies['TrelloKey']).request(req.method, req.url.split('/api', 2)[1], req.body, function(err, data) {
        if (err) throw err;
        res.end(JSON.stringify(data));
      });
    }
  })

http.createServer(app).listen(process.env.port || 9000);