const request = require('request')
const fs = require('fs')
const path = require('path')
const qs = require('querystring')

const { getAirKoreaUrl, getSearchTMOperationURL, getSearchNearStationURL } = require('./createURI')
const adapterString = fs.readFileSync(path.join(__dirname, 'util/adaptor.json'))
const adaptorJSON = JSON.parse(adapterString)

const container = [
  { min: 0, max: 15, level: '좋음' },
  { min: 16, max: 35, level: '보통' },
  { min: 36, max: 75, level: '나쁨' },
  { min: 76, max: 999, level: '매우나쁨' }
]

const promiseFactory = (fn) =>
  new Promise((resolve, reject) => {
    fn(resolve, reject)
  })

const getLevel = (_num) => {
  typeof _num === 'string' && (_num = parseInt(_num, 10))

  if (typeof _num !== 'number' || isNaN(_num)) {
    return 'undefind'
  }

  const re = container.find(item => item.min <= _num && item.max >= _num)
  return re ? re.level : 'undefind'
}

module.exports = {
// TM 기준좌표 조회 오퍼레이션 등록
  searchOperation: ({ _geoJSON, idx }) => promiseFactory((resolve, reject) => {
    const _feature = _geoJSON.features[idx]
    const LOC_KOR_NM = _feature.properties.LOC_KOR_NM
    const umdName = qs.escape(LOC_KOR_NM)
    const searchTMOperationURL = getSearchTMOperationURL(umdName)

    console.log('TM 기준좌표 조회 오퍼레이션', LOC_KOR_NM)

    request(searchTMOperationURL, (error, response, body) => {
      if (response.statusCode === 200) {
        try {
          const airData = JSON.parse(body)
          _feature.properties.STATION_INFO = {
            'tmX': airData.list[0].tmX,
            'tmY': airData.list[0].tmY,
            'umdName': airData.list[0].umdName
          }
        } catch (e) {
          console.error(`${LOC_KOR_NM} TM 기준좌표 조회 정보가 없습니다.`)
          _feature.properties.STATION_INFO = {
            'tmX': '',
            'tmY': ''
          }
        }
        resolve({ _geoJSON, idx })
      } else {
        console.error(error)
        reject(error)
      }
    })
  }),

  // 근접 측정소 목록 조회.
  getNearStation: ({ _geoJSON, idx }) => promiseFactory((resolve, reject) => {
    const _feature = _geoJSON.features[idx].properties
    const { tmX, tmY } = _feature.STATION_INFO

    console.log('좌표!!!!!', tmX, tmY)

    if (tmX && tmY && _feature.STATION_INFO) {
      request(getSearchNearStationURL(tmX, tmX), (error, response, body) => {
        try {
          if (response.statusCode === 200) {
            const airData = JSON.parse(body)
            // 가장 가까운 곳
            console.log(`${_feature.LOC_KOR_NM}의  관측소 ${airData.list[0].stationName}`)
            _feature.STATION_INFO.stationName = airData.list[0].stationName
            resolve(_geoJSON)
          } else {
            console.error(error)
          }
          resolve(_geoJSON)
        } catch (e) {
          console.error(e)
          reject(e)
        }
      })
    } else {
      resolve(_geoJSON)
    }
  }),

  requestPublicServer: (_geoJSON, zoomLevel, parentCd) => promiseFactory(reslove => {
  // 공공API 서버에 요청.
    request(getAirKoreaUrl(zoomLevel, parentCd).trim(), (error, response, body) => {
      try {
        if (response.statusCode === 200) {
          let airData = JSON.parse(body)

          if (zoomLevel === '2') {
            airData = airData.list[0]
          } else if (zoomLevel === '4') {
            airData = airData.list.reduce((pre, cur) => {
              pre[cur.cityNameEng] = cur.pm25Value
              return pre
            }, {})
          } else if (zoomLevel === '6') {
          // 데이터 포멧에 맞춰서 수정.
          }

          // 통합데이터
          // 컨버팅은 서버에서한다.
          // geoData에 미세먼지 데이터를 통합하여 추가한다.
          _geoJSON = _geoJSON.features.map(item => {
            const LOC_CD = item.properties.LOC_CD
            const airLv = adaptorJSON[LOC_CD] ? airData[adaptorJSON[LOC_CD].AIR_NM] : 999

            item.properties = {
              ...item.properties,
              'AIR_LV': airLv,
              'KOR_LV': getLevel(airLv)
            }

            return item
          })

          reslove({ geoData: _geoJSON })
        } else {
          throw new Error(error)
        }
      } catch (error) {
        console.error('requestPublicServer', error)
      }
    })
  }),

  getEMDDate: (_geoJSON, zoomLevel, parentCd) =>
    _geoJSON.features.reduce((pre, feature, idx, arr) =>
      pre.then((__geoJSON) => promiseFactory((resolve, reject) => {
        const stationName = qs.escape(feature.properties.STATION_INFO.stationName)

        if (!feature.properties.STATION_INFO || !stationName) {
          console.log(`${feature.properties.LOC_KOR_NM}에 관측소정보가 없습니다`)

          __geoJSON.features[idx].properties.AIR_LV = '999'
          __geoJSON.features[idx].KOR_LV = getLevel('999')
        } else {
          request(getAirKoreaUrl(zoomLevel, parentCd, stationName).trim(), (error, response, body) => {
            try {
              if (!error && response.statusCode === 200) {
                const resData = JSON.parse(body)
                const airLv = resData.list[0].pm25Value

                __geoJSON.features[idx].properties.AIR_LV = airLv
                __geoJSON.features[idx].properties.KOR_LV = getLevel(airLv)
              } else {
                console.error('통신오류')
              }
            } catch (e) {
              console.error(e)
            }
          })
        }
        resolve(__geoJSON)
      }))
    , Promise.resolve(_geoJSON))
}
