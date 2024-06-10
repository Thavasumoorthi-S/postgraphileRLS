const express = require("express");
require('dotenv').config();
const cors = require('cors');
const { postgraphile } = require("postgraphile");
const jwt = require('jsonwebtoken');
const jwkToPem=require('jwk-to-pem')
const jwksClient = require('jwks-rsa');
const Signupplugin = require("./src/Signupplugin.js");
const ResendOtpPlugin = require('./src/ResendOtpPlugin.js');
const VerifyCodePlugin = require("./src/VerifyCodePlugin.js");
const LoginPlugin = require('./src/Loginplugin.js');



const app = express();


console.log("comin....")




const data={
  "keys": [
    {
      "alg": "RS256",
      "e": "AQAB",
      "kid": "dOtLbe0ccDapLZcEeU/3MWrQUtDIBeLyWbZ07eWtReA=",
      "kty": "RSA",
      "n": "usfAb5hVXI4NsXKmfO1q2FgfrsKF9GIbbyVoKk5myR8YrTbF8KzR4P_Ly1HWRIvw9p1SAjwAVxrvYg3YbX0AXBKATQ7K9LZcwwNXXuzOv1yPjGgEJJp68U1kQrKJklyvOfim4RsRB77E_cXE6w6Zs4NysG87mdYGxAn0pMTDrhWE2GQ5Q3dh2pSMZXHrRH6DzYloXIJyOKpbYauNkUO1UblAfJmRVS7T2bZpZxFjDQvX1CAgDSPJaxukU39sw0rqwtlAIg8f0QFANBPdAIl9LfVG5SFow8r6z_ND_P_cuTgMXgakWE8ClU2YSWFKNCZTuVEuv_cTJ_YDR3ch59botQ",
      "use": "sig"
    },
    {
      "alg": "RS256",
      "e": "AQAB",
      "kid": "CBBx7L2YlpqRcvPLoO+abfY/v2rfrgKQ99oLGsz80pI=",
      "kty": "RSA",
      "n": "sOVfD_Jahz_8rfvceyGAP78MoZjygcBtKBCsSHZ3q0vhF82CRiTiYaSr32dH6L14n8I5y7mgfFJ6dqSu7h3S2TYcdOi-L0LAynRb8FI5yaWHNw0LRARm7oWVHOPOtFltI1S_LpT9CoGzfPcSdeF6bGnl0dgVhkEL8PSSdaUUwe7yaOc5D44qYupIBoEiLNmErIwN5fSrlc8Bx88nfOupgka5fNjUbyC_c9rmGWKYO7W9XTjzDk26CTtYpOTkpC_5ib5g95Lz1HPrdWoYEHg5iOwMDG37QLxjyRo_hN76IfTvUX6VxzH8Z0Ct-bHPTLriid5G05VDi2MENSOPuJ7QtQ",
      "use": "sig"
    }

  ]
}




app.use(cors());

// Middleware to decode and verify the JWT token
function decodeToken(req, res, next) {

  const authorization = req.headers?.['authorization'];

  if (!authorization) {
    return res.status(400).json({ error: 'Missing token.' });
  }

  const token = authorization.split(' ')[1];

  try {
    const pem = jwkToPem((data.keys[0]));
    const auth = jwt.verify(token, pem, { algorithms: ['RS256'] });

    console.log("auth is the",auth);

    // Attach the decoded token to the request object for further use
    req.decodedToken = auth;

    next();
  } catch (error) {
    console.error('Error verifying token:', error);
    return res.status(401).json({ error: 'Invalid token.' });
  }
}

app.use(decodeToken);

// Define custom pgSettings based on user data
function getPGSettings(req) {
  const { user } = req;
  if (!user) {
    return {};
  }
  return {
    'jwt.claims.user_id': user.user_id,
    'jwt.claims.role': user.role,
    'jwt.claims.name': user.name,
    role: user.role
  };
}

app.use(
  postgraphile(
     'postgres://postgres:root@localhost:5432/postgraphilerls3',
    "public",
    {
      appendPlugins: [Signupplugin, ResendOtpPlugin, VerifyCodePlugin, LoginPlugin],
      watchPg: true,
      graphiql: true,
      enhanceGraphiql: true,
      pgSettings: (req) => getPGSettings(req)

    }
  )
);

const port = process.env.PORT ||5000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
