// function catchAsync(fn) {
//   return function (res, req, next) {
//     fn(res, req, next).catch((e) => next(e));
//   };
// }

// module.exports = catchAsync;

// Equivalent way:
module.exports = (func) => {
  return (req, res, next) => {
    func(req, res, next).catch(next);
  };
};
