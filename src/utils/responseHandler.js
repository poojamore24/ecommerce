
exports.sendResponse = (res, statusCode, data, message = 'Success') => {
  res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

exports.sendError = (res, statusCode, message) => {
  res.status(statusCode).json({
    success: false,
    message
  });
};