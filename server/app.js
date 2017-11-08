const express = require('express');
const path = require('path');
const utils = require('./lib/hashUtils');
const partials = require('express-partials');
const bodyParser = require('body-parser');
const Auth = require('./middleware/auth');
const models = require('./models');
const Cookie = require('./middleware/cookieParser');

const app = express();

app.set('views', `${__dirname}/views`);
app.set('view engine', 'ejs');
app.use(partials());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));
app.use(Cookie);
app.use(Auth.createSession);



app.get('/', (req, res) => {
  if (models.Sessions.isLoggedIn(req.session)) {
    res.render('/');
  } else {
    res.redirect('/login');
  }
});

app.get('/create', (req, res) => {
  if (models.Sessions.isLoggedIn(req.session)) {
    res.render('index');
  } else {
    res.redirect('/login');
  }
});

app.get('/links', (req, res, next) => {
  if (models.Sessions.isLoggedIn(req.session)) {
    models.Links.getAll()
      .then(links => {
        res.status(200).send(links);
      })
      .error(error => {
        res.status(500).send(error);
      });
  } else {
    res.redirect('/login');
  }
});

app.post('/links', (req, res, next) => {
  var url = req.body.url;
  if (!models.Links.isValidUrl(url)) {
    // send back a 404 if link is not valid
    return res.sendStatus(404);
  }

  return models.Links.get({ url })
    .then(link => {
      if (link) {
        throw link;
      }
      return models.Links.getUrlTitle(url);
    })
    .then(title => {
      return models.Links.create({
        url: url,
        title: title,
        baseUrl: req.headers.origin
      });
    })
    .then(results => {
      return models.Links.get({ id: results.insertId });
    })
    .then(link => {
      throw link;
    })
    .error(error => {
      res.status(500).send(error);
    })
    .catch(link => {
      res.status(200).send(link);
    });
});

/************************************************************/
// Write your authentication routes here
/************************************************************/
app.get('/signup', (req, res) => {
  res.render('signup');

});

app.post('/signup', (req, res, next) => {
  models.Users.create(req.body)
    .then(user => {
      // console.log('USERRR', user.insertId)
      models.Users.get({id: user.insertId}) 
        .then((user) => {
          // console.log('USER', user);
          models.Sessions.update({hash: req.cookies.shortlyid.value}, {userId: user.id})
          res.redirect('/');
        });
    })
    .catch(() => {
      // console.log('CAUGHTTT');
      res.redirect('/signup')
    });
});

app.get('/login', (req, res) => {
  res.render('login');
});

app.post('/login', (req, res, next) => {  
  models.Users.get({username: req.body.username})
    .then((user) => {
      // console.log('USER---', user);
      // console.log('REQ BODY', req.body);
      if (user) {
        if (models.Users.compare(req.body.password, user.password, user.salt)) {
          models.Sessions.create()
            .then((session) => {
              models.Sessions.isLoggedIn(session);
              res.redirect('/');
            });
        } else {
          res.redirect('/login');
        }
      } else {
        res.redirect('/login');
      }
    });
});

app.get('/logout', (req, res, next) => {
  // console.log(req.headers, 'REQQ');
  // console.log(req.session, 'alskdhglkweh')
  models.Sessions.delete({hash: req.session.hash})
    .then(() => {
      console.log(req.cookies)
      delete req.cookies.shortlyid
      res.redirect('/');
    })
    .catch(() => {
      console.log('should not be in here');
    });
});


/************************************************************/
// Handle the code parameter route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/:code', (req, res, next) => {

  return models.Links.get({ code: req.params.code })
    .tap(link => {

      if (!link) {
        throw new Error('Link does not exist');
      }
      return models.Clicks.create({ linkId: link.id });
    })
    .tap(link => {
      return models.Links.update(link, { visits: link.visits + 1 });
    })
    .then(({ url }) => {
      res.redirect(url);
    })
    .error(error => {
      res.status(500).send(error);
    })
    .catch(() => {
      res.redirect('/');
    });
});

module.exports = app;
