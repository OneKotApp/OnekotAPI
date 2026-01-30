class ApiResponse {
  constructor(statusCode, message, data = null, meta = null) {
    this.success = statusCode < 400;
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
    
    if (meta) {
      this.meta = meta;
    }
    
    this.timestamp = new Date().toISOString();
  }

  static success(message = 'Success', data = null, statusCode = 200) {
    return new ApiResponse(statusCode, message, data);
  }

  static created(message = 'Created successfully', data = null) {
    return new ApiResponse(201, message, data);
  }

  static accepted(message = 'Accepted', data = null) {
    return new ApiResponse(202, message, data);
  }

  static noContent(message = 'No Content') {
    return new ApiResponse(204, message);
  }

  static withPagination(message, data, pagination) {
    return new ApiResponse(200, message, data, {
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        totalPages: pagination.totalPages,
        totalItems: pagination.totalItems,
        hasNextPage: pagination.hasNextPage,
        hasPrevPage: pagination.hasPrevPage,
      },
    });
  }

  static error(statusCode, message) {
    return new ApiResponse(statusCode, message);
  }

  toJSON() {
    return {
      success: this.success,
      statusCode: this.statusCode,
      message: this.message,
      ...(this.data && { data: this.data }),
      ...(this.meta && { meta: this.meta }),
      timestamp: this.timestamp,
    };
  }
}

module.exports = ApiResponse;
