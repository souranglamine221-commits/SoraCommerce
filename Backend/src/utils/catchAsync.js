// Backend/src/utils/catchAsync.js
// Wrapper pour gérer les erreurs async/await de manière élégante

const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

module.exports = catchAsync;
