const models = require('../models');
const parseCookies = (req, res, next) => {
  // console.log(req, '<-x---x--');
  if (req.headers.cookie) { 
    var cookie = req.headers.cookie.split(/=|; /g);
    req.cookies = cookie.reduce((acc, cur, i)=>{
      if (i % 2 === 0) {
        acc[cur] = cookie[i + 1];
      }
      return acc;
    }, {});
  } 
  next();
};

module.exports = parseCookies;
