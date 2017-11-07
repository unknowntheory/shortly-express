const models = require('../models');
const Promise = require('bluebird');

module.exports.createSession = (req, res, next) => {
  // console.log(, "THIS IS THE REQ IN AUTH");
  // console.log('DIS NEXT', next)
  if (req.headers.cookie) {
    // console.log('there are cookies')
  } else {
    models.Sessions.create()
      .then(session => {
        return models.Sessions.get({id: session.insertId})
          .then(session =>{
            req.session = session;
            //console.log(res, "RESPONSEEEEEE")
            next();
          });
      });
  }
};

/************************************************************/
// Add additional authentication middleware functions below
/************************************************************/

