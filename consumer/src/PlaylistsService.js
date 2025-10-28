const { Pool } = require("pg");

class PlaylistsService {
  constructor() {
    this._pool = new Pool();
  }

  async getPlaylistById(playlistId) {
    const queryPlaylist = {
      text: `SELECT playlists.id, playlists.name 
             FROM playlists 
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

    return {
      playlist: {
        id: playlistResult.rows[0].id,
        name: playlistResult.rows[0].name,
        songs: songsResult.rows,
      },
    };
  }
}

module.exports = PlaylistsService;
