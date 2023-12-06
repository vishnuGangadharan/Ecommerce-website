const sharp = require("sharp")

const imageCrop = async (req, res, next) => {
    if (req.file) {


        req.file.buffer = await sharp(req.file.buffer).resize(300, 300).toBuffer()
        next()
    } else {
        next()
    }
}


const multiCrop = async (req, res, next) => {
    if (req.files && req.files.length > 0) {
        try {
            for (let i = 0; i < req.files.length; i++) {
                const file = req.files[i];
                file.buffer = await sharp(file.buffer).resize(300, 300).toBuffer();
            
            }
            next();
        } catch (error) {
            console.error(error);
            return res.status(500).send('Error processing images');
        }
    } else {
        next();
    }
};


module.exports = { imageCrop,multiCrop }