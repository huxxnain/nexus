exports.sendErrorResponse = (res, code, errorMessage, e = null) =>
  res.status(code).send({
    status: 'error',
    error: errorMessage,
    e: e?.toString(),
  });

exports.sendSuccessResponse = (res, code, data, message = 'Successfull') =>
  res.status(code).send({
    status: 'success',
    data,
    message,
  });
