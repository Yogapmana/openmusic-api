const config = require('../../utils/config');

class AlbumsHandler {
  constructor(service, validator, storageService, likesService) {
    this._service = service;
    this._validator = validator;
    this._storageService = storageService;
    this._likesService = likesService;
    this._config = config;
  }

  async postAlbumHandler(request, h) {
    this._validator.validateAlbumPayload(request.payload);
    const { name, year } = request.payload;
    const albumId = await this._service.addAlbum({ name, year });

    const response = h.response({
      status: 'success',
      data: {
        albumId,
      },
    });
    response.code(201);
    return response;
  }

  async getAlbumByIdHandler(request, h) {
    const { id } = request.params;
    const album = await this._service.getAlbumById(id);
    const response = h.response({
      status: 'success',
      data: {
        album,
      },
    });
    response.code(200);
    return response;
  }

  async putAlbumByIdHandler(request, h) {
    this._validator.validateAlbumPayload(request.payload);
    const { id } = request.params;
    const { name, year } = request.payload;
    await this._service.editAlbumById(id, { name, year });

    const response = h.response({
      status: 'success',
      message: 'Album berhasil diperbarui',
    });
    response.code(200);
    return response;
  }

  async deleteAlbumByIdHandler(request, h) {
    const { id } = request.params;
    await this._service.deleteAlbumById(id);
    const response = h.response({
      status: 'success',
      message: 'Album berhasil dihapus',
    });
    response.code(200);
    return response;
  }

  async postUploadCoverHandler(request, h) {
    const { cover } = request.payload;
    const { id } = request.params;

    // Validate file type
    if (!cover.hapi.headers['content-type'].startsWith('image/')) {
      const response = h.response({
        status: 'fail',
        message: 'Cover harus berupa gambar',
      });
      response.code(400);
      return response;
    }

    // Check if album exists and get old cover
    const oldCoverUrl = await this._service.getAlbumCoverUrl(id);

    // Delete old cover if exists
    if (oldCoverUrl) {
      const oldFilename = oldCoverUrl.split('/').pop();
      this._storageService.deleteFile(oldFilename);
    }

    // Save new file
    const filename = await this._storageService.writeFile(cover, cover.hapi);
    const coverUrl = `http://${this._config.app.host}:${this._config.app.port}/upload/covers/${filename}`;

    // Update database
    await this._service.updateAlbumCover(id, coverUrl);

    const response = h.response({
      status: 'success',
      message: 'Sampul berhasil diunggah',
    });
    response.code(201);
    return response;
  }

  async postLikeAlbumHandler(request, h) {
    const { id: albumId } = request.params;
    const { id: userId } = request.auth.credentials;

    await this._likesService.likeAlbum(userId, albumId);

    const response = h.response({
      status: 'success',
      message: 'Berhasil menyukai album',
    });
    response.code(201);
    return response;
  }

  async deleteLikeAlbumHandler(request, h) {
    const { id: albumId } = request.params;
    const { id: userId } = request.auth.credentials;

    await this._likesService.unlikeAlbum(userId, albumId);

    const response = h.response({
      status: 'success',
      message: 'Berhasil batal menyukai album',
    });
    response.code(200);
    return response;
  }

  async getAlbumLikesHandler(request, h) {
    const { id: albumId } = request.params;

    const { likes, isCache } = await this._likesService.getAlbumLikes(albumId);

    const response = h.response({
      status: 'success',
      data: {
        likes,
      },
    });
    response.code(200);

    if (isCache) {
      response.header('X-Data-Source', 'cache');
    }

    return response;
  }
}

module.exports = AlbumsHandler;
