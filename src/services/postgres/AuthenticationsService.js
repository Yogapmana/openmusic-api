const { Pool } = require('pg');
const InvariantError = require('../../exceptions/InvariantError');

class AuthenticationsService {
  constructor() {
    this._pool = new Pool();
  }

  async addRefreshToken(token) {
    // Check if token already exists
    const checkQuery = {
      text: 'SELECT token FROM authentications WHERE token = $1',
      values: [token],
    };

    const checkResult = await this._pool.query(checkQuery);

    // Only insert if token doesn't exist
    if (!checkResult.rows.length) {
      const query = {
        text: 'INSERT INTO authentications VALUES($1)',
        values: [token],
      };

      await this._pool.query(query);
    }
  }

  async verifyRefreshToken(token) {
    const query = {
      text: 'SELECT token FROM authentications WHERE token = $1',
      values: [token],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new InvariantError('Token tidak valid');
    }
  }

  async deleteRefreshToken(token) {
    const query = {
      text: 'DELETE FROM authentications WHERE token = $1',
      values: [token],
    };

    await this._pool.query(query);
  }
}

module.exports = AuthenticationsService;
