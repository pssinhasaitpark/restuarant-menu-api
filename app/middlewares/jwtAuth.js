const JWT = require("jsonwebtoken");
const crypto = require('crypto');
const { handleResponse } = require('../utils/helper');



exports.signAccessToken = (restaurant_id, role_type) => {
  return exports.generateToken(restaurant_id, role_type, process.env.ACCESS_TOKEN_SECRET);
};

exports.generateToken = (restaurant_id, role_type, secret, expiresIn = process.env.EXPIREIN) => {
  return new Promise((resolve, reject) => {
    const payload = {
      restaurant_id: restaurant_id,
      role_type: role_type,
    };

    const options = {
      subject: `${restaurant_id}`,
      expiresIn,
    };

    JWT.sign(payload, secret, options, (err, token) => {
      if (err) reject(err);
      resolve(token);
    });
  });
};

exports.signResetToken = (email) => {
  return new Promise((resolve, reject) => {
    const payload = { email };
    const options = { expiresIn: '5m' };

    JWT.sign(payload, process.env.RESET_TOKEN_SECRET, options, (err, token) => {
      if (err) reject(err);
      resolve(token);
    });
  });
};

exports.encryptToken = (token) => {
  const key = crypto.createHash('sha256').update(process.env.ACCESS_TOKEN_SECRET).digest();
  const cipher = crypto.createCipheriv('aes-256-cbc', key, Buffer.from(process.env.ACCESS_TOKEN_SECRET).slice(0, 16));
  let encrypted = cipher.update(token, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

exports.decryptToken = (encryptedToken) => {
  const key = crypto.createHash('sha256').update(process.env.ACCESS_TOKEN_SECRET).digest();
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, Buffer.from(process.env.ACCESS_TOKEN_SECRET).slice(0, 16));
  let decrypted = decipher.update(encryptedToken, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}


exports.verifyToken = async (req, res, next) => {
  
  if (req.query.id) {
    return next();
  }

  let encryptedToken = req.headers.authorization
    ? req.headers.authorization
    : req.headers['x-auth-token'] || req.query.q ;

  if (!encryptedToken) {
    return handleResponse(res, 401, "No token provided");
  }

    if (encryptedToken.startsWith('Bearer ')) {
      encryptedToken = encryptedToken.split(' ')[1];  
    }
  

  try {
    const decryptedToken = exports.decryptToken(encryptedToken);

    const decodedToken = JWT.verify(decryptedToken, process.env.ACCESS_TOKEN_SECRET);

    if (!decodedToken) {
      return handleResponse(res, 401, "Invalid or expired token");
    }

    req.user = decodedToken;

  
    next(); 
  } catch (err) {
    return handleResponse(res, 401, "Invalid or expired token");
  }
};


exports.verifyRole = (req, res) => {
  const { role_type, encryptedToken } = req.user;

 
  let dashboardUrl = '';
  let responseMessage = '';

  if (role_type === 'super_admin') {
    responseMessage = 'Super Admin Login successfully!';
  } else if (role_type === 'admin') {
    responseMessage = 'Admin Login successfully!';
  } else if (role_type === 'restaurant_admin') {
    responseMessage = 'Restaurent Admin Login successfully!';
  }else if (role_type === 'user') {
    responseMessage = 'User Admin Login successfully!';
  }

  return handleResponse(res, 200, responseMessage, { encryptedToken, role_type });
};


