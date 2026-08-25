const express = require("express");
const { executeCode } = require("../services/executionService");
const router = express.Router()
const { languageConfigs } = require("../config");

router.post('/run',async (req,res) => {
    
    const { language,code } = req.body;

    const config = languageConfigs[language];
    if(!config){
        return res.status(400).json({
            error: "Unsupported language",  
        })
    }
    if(!code){
        return res.status(400).json({error : ''})
    }

    try{
        const result = await executeCode(language,code,config);
        return res.json(result);

    }catch(err){
        console.error(err);
        return res.status(500).json({
            error: "Something went worng"
        })
    } 
});

module.exports = router;