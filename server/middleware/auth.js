const models = require('../models');
const Promise = require('bluebird');

module.exports.createSession = (req, res, next) => {
  
  if (req.cookies && Object.keys(req.cookies).length > 0) {
    models.Sessions.get({hash: req.cookies.shortlyid})
      .then(session => {
        req.session = session;
        console.log('SESSION---', session);
        return models.Users.get({id: session.id});
      })
      .then(user => {
        next();
      })
      .catch(err => {
        req.cookies = {};
        module.exports.createSession(req, res, next);
      });
  } else {
    models.Sessions.create()
      .then(results => {
        return models.Sessions.get({id: results.insertId})
          .then(session => {
            req.session = session;
            req.cookies = {
              'shortlyid': {
                'value': session.hash
              }
            };
            res.cookie('shortlyid', req.cookies.shortlyid.value);
            next();
          });
      });
  }
};

/************************************************************/
// Add additional authentication middleware functions below
/************************************************************/

