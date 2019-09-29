module.exports = {
  cors: function (req, res, next) {
    // CORS(air_data)
    res.header('Accept-Charset', 'utf-8')
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Allow-Headers', 'X-Requested-With')
    res.header('Content-Type', 'text/html; charset=utf-8')
    next()
  }
}
