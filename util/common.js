const fs = require('fs')
const path = require('path')

module.exports = { 
    getJSON: (filepath)=>{

        let jsonObj = null;
        try{
            let jsonStr = fs.readFileSync(path.join(__dirname, filepath))
            jsonObj = JSON.parse(jsonStr)
        }catch(e){
            console.log(e);
        }

        return jsonObj;
    }
}

