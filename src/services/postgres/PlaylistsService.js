const { Pool } = require('pg');
const { nanoid } = require('nanoid');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');
const AuthorizationError = require('../../exceptions/AuthorizationError');

class PlaylistsService {
  constructor() {
    this._pool = new Pool();
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
      text: 'SELECT username, playlists.id, playlists.name FROM playlists LEFT JOIN users ON playlists.owner = users.id WHERE owner = $1',
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

  async addSongToPlaylist(playlistId, songId) {
    const id = `playlistsong-${nanoid()}`;
    const query = {
      text: 'INSERT INTO playlist_songs VALUES($1, $2, $3) RETURNING id',
      values: [id, playlistId, songId],
    };

    const result = await this._pool.query(query);
    if (!result.rows.length) {
      throw new InvariantError('Lagu gagal ditambahkan ke playlist');
    }
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

  async deleteSongFromPlaylist(playlistId, songId) {
    const query = {
      text: 'DELETE FROM playlist_songs WHERE playlist_id = $1 AND song_id = $2 RETURNING id',
      values: [playlistId, songId],
    };

    const result = await this._pool.query(query);
    if (!result.rows.length) {
      throw new InvariantError('Lagu gagal dihapus dari playlist');
    }
  }
}

module.exports = PlaylistsService;
