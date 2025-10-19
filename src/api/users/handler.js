class UsersHandler {
  constructor(service, validator) {
    this._service = service;
    this._validator = validator;
  }

  async postUserHandler(request, h) {
    this._validator.validateUserPayload(request.payload);
    const { username, password, fullname } = request.payload;

    const userId = await this._service.addUser({ username, password, fullname });

    const response = h.response({
      status: 'success',
      data: {
        userId,
      },
    });
    response.code(201);
    return response;
  }

  async getUserByIdHandler(request, h) {
    const { id } = request.params;
    const user = await this._service.getUserById(id);

    const response = h.response({
      status: 'success',
      data: {
        user,
      },
    });
    response.code(200);
    return response;
  }

  async getUserByUsernameHandler(request, h) {
    const { username } = request.params;
    const user = await this._service.getUserByUsername(username);

    const response = h.response({
      status: 'success',
      data: {
        user,
      },
    });
    response.code(200);
    return response;
  }
}
module.exports = UsersHandler;
