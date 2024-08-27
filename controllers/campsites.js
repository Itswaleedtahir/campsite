const Campsites = require("../models/campsites")
const services = require("../helpers/services")
const CampsiteType = require('../models/campsiteTypes');
const CampingLocationType = require("../models/campsiteLocationTypes")
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
                campsiteType:req.body.campsiteType,
                location: {  // Add this to include the location object
                    latitude: req.body.location.latitude,
                    longitude: req.body.location.longitude
                },
                website: req.body.website,
                campingLocationType:req.body.campingLocationType,
                amenities: req.body.amenities,
                specialFeatures: req.body.specialFeatures,
                rulesAndRegulations: req.body.rulesAndRegulations,
                price: req.body.price,
                images: req.body.images
              });
          
              const savedCampsite = await newCampsite.save();
            return  res.status(201).send(savedCampsite);
            
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
   return res.status(200).send({
      campsites: campsites,
      total: totalCampsites,
      pages: Math.ceil(totalCampsites / limit),
      currentPage: parseInt(page)
    });
  } catch (error) {
  return  res.status(500).send({ message: 'Error retrieving campsites', error: error.message });
  }
    },
    getSingleCampSite: async(req,res)=>{
        try {
            const campsite = await Campsites.findById(req.params.id).populate('peopleJoined'); // Populate the peopleJoined field with user data
            if (!campsite) {
               return res.status(404).send({ message: 'Campsite not found' });
            } else {
               return res.status(200).send(campsite);
            }
        } catch (error) {
          return  res.status(500).send({ message: 'Error retrieving the campsite', error: error.message });
        }
    
    },
    searchCampsite: async(req,res)=>{
        try {
            const searchQuery = {
                ...(req.body.campingLocationType && { campingLocationType: { $in: req.body.campingLocationType } }),
                ...(req.body.campsiteType && { campsiteType: { $in: req.body.campsiteType } }),
                ...(req.body.price && { price: { $gte: req.body.price.min, $lte: req.body.price.max } }),
                ...(req.body.averageRating && { 'reviewStats.averageRating': { $gte: req.body.averageRating } }),
                ...(req.body.amenities && { amenities: { $in: req.body.amenities } }),
                ...(req.body.specialFeatures && { specialFeatures: { $in: req.body.specialFeatures } }),
                ...(req.body.rulesAndRegulations && { rulesAndRegulations: { $all: req.body.rulesAndRegulations } }),
            };
    
            const results = await Campsites.find(searchQuery);
            return res.status(200).json(results);
        } catch (error) {
            console.log("Error", error);
            return res.status(500).json({ message: error.message });
        }
    },
    addCampsiteTypes: async(req,res)=>{
        try {
            const types = req.body.types; // Expect an array of types
            if (!types || !Array.isArray(types)) {
                return res.status(400).json({ message: "Invalid input. Please provide an array of campsite types." });
            }
    
            // Use a loop or bulk operation to insert types
            const insertPromises = types.map(type => {
                const newType = new CampsiteType({ type });
                return newType.save().catch(err => err.message); // Handle individual save errors
            });
    
            // Await all promises to handle them at once
            const results = await Promise.all(insertPromises);
            const errors = results.filter(result => typeof result === 'string');
            
            if (errors.length > 0) {
                return res.status(400).json({ message: "Some entries were not added due to errors.", errors });
            }
    
            return res.status(201).json({ message: "All campsite types added successfully." });
        } catch (error) {
            console.log("Error adding campsite types:", error);
            return res.status(500).json({ message: error.message });
        }
    },
    getCampsiteTypes: async(req,res)=>{
        try {
            const types = await CampsiteType.find({});
            return res.status(200).json(types);
        } catch (error) {
            console.log("Error retrieving campsite types:", error);
            return res.status(500).json({ message: error.message });
        }
    },
    addCampsiteLocationTypes:async(req,res)=>{
        try {
            const types = req.body.types; // Expect an array of types
            if (!types || !Array.isArray(types)) {
                return res.status(400).json({ message: "Invalid input. Please provide an array of camping location types." });
            }
    
            const insertPromises = types.map(type => {
                const newType = new CampingLocationType({ type });
                return newType.save().catch(err => err.message); // Handle individual save errors
            });
    
            const results = await Promise.all(insertPromises);
            const errors = results.filter(result => typeof result === 'string');
            
            if (errors.length > 0) {
                return res.status(400).json({ message: "Some entries were not added due to errors.", errors });
            }
    
            return res.status(201).json({ message: "All camping location types added successfully." });
        } catch (error) {
            console.log("Error adding camping location types:", error);
            return res.status(500).json({ message: error.message });
        }
    },
    getCampsiteLocationTypes:async(req,res)=>{
        try {
            const types = await CampingLocationType.find({});
            return res.status(200).json(types);
        } catch (error) {
            console.log("Error retrieving camping location types:", error);
            return res.status(500).json({ message: error.message });
        }
    }
}

module.exports = methods