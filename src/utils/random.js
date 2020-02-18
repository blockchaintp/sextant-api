/*
 * Copyright © 2018 Blockchain Technology Partners Limited All Rights Reserved
 *
 * License: Product
 */

const crypto = require('crypto')

const string = (n = 32) => {
  if (n <= 0) {
      return '';
  }
  var rs = '';
  try {
      rs = crypto.randomBytes(Math.ceil(n/2)).toString('hex').slice(0,n);
      /* note: could do this non-blocking, but still might fail */
  }
  catch(ex) {
      /* known exception cause: depletion of entropy info for randomBytes */
      console.error('Exception generating random string: ' + ex);
      /* weaker random fallback */
      rs = '';
      var r = n % 8, q = (n-r)/8, i;
      for(i = 0; i < q; i++) {
          rs += Math.random().toString(16).slice(2);
      }
      if(r > 0){
          rs += Math.random().toString(16).slice(2,i);
      }
  }
  return rs;
}

const key = () => randString(32)

module.exports = {
  string,
}
