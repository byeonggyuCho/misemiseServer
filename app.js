require('dotenv').config()

const express = require('express')
//const {getJSON} =  require('./util/common.js')
const app = express()
const { cors } = require('./cors-middleware')
const {
  searchOperation,
  getNearStation,
  requestPublicServer,
  getEMDDate
} = require('./requestAPIServer')

const fs = require('fs')
const path = require('path')

const configStr = fs.readFileSync(path.join(__dirname, 'util/config.json'))

const  {
  zoomLevel: {
          countryLevel,
          sigLevel,
          emdLevel 
  }
} = JSON.parse(configStr);

//= getJSON('config.json');

const port = process.env.PORT

// CORS 허용 미들웨어
app.all('/*', cors)
const getGeoData = (zoomLevel = countryLevel, parentCd) => require(`./geoJSON/${zoomLevel === countryLevel ? '1.json' : `${parentCd}.json`}`)


/**
 * geoJSON 데이터 가공을 위한 전처리 작업.
 * @param {*} geoJSON
 * @param {*} zoomLevel
 */
const preprocessing = (geoJSON, zoomLevel) => {
  if (zoomLevel !== emdLevel) 
    return Promise.resolve(geoJSON)
  else
    return geoJSON.features.reduce(
      (pre, feature, idx) => {
        return pre
          .then(_geoJSON => searchOperation({ _geoJSON, idx }))
          .then(getNearStation)
      },
      Promise.resolve(geoJSON)
    )
}

// 전국구 GeoData 가져오기
app.get('/country', ({ query: { parentCd = 2, zoomLevel = countryLevel } }, res) =>
  preprocessing(getGeoData(zoomLevel, parentCd), zoomLevel)
    .then(_geoJSON => requestPublicServer(_geoJSON, zoomLevel, parentCd))
    .then(rtn => res.send( JSON.stringify(rtn) ))
    .then(() => console.log('=========== 전국구 조회완료 ==========='))
    .catch(e => console.log(e))
)

// 시군구 GeoData 가져오기
app.get('/sig', ({ query: { parentCd = 2, zoomLevel = countryLevel } }, res) =>
  preprocessing(getGeoData(zoomLevel, parentCd), zoomLevel)
    .then(_geoJSON => requestPublicServer(_geoJSON, zoomLevel, parentCd))
    .then(rtn => res.send(rtn))
    .then(() => console.log('=========== 시군구 조회완료 ==========='))
    .catch(e => console.log(e))
)

// 읍면동 GeoData 가져오기
app.get('/emd', ({ query: { parentCd = 2, zoomLevel = countryLevel } }, res) => {
  preprocessing(getGeoData(zoomLevel, parentCd), zoomLevel)
    .then((_geoJSON) => getEMDDate(_geoJSON, zoomLevel, parentCd))
    .then((rtn) => res.send({ geoData: rtn.features }))
    .then(() => console.log('=========== 읍면동 조회완료 ==========='))
    .catch((e) => console.error(e))
})

app.use('/', express.static(__dirname + '/public'));
app.use('/static', express.static(__dirname + '/public/static'));

app.listen(port, function () {
  console.log('Node Server is Run  listening on port ' + port + '!')
})

module.exports = app;