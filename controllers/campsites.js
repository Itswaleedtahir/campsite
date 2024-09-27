const Campsites = require("../models/campsites")
const services = require("../helpers/services")
const CampsiteType = require('../models/campsiteTypes');
const CampingLocationType = require("../models/campsiteLocationTypes")
const Amenity = require("../models/amenity")
const SpecialFeature = require("../models/specialFeatures")
const utils = require("../utils/index")

let methods = {
    fileUploadS3: async (req, res, next) => {
        try {
            console.log("req.files ", req.files);
            let files = req.files.file; // Extract the files object
            if (!files) {
                return res.status(400).json({ success: false, message: "No files uploaded" });
            }
            // Ensure files is always an array
            if (!Array.isArray(files)) {
                files = [files];
            }
            let uploadedFiles = [];
            for (let file of files) {
                console.log("Processing file: ", file);
                // Determine file type based on mimetype
                let typeFile;
                if (file.mimetype.includes("audio")) {
                    typeFile = "Audio";
                } else if (
                    file.mimetype.includes("application") &&
                    !file.mimetype.includes("rar") &&
                    !file.mimetype.includes("zip") &&
                    !file.name.includes("rar") &&
                    !file.name.includes("zip")
                ) {
                    typeFile = "Document";
                } else if (file.mimetype.includes("image")) {
                    typeFile = "Image";
                } else if (file.mimetype.includes("video")) {
                    typeFile = "Video";
                }
                // Upload file to S3 (Public or Private)
                const fileLocation = await utils.uploadFile(
                    file,
                    req.body.type || "Public"
                );
                console.log("fileLocation ", fileLocation);
                console.log("req.userId ", req.userId);
    
                let url = fileLocation.Location;
                let urlNew, urlPath;
                if (process.env.CDN_URL) {
                    urlNew = url.replace(process.env.S3_URL, process.env.CDN_URL);
                    urlNew = urlNew.replace(process.env.S3_URL2, process.env.CDN_URL);
                    urlPath = urlNew?.replace(process.env.CDN_URL, "");
                } else {
                    urlNew = url;
                    urlPath = url;
                    urlPath = urlNew.replace(process.env.S3_URL, "");
                }
                console.log("urlNew ", urlNew);
                console.log("urlPath ", urlPath);
    
                uploadedFiles.push({
                    fileLocation: url,
                    urlCDN: urlNew,
                    urlPath: urlPath,
                    typeFile: typeFile,
                    success: true,
                    message: "File uploaded successfully"
                });
            }
            // Return response with all uploaded file locations
            return res.status(200).json({
                uploadedFiles,
                success: true,
                message: "Files uploaded successfully"
            });
        } catch (error) {
            console.error("Error handling file upload:", error);
            return res.status(500).json({
                success: false,
                message: "Internal Server Error"
            });
        }
    }
    ,
    
    createCampsite: async (req, res) => {
        try {

            const newCampsite = new Campsites({
                name: req.body.name,
                country: req.body.country,
                about: req.body.about,
                phoneNo: req.body.phoneNo,
                email: req.body.email,
                campsiteType: req.body.campsiteType,
                location: {  // Add this to include the location object
                    latitude: req.body.location.latitude,
                    longitude: req.body.location.longitude
                },
                website: req.body.website,
                campingLocationType: req.body.campingLocationType,
                amenities: req.body.amenities,
                specialFeatures: req.body.specialFeatures,
                rulesAndRegulations: req.body.rulesAndRegulations,
                price: req.body.price,
                images: req.body.images
            });

            const savedCampsite = await newCampsite.save();
            return res.status(201).send(savedCampsite);

        } catch (error) {
            console.log("error", error)
            return res.status(500).send({ message: 'Error creating the campsite', error: error.message });
        }
    },
    // PUT API for updating an existing campsite
    updateCampsite: async (req, res) => {
        const campsiteId = req.params.id; // Assuming the campsite ID is passed as a URL parameter

        try {
            const updatedCampsite = await Campsites.findByIdAndUpdate(
                campsiteId,
                { $set: req.body },
                { new: true } // Return the modified document rather than the original
            );

            if (!updatedCampsite) {
                return res.status(404).send({ message: 'Campsite not found' });
            }

            return res.status(200).send(updatedCampsite);

        } catch (error) {
            console.log("error", error);
            return res.status(500).send({ message: 'Error updating the campsite', error: error.message });
        }
    },
    getAllCampSites: async (req, res) => {
        const { page = 1, limit = 10 } = req.query;
        const skip = (page - 1) * limit;
        
        try {
            const campsites = await Campsites.find({})
                .populate('amenities')
                .populate('specialFeatures')
                .skip(skip)
                .limit(parseInt(limit));
    
            const totalCampsites = await Campsites.countDocuments();
            
            return res.status(200).send({
                campsites: campsites,
                total: totalCampsites,
                pages: Math.ceil(totalCampsites / limit),
                currentPage: parseInt(page)
            });
        } catch (error) {
            return res.status(500).send({ message: 'Error retrieving campsites', error: error.message });
        }
    },
    
    getSingleCampSite: async (req, res) => {
        try {
            const campsite = await Campsites.findById(req.params.id).populate('peopleJoined').populate('amenities')
            .populate('specialFeatures'); // Populate the peopleJoined field with user data
            if (!campsite) {
                return res.status(404).send({ message: 'Campsite not found' });
            } else {
                return res.status(200).send(campsite);
            }
        } catch (error) {
            return res.status(500).send({ message: 'Error retrieving the campsite', error: error.message });
        }

    },
    searchCampsite: async (req, res) => {
        try {
            const searchQuery = {
                ...(req.body.campingLocationType && { campingLocationType: { $in: req.body.campingLocationType } }),
                ...(req.body.campsiteType && { campsiteType: { $in: req.body.campsiteType } }),
                ...(req.body.price && { price: { $gte: req.body.price.min, $lte: req.body.price.max } }),
                ...(req.body.averageRating && {
                    'reviewStats.averageRating': {
                        $gte: req.body.averageRating.min,
                        $lte: req.body.averageRating.max
                    }
                }),
                ...(req.body.amenities && { amenities: { $in: req.body.amenities } }),
                ...(req.body.specialFeatures && { specialFeatures: { $in: req.body.specialFeatures } }),
                ...(req.body.rulesAndRegulations && { rulesAndRegulations: { $all: req.body.rulesAndRegulations } }),
            };
    
            const results = await Campsites.find(searchQuery).populate('peopleJoined').populate('amenities')
            .populate('specialFeatures');
            return res.status(200).json(results);
        } catch (error) {
            console.log("Error", error);
            return res.status(500).json({ message: error.message });
        }
    },
    
    addCampsiteTypes: async (req, res) => {
        try {
            const types = req.body.names; // Expect an array of types
            if (!types || !Array.isArray(types)) {
                return res.status(400).json({ message: "Invalid input. Please provide an array of campsite types." });
            }

            // Use a loop or bulk operation to insert types
            const insertPromises = types.map(name => {
                const newType = new CampsiteType({ name });
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
    getCampsiteTypes: async (req, res) => {
        try {
            const types = await CampsiteType.find({});
            return res.status(200).json(types);
        } catch (error) {
            console.log("Error retrieving campsite types:", error);
            return res.status(500).json({ message: error.message });
        }
    },
    addCampsiteLocationTypes: async (req, res) => {
        try {
            const types = req.body.names; // Expect an array of types
            if (!types || !Array.isArray(types)) {
                return res.status(400).json({ message: "Invalid input. Please provide an array of camping location types." });
            }

            const insertPromises = types.map(name => {
                const newType = new CampingLocationType({ name });
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
    getCampsiteLocationTypes: async (req, res) => {
        try {
            const types = await CampingLocationType.find({});
            return res.status(200).json(types);
        } catch (error) {
            console.log("Error retrieving camping location types:", error);
            return res.status(500).json({ message: error.message });
        }
    },
    addAmenity: async (req, res) => {
        try {
            const name = req.body.name; // Expect a single name string
            const image = req.body.image
            if (!name) {
                return res.status(400).json({ message: "Invalid input. Please provide an amenity name." });
            }

            const newAmenity = new Amenity({ name, image });
            await newAmenity.save();
            return res.status(201).json({ message: "Amenity added successfully.", amenity: newAmenity });
        } catch (error) {
            console.log("Error adding amenity:", error);
            return res.status(500).json({ message: error.message });
        }
    },
    addSpecialFeature: async (req, res) => {
        try {
            const name = req.body.name;
            const image = req.body.image
            if (!name) {
                return res.status(400).json({ message: "Invalid input. Please provide a special feature name." });
            }

            const newFeature = new SpecialFeature({ name, image });
            await newFeature.save();
            return res.status(201).json({ message: "Special feature added successfully.", feature: newFeature });
        } catch (error) {
            console.log("Error adding special feature:", error);
            return res.status(500).json({ message: error.message });
        }
    },
    getAmenity: async (req, res) => {
        try {
            const amenities = await Amenity.find({});
            return res.status(200).json(amenities);
        } catch (error) {
            console.log("Error retrieving amenities:", error);
            return res.status(500).json({ message: error.message });
        }
    },
    getSpecialFeatures: async (req, res) => {
        try {
            const features = await SpecialFeature.find({});
            return res.status(200).json(features);
        } catch (error) {
            console.log("Error retrieving special features:", error);
            return res.status(500).json({ message: error.message });
        }
    },
    getAllDataForFilters: async(req,res)=>{
        try {
            const amenities = await Amenity.find();
            const locationTypes = await CampingLocationType.find();
            const campsiteTypes = await CampsiteType.find();
            const specialFeatures = await SpecialFeature.find();
    
            const result = {
                amenities: amenities,
                locationTypes: locationTypes,
                campsiteTypes: campsiteTypes,
                specialFeatures: specialFeatures
            };
    
            res.json(result);
        } catch (error) {
            res.status(500).send({ message: 'Error fetching data', error: error });
        }
    }
}

module.exports = methods