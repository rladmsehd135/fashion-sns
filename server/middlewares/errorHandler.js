const errorHandler = (err, req, res, next) => {
  console.error('에러 발생:', err);

  const status  = err.status  || 500;
  const message = err.message || '서버 에러가 발생했습니다.';

  res.status(status).json({ message });
};

module.exports = errorHandler;