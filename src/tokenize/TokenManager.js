const Jwt = require('@hapi/jwt');
const InvariantError = require('../exceptions/InvariantError');
const config = require('../utils/config');

const TokenManager = {
  generateAccessToken: (payload) => Jwt.token.generate(payload, config.jwt.accessTokenKey),
  generateRefreshToken: (payload) => Jwt.token.generate(payload, config.jwt.refreshTokenKey),
  verifyRefreshToken: (token) => {
    try {
      const artifacts = Jwt.token.decode(token);
      Jwt.token.verify(artifacts, config.jwt.refreshTokenKey);
      return artifacts.decoded.payload;
    } catch {
      throw new InvariantError('Refresh token tidak valid');
    }
  },
};

module.exports = TokenManager;
