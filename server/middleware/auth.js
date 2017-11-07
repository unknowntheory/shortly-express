const models = require('../models');
const Promise = require('bluebird');

module.exports.createSession = (req, res, next) => {
  if (req.cookies && Object.keys(req.cookies).length > 0) {
    // console.log('heloooo cookies', req.cookies);
    models.Sessions.get({hash: req.cookies.shortlyid})
      .then(session => {
        req.session = session;
        // console.log('SESSION---', session);
        return models.Users.get({id: session.id});
      })
      .then(user => {
        // console.log('USERERR', user);
        next();
      })
      .catch(err => {
        // clear and reassing new cookie
        req.cookies = {};
        module.exports.createSession(req, res, next);
      });
  } 
  if (Object.keys(req.cookies).length === 0) {
    models.Sessions.create()
      .then(results => {
        return models.Sessions.get({id: results.insertId})
          .then(session => {
            req.session = session;
            res.cookies.shortlyid = {
              'value': session.hash
            };
            next();
            // session.username = something
            // session.userId = something
          });
      });
  }
};

/************************************************************/
// Add additional authentication middleware functions below
/************************************************************/

