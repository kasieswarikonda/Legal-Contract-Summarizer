export function errorHandler(err, req, res, next){
  console.error(err);
  res.status(err.status || 500).json({success: false, message: err.status ? err.message : 'Internal Server Error'});
}
