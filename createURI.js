require('dotenv').config()

const fs = require('fs')
const path = require('path')
const adapterString = fs.readFileSync(path.join(__dirname, 'util/adaptor.json'))
const adaptorJSON = JSON.parse(adapterString)
const qs = require('querystring')

// air API의 requset parameter로 변환하여 반환한다.
const nameConverter = (adaptorJSON, parentCd) => qs.escape(adaptorJSON[parentCd].AIR_KO_NM)

const SERVICE_KEY = process.env.AIR_SERVICEKEY
const OPENAPI_URI = 'http://openapi.airkorea.or.kr/openapi/services'
const pageNo = 1
const Rows = 100

module.exports = {
  getAirKoreaUrl: function (zoomLevel = 2, parentCd, stationName) {
    let uri = `${OPENAPI_URI}/rest/ArpltnInforInqireSvc`

    switch (zoomLevel) {
      case '2': // 시도 ( (5) 시도별 실시간 평균정보 조회 오퍼레이션 명세)
        uri += `/getCtprvnMesureLIst?itemCode=PM10&dataGubun=HOUR&searchCondition=WEEK`
        break

      case '4': // 시군구 (6) 시군구별 실시간 평균정보 조회 오퍼레이션 명세
        const sidoName = nameConverter(adaptorJSON, parentCd)
        uri += `/getCtprvnMesureSidoLIst?sidoName=${sidoName}&searchCondition=HOUR`
        break

      case '6': // 읍면동
        uri += `/getMsrstnAcctoRltmMesureDnsty?stationName=${stationName}&dataTerm=month&ver=1.3`
        break
    }

    uri += `&pageNo=${pageNo}&numOfRows=${Rows}&ServiceKey=${SERVICE_KEY}&_returnType=json`
    return uri
  },

  getSearchTMOperationURL: function (umdName) {
    return `${OPENAPI_URI}/rest/MsrstnInfoInqireSvc/getTMStdrCrdnt?umdName=${umdName}&pageNo=1&numOfRows=10&ServiceKey=${SERVICE_KEY}&_returnType=json`
  },

  getSearchNearStationURL: function (tmX, tmY) {
    return `${OPENAPI_URI}/rest/MsrstnInfoInqireSvc/getNearbyMsrstnList?tmX=${tmX}&tmY=${tmY}&ServiceKey=${SERVICE_KEY}&_returnType=json`
  }
}
