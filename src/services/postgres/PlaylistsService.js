const { Pool } = require('pg');
const { nanoid } = require('nanoid');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');
const AuthorizationError = require('../../exceptions/AuthorizationError');

class PlaylistsService {
  constructor(collaborationsService) {
    this._pool = new Pool();
    this._collaborationsService = collaborationsService;
  }

  async addPlaylist({ name, owner }) {
    const id = `playlist-${nanoid()}`;
    const query = {
      text: 'INSERT INTO playlists VALUES($1, $2, $3) RETURNING id',
      values: [id, name, owner],
    };

    const result = await this._pool.query(query);
    if (!result.rows.length) {
      throw new InvariantError('Playlist gagal ditambahkan');
    }
    return result.rows[0].id;
  }

  async getPlaylists(owner) {
    const query = {
      text: `SELECT playlists.id, playlists.name, users.username 
           FROM playlists 
           LEFT JOIN users ON playlists.owner = users.id 
           WHERE playlists.owner = $1
           
           UNION
           
           SELECT playlists.id, playlists.name, users.username 
           FROM playlists 
           LEFT JOIN users ON playlists.owner = users.id
           LEFT JOIN collaborations ON collaborations.playlist_id = playlists.id
           WHERE collaborations.user_id = $1`,
      values: [owner],
    };

    const result = await this._pool.query(query);
    return result.rows;
  }

  async deletePlaylistById(id) {
    const query = {
      text: 'DELETE FROM playlists WHERE id = $1 RETURNING id',
      values: [id],
    };

    const result = await this._pool.query(query);
    if (!result.rows.length) {
      throw new NotFoundError('Playlist gagal dihapus. Id tidak ditemukan');
    }
  }

  async verifyPlaylistOwner(playlistId, owner) {
    const query = {
      text: 'SELECT id, owner FROM playlists WHERE id = $1',
      values: [playlistId],
    };

    const result = await this._pool.query(query);
    if (!result.rows.length) {
      throw new NotFoundError('Playlist tidak ditemukan');
    }

    const playlist = result.rows[0];
    if (playlist.owner !== owner) {
      throw new AuthorizationError('Anda tidak berhak mengakses playlist ini');
    }
  }

  async addSongToPlaylist(playlistId, songId, userId) {
    const id = `playlistsong-${nanoid()}`;
    const query = {
      text: 'INSERT INTO playlist_songs VALUES($1, $2, $3) RETURNING id',
      values: [id, playlistId, songId],
    };

    const result = await this._pool.query(query);
    if (!result.rows.length) {
      throw new InvariantError('Lagu gagal ditambahkan ke playlist');
    }
    await this.addActivityToPlaylist(playlistId, songId, userId, 'add');
    return result.rows[0].id;
  }

  async getSongsFromPlaylist(playlistId) {
    const queryPlaylist = {
      text: `SELECT playlists.id, playlists.name, users.username 
             FROM playlists 
             LEFT JOIN users ON playlists.owner = users.id 
             WHERE playlists.id = $1`,
      values: [playlistId],
    };

    const querySongs = {
      text: `SELECT songs.id, songs.title, songs.performer 
             FROM songs 
             JOIN playlist_songs ON songs.id = playlist_songs.song_id 
             WHERE playlist_songs.playlist_id = $1`,
      values: [playlistId],
    };

    const playlistResult = await this._pool.query(queryPlaylist);
    const songsResult = await this._pool.query(querySongs);

    if (!playlistResult.rows.length) {
      throw new NotFoundError('Playlist tidak ditemukan');
    }

    return {
      id: playlistResult.rows[0].id,
      name: playlistResult.rows[0].name,
      username: playlistResult.rows[0].username,
      songs: songsResult.rows,
    };
  }

  async deleteSongFromPlaylist(playlistId, songId, userId) {
    const query = {
      text: 'DELETE FROM playlist_songs WHERE playlist_id = $1 AND song_id = $2 RETURNING id',
      values: [playlistId, songId],
    };

    const result = await this._pool.query(query);
    if (!result.rows.length) {
      throw new InvariantError('Lagu gagal dihapus dari playlist');
    }
    await this.addActivityToPlaylist(playlistId, songId, userId, 'delete');
  }

  async verifyPlaylistAccess(playlistId, userId) {
    try {
      await this.verifyPlaylistOwner(playlistId, userId);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      try {
        await this._collaborationsService.verifyCollaborator(
          playlistId,
          userId,
        );
      } catch {
        throw new AuthorizationError(
          'Anda tidak berhak mengakses playlist ini',
        );
      }
    }
  }

  async addActivityToPlaylist(playlistId, songId, userId, action) {
    const id = `activity-${nanoid()}`;
    const time = new Date().toISOString();
    const query = {
      text: `INSERT INTO playlist_song_activities 
             VALUES($1, $2, $3, $4, $5, $6)
             RETURNING id`,
      values: [id, playlistId, songId, userId, action, time],
    };

    const result = await this._pool.query(query);
    if (!result.rows.length) {
      throw new InvariantError('Aktivitas gagal ditambahkan ke playlist');
    }
    return result.rows[0].id;
  }

  async getPlaylistActivities(playlistId) {
    const query = {
      text: `SELECT 
             users.username, 
             songs.title, 
             playlist_song_activities.action, 
             playlist_song_activities.time
           FROM playlist_song_activities
           INNER JOIN users ON playlist_song_activities.user_id = users.id
           INNER JOIN songs ON playlist_song_activities.song_id = songs.id
           WHERE playlist_song_activities.playlist_id = $1
           ORDER BY playlist_song_activities.time ASC`,
      values: [playlistId],
    };

    const result = await this._pool.query(query);

    return {
      playlistId,
      activities: result.rows,
    };
  }
}

module.exports = PlaylistsService;
