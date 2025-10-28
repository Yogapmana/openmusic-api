const { Pool } = require('pg');
const { nanoid } = require('nanoid');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');

class AlbumLikesService {
  constructor(cacheService) {
    this._pool = new Pool();
    this._cacheService = cacheService;
  }

  async likeAlbum(userId, albumId) {
    // Check if album exists
    const checkAlbumQuery = {
      text: 'SELECT id FROM albums WHERE id = $1',
      values: [albumId],
    };
    const albumResult = await this._pool.query(checkAlbumQuery);

    if (!albumResult.rows.length) {
      throw new NotFoundError('Album tidak ditemukan');
    }

    // Check if user already liked this album
    const checkLikeQuery = {
      text: 'SELECT id FROM user_album_likes WHERE user_id = $1 AND album_id = $2',
      values: [userId, albumId],
    };
    const likeResult = await this._pool.query(checkLikeQuery);

    if (likeResult.rows.length) {
      throw new InvariantError('Anda sudah menyukai album ini');
    }

    // Add like
    const id = `like-${nanoid(16)}`;
    const query = {
      text: 'INSERT INTO user_album_likes VALUES($1, $2, $3) RETURNING id',
      values: [id, userId, albumId],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new InvariantError('Gagal menyukai album');
    }

    // Delete cache if exists
    await this._cacheService.delete(`album_likes:${albumId}`);

    return result.rows[0].id;
  }

  async unlikeAlbum(userId, albumId) {
    const query = {
      text: 'DELETE FROM user_album_likes WHERE user_id = $1 AND album_id = $2 RETURNING id',
      values: [userId, albumId],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError(
        'Gagal batal menyukai album. Anda belum menyukai album ini',
      );
    }

    // Delete cache if exists
    await this._cacheService.delete(`album_likes:${albumId}`);
  }

  async getAlbumLikes(albumId) {
    try {
      // Try to get from cache first
      const result = await this._cacheService.get(`album_likes:${albumId}`);
      return {
        likes: parseInt(result, 10),
        isCache: true,
      };
    } catch (error) {
      // If not in cache, get from database
      const query = {
        text: 'SELECT COUNT(*) FROM user_album_likes WHERE album_id = $1',
        values: [albumId],
      };

      const result = await this._pool.query(query);
      const likes = parseInt(result.rows[0].count, 10);

      // Store in cache
      await this._cacheService.set(`album_likes:${albumId}`, likes);

      return {
        likes,
        isCache: false,
      };
    }
  }
}

module.exports = AlbumLikesService;
