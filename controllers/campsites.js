const Campsites = require("../models/campsites")
const services = require("../helpers/services")

let methods = {
    fileUploadS3 : async (req, res, next) => {
        try {
            console.log("req.files ", req.files)
            console.log("req.files.file ", req.files.file)
            console.log("req.files.file.mimetype ", req.files.file.mimetype)
            console.log("req.body ", req.body)
            let typeFile;
            if (req.files.file.mimetype.includes("audio")) {
                typeFile = "Audio"
            } else if (req.files.file.mimetype.includes("application") && !req.files.file.mimetype.includes("rar") && !req.files.file.mimetype.includes("zip") && !req.files.file.name.includes("rar") && !req.files.file.name.includes("zip")) {
                typeFile = "Document"
            } else if (req.files.file.mimetype.includes("image")) {
                typeFile = "Image"
            } else if (req.files.file.mimetype.includes("video")) {
                typeFile = "Video"
            }
            //console.log("process.env ", process.env)
            if (req.body.type === "Private") {
                const fileLocation = await services.uploadFile(req.files.file, "Private");
                console.log("fileLocation ", fileLocation)
                console.log("req.userId ", req.userId)
                var url = fileLocation.Location
                let urlNew, urlPath;
                if (process.env.CDN_URL) {
                    urlNew = url.replace(process.env.S3_URL, process.env.CDN_URL);
                    urlNew = urlNew.replace(process.env.S3_URL2, process.env.CDN_URL);
                    urlPath = urlNew?.replace(process.env.CDN_URL, "");
                } else {
                    urlNew = url;
                    urlPath = url
                    urlPath = urlNew.replace(process.env.S3_URL, "");
                }
                console.log("urlNew ", urlNew)
                console.log("urlPath ", urlPath)
    
                // returning fileupload location
                return res.status(200).json({ fileLocation: fileLocation.Location, urlCDN: urlNew, urlPath: urlPath });
            } else if (req.body.type === "Public") {
                const fileLocation = await services.uploadFile(req.files.file, "Public");
                console.log("fileLocation ", fileLocation)
                console.log("req.userId ", req.userId)
                var url = fileLocation.Location
                let urlNew, urlPath;
                if (process.env.CDN_URL) {
                    urlNew = url.replace(process.env.S3_URL, process.env.CDN_URL);
                    urlNew = urlNew.replace(process.env.S3_URL2, process.env.CDN_URL);
                    urlPath = urlNew?.replace(process.env.CDN_URL, "");
                } else {
                    console.log("irllll",process.env.S3_URL)
                    urlNew = url;
                    urlPath = url
                    urlPath = urlNew.replace(process.env.S3_URL, "");
                }
                console.log("urlNew ", urlNew)
                console.log("urlPath ", urlPath)
    
                // returning fileupload location
                return res.status(200).json({ fileLocation: fileLocation.Location, urlCDN: urlNew, urlPath: urlPath });
            }
        } catch (error) {
            console.error('Error handling webhook:', error);
            return res.status(500).json({
                success: false,
                message: "Internal Server Error"
            })
        }
    },
    createCampsite: async(req,res)=>{
        try {

            const newCampsite = new Campsites({
                name: req.body.name,
                country: req.body.country,
                about: req.body.about,
                phoneNo: req.body.phoneNo,
                email: req.body.email,
                website: req.body.website,
                amenities: req.body.amenities,
                specialFeatures: req.body.specialFeatures,
                rulesAndRegulations: req.body.rulesAndRegulations,
                price: req.body.price,
                images: req.body.images
              });
          
              const savedCampsite = await newCampsite.save();
              res.status(201).send(savedCampsite);
            
        } catch (error) {
            console.log("error",error)
            return res.status(500).send({ message: 'Error creating the campsite', error: error.message });
        }
    },
    getAllCampSites: async(req,res)=>{
        const { page = 1, limit = 10 } = req.query; // Default values: page 1, limit 10
  try {
    const campsites = await Campsites.find({})
                                   .skip((page - 1) * limit) // Skip the previous pages' items
                                   .limit(parseInt(limit));  // Limit the number of items

    const totalCampsites = await Campsites.countDocuments(); // Count total documents for pagination info
    res.status(200).send({
      campsites: campsites,
      total: totalCampsites,
      pages: Math.ceil(totalCampsites / limit),
      currentPage: parseInt(page)
    });
  } catch (error) {
    res.status(500).send({ message: 'Error retrieving campsites', error: error.message });
  }
    },
    getSingleCampSite: async(req,res)=>{
        try {
            const campsite = await Campsites.findById(req.params.id).populate('peopleJoined'); // Populate the peopleJoined field with user data
            if (!campsite) {
                res.status(404).send({ message: 'Campsite not found' });
            } else {
                res.status(200).send(campsite);
            }
        } catch (error) {
            res.status(500).send({ message: 'Error retrieving the campsite', error: error.message });
        }
    
    }
}

module.exports = methods