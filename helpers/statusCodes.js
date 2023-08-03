///// 200 OK
module.exports.res200 = (res, message) => {
  return res.status(200).json({message})
}
///// 201 Created
module.exports.res201 = (res, message) => {
  return res.status(201).json({message})
}
///// 401 Unauthorized
module.exports.res401 = (res, message) => {
  return res.status(401).json({message})
}
///// 403 Forbidden
module.exports.res403 = (res, message) => {
  return res.status(403).json({message})
}
///// 404 Not Found
module.exports.res404 = (res, err) => {
  return res.status(404).json({message: err})
}
///// 408 Request Timeout
module.exports.res408 = (res, message) => {
  return res.status(408).json({message})
}
///// 422 Unprocessable Entity
module.exports.res422 = (res, errors) => {
  return res.status(422).json({validation: errors})
}
///// 429 Too Many Requests
module.exports.res429 = (res, message) => {
  return res.status(429).json({message})
}
///// 500 Internal Server Error
module.exports.res500 = (res, err) => {
  return res.status(500).json({message: err})
}
///// build validation result response
module.exports.checkValidations = validationResult => {
  return (req, res, next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(422).json({validation: errors.mapped()})
    else next()
  }
}
