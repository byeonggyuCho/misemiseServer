// import { expect } from 'chai';
// import request from 'supertest';
//import app from '../app';


const { expect } = require('chai')
const request = require('supertest')
const app = require('../app')
const assert = require('assert');


/**
 *  GeoData 포멧인지 확인한다.
 */
const isGeoData = function(obj){

    const template = {
        geometry:{
            type: "",
            coordinates:[]
        },
        properties:{
            LOC_CD : "",
            LOC_ENG_NM : "",
            LOC_KOR_NM : "",
            KOR_LV : "",
            AIR_LV : ""
        },
        type:"Feature"
    };


    return isEquivalent(template, obj)
    
}

/**
 * 
 * 프로퍼티와 타입만 비교한다.
 * @param {object} template
 * @param {object} target object
 */
const isEquivalent = function(a, b) {
    // Create arrays of property names
    var aProps = Object.getOwnPropertyNames(a);
    var bProps = Object.getOwnPropertyNames(b);


/*
//should.js
    user.should.have.properties('id', 'name');
    user.id.should.be.a.Number();
    user.name.should.be.a.String();

*/
    // If number of properties is different,
    // objects are not equivalent

    let hasAllProperties = aProps.some(prop=>{
        return bProps.includes(prop)
    })

    if(!hasAllProperties){
        return false;
    }


    for (var i = 0; i < aProps.length; i++) {
        let propName = aProps[i];
        let orgType = typeof a[propName];


        if(orgType === 'object'){
            if(Array.isArray(a[propName])){
                if(Array.isArray(b[propName])){
                    continue;
                }else{
                    return false;
                }
            }
            if(isEquivalent(a[propName],b[propName]) === false){
                return false;
            }
        }else if(orgType !==  typeof b[propName]){
            return false;
        }

        // If values of same property are not equal,
        // objects are not equivalent
        // if (a[propName] !== b[propName]) {
        //     return false;
        // }
    }

    // If we made it this far, objects
    // are considered equivalent
    return true;
}


describe('GET /country', () => {
  it('전국구 geoData 검증.', (done) => { 
    request(app)
      .get(`/country?zoomLevel=2`)
      .expect(200)
      .end((err, res) => {
        if (err) {
          done(err);
          return;
        }
        let result = true;
        if(typeof res.text === 'string'){
            let temp = JSON.parse(res.text);

            result = temp.geoData.some(_geoData=>isGeoData(_geoData))

            if(!result){
                console.log('fail!!!!!')
            }
        }

        assert.equal(result, false)
        //expect(res.text).to.equal('Hello World');
        done();
      });
  });
});


describe('GET /sig', () => {
  it('시군구  geoData 조회 검증.', (done) => {
    request(app)
      .get(`/sig?zoomLevel=4&parentCd=11`)
      .expect(200)
      .end((err, res) => {
        if (err) {
          done(err);
          return;
        }
        let result = true;
        if(typeof res.text === 'string'){
            let temp = JSON.parse(res.text);

            result = temp.geoData.some(_geoData=>isGeoData(_geoData))

            if(!result){
                console.log('fail!!!!!')
            }
        }

        assert.equal(result, true)
        //expect(res.text).to.equal('Hello World');
        done();
      });
  });
});



describe('GET /emd', () => {
    it('읍면동  geoData 조회 검증.', (done) => {
      request(app)
        .get(`/emd?zoomLevel=6&parentCd=11710`)
        .expect(200)
        .end((err, res) => {
          if (err) {
            done(err);
            return;
          }

          let result = true;
        if(typeof res.text === 'string'){
            let temp = JSON.parse(res.text);

            //result = temp.geoData.some(_geoData=>isGeoData(_geoData))

            let _length = temp.geoData.length;

            for(let i =0; i<_length; i++){
                let item = temp.geoData[i];

                if(!isGeoData(item)){
                    console.log(item);
                    result = false;
                    break;
                }
            }

            
            if(!result){
                console.error('fail!!!!!')
            }
        }

        assert.equal(result, true)
  
          //expect(res.text).to.equal('Hello World');
          done();
        });
    });
  });



/*
describe('POST /login', () => {
    it('should respond with profile', (done) => {
      request(app)
        .post('/login')
        .send({
          email: 'dogpoo@gmail.com',
          password: 'abcd1234',
        })
        .expect(200)
        .end((err, res) => {
          if (err) {
            done(err);
            return;
          }
  
          expect(res.body).has.all.keys([
            'id', 'email', 'name', 'age',
          ]);
          expect(res.body.id).to.equal('vk94z0');
          expect(res.body.name).to.equal('김개똥');
          expect(res.body.age).to.equal(20);
          done();
        });
    });
  });

  */