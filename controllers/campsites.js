const Campsites = require("../models/campsites")
const User = require("../models/userModel");
const services = require("../helpers/services")
const CampsiteType = require('../models/campsiteTypes');
const CampingLocationType = require("../models/campsiteLocationTypes")
const Amenity = require("../models/amenity")
const SpecialFeature = require("../models/specialFeatures")
const utils = require("../utils/index")

// Helper function to calculate the distance between two points using the Haversine formula
const haversineDistance = (lat1, lon1, lat2, lon2) => {
    const toRad = (value) => (value * Math.PI) / 180;
  
    const R = 6371; // Radius of the Earth in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  };

// Helper function to break down a string into individual words
const breakdownString = (str) => {
    return str.split(/\s+/).filter(Boolean); // Split the string by spaces and remove empty strings
  };

// Helper function to check which words matched in specific fields
const checkMatches = (document, words) => {
    const matchedWords = [];
    words.forEach(word => {
      if (
        new RegExp(word, 'i').test(document.name) ||
        new RegExp(word, 'i').test(document.about) ||
        new RegExp(word, 'i').test(document.phoneNo) ||
        new RegExp(word, 'i').test(document.email) ||
        new RegExp(word, 'i').test(document.website) ||
        document.rulesAndRegulations.some(rule => new RegExp(word, 'i').test(rule))
      ) {
        matchedWords.push(word);
      }
    });
    return matchedWords;
  };

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
    },
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
            const name = req.body.name; // Expect a single name string
            const image = req.body.image

            if (!name) {
                return res.status(400).json({ message: "Invalid input. Please provide an amenity name." });
            }

            const CampingLocation = new CampingLocationType({ name, image });
            await CampingLocation.save();

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
    updateCampsiteLocationType: async (req, res) => {
        try {
            const { id } = req.params; // Get amenity ID from the URL parameters
            const { name, image } = req.body; // Get updated name and image from the request body
    
    
            if (!name && !image) {
                return res.status(400).json({ message: "Invalid input. Please provide either a new name or image." });
            }
    
            // Create an update object dynamically based on what fields are provided
            const updateData = {};
            if (name) updateData.name = name;
            if (image) updateData.image = image;
    
            // Find the Camping Location Type by ID and update it
            const updatedLocationType = await CampingLocationType.findByIdAndUpdate(id, updateData, { new: true });
    
            if (!updatedLocationType) {
                return res.status(404).json({ message: "Camping location type not found." });
            }
    
            return res.status(200).json({ message: "Camping location type updated successfully.", updatedLocationType });
        } catch (error) {
            console.log("Error updating camping location type:", error);
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
    getAmenity: async (req, res) => {
        try {
            const amenities = await Amenity.find({});
            return res.status(200).json(amenities);
        } catch (error) {
            console.log("Error retrieving amenities:", error);
            return res.status(500).json({ message: error.message });
        }
    },
    updateAmenity: async (req, res) => {
        try {
            const { id } = req.params; // Get amenity ID from the URL parameters
            const { name, image } = req.body; // Get updated name and image from the request body
    
            if (!name && !image) {
                return res.status(400).json({ message: "Invalid input. Please provide an amenity name or image to update." });
            }
    
            const amenity = await Amenity.findById(id); // Fetch the amenity by ID
            if (!amenity) {
                return res.status(404).json({ message: "Amenity not found." });
            }
    
            // Update amenity properties if they exist in the request
            if (name) amenity.name = name;
            if (image) amenity.image = image;
    
            await amenity.save(); // Save the updated amenity
            return res.status(200).json({ message: "Amenity updated successfully.", amenity });
        } catch (error) {
            console.log("Error updating amenity:", error);
            return res.status(500).json({ message: error.message });
        }
    },
    deleteAmenity: async (req, res) => {
        try {
            const { id } = req.params; // Get amenity ID from the URL parameters
    
            // Check if any campsite is using this amenity
            const campsiteUsingAmenity = await Campsites.findOne({ amenities: id });
            if (campsiteUsingAmenity) {
                return res.status(400).json({ message: "Cannot delete amenity because it is already in use at a campsite." });
            }
    
            
        const deletionResult = await Amenity.findByIdAndDelete(id);
        if (!deletionResult) {
            return res.status(404).json({ message: "Amenity not found." });
        }

        return res.status(200).json({ message: "Amenity deleted successfully." });
        } catch (error) {
            console.log("Error deleting amenity:", error);
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
    getSpecialFeatures: async (req, res) => {
        try {
            const features = await SpecialFeature.find({});
            return res.status(200).json(features);
        } catch (error) {
            console.log("Error retrieving special features:", error);
            return res.status(500).json({ message: error.message });
        }
    },
    updateSpecialFeature: async (req, res) => {
        try {
            const { id } = req.params; // Get special feature ID from URL parameters
            const { name, image } = req.body; // Get updated name and image from request body
    
            if (!name && !image) {
                return res.status(400).json({ message: "Invalid input. Please provide a name or image to update." });
            }
    
            const specialFeature = await SpecialFeature.findById(id);
            if (!specialFeature) {
                return res.status(404).json({ message: "Special feature not found." });
            }
    
            // Update properties if provided in request
            if (name) specialFeature.name = name;
            if (image) specialFeature.image = image;
    
            await specialFeature.save(); // Save the updated special feature
            return res.status(200).json({ message: "Special feature updated successfully.", feature: specialFeature });
        } catch (error) {
            console.log("Error updating special feature:", error);
            return res.status(500).json({ message: error.message });
        }
    },  
    deleteSpecialFeature: async (req, res) => {
        try {
            const { id } = req.params; // Get special feature ID from URL parameters
    
            const campsitesUsingFeature = await Campsites.findOne({ specialFeatures: id });
            if (campsitesUsingFeature) {
                return res.status(400).json({ message: "Cannot delete special feature because it is already in use at a campsite." });
            }
    
            const deletionResult = await SpecialFeature.findByIdAndDelete(id);
        if (!deletionResult) {
            return res.status(404).json({ message: "Special feature not found." });
        }

        return res.status(200).json({ message: "Special feature deleted successfully." });
        } catch (error) {
            console.log("Error deleting special feature:", error);
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
    },
    getNearByCamsites: async(req, res) => {
      try {
          const { latitude, longitude } = req.body;
      
          if (!latitude || !longitude) {
            return res.status(400).json({ error: 'Latitude and longitude are required' });
          }
      
          // Fetch all campsites
          const campsites = await Campsites.find({});
      
          // Filter campsites within 5 km radius
          const nearbyCampsites = campsites.filter(campsite => {
            const campsiteLat = campsite.location.latitude;
            const campsiteLon = campsite.location.longitude;
            
            if (!campsiteLat || !campsiteLon) return false;
      
            const distance = haversineDistance(latitude, longitude, campsiteLat, campsiteLon);
            return distance <= 5; // Only include campsites within 5 km radius
          });
  
          // Assuming 10 campsites per page for pagination purposes
          const pageSize = 10;
          const totalPages = Math.ceil(nearbyCampsites.length / pageSize);
      
          const formattedResponse = {
              campsites: nearbyCampsites.slice(0, pageSize), // Return only the first page
              total: nearbyCampsites.length,
              pages: totalPages,
              currentPage: 1
          };
      
         return res.json(formattedResponse);
        } catch (error) {
          console.log("error", error)
         return res.status(500).json({ error: 'Server error' });
        }
  },
  
    getRecommendCampsites: async (req, res) => {
        try {
            let userId = req.token._id;
            console.log("oid", userId);
            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }
    
            let recommendation = null;
            if (user.recommendationData && user.recommendationData.length > 0) {
                recommendation = user.recommendationData[user.recommendationData.length - 1]; // Using the latest one
            }
    
            const { string1, string2, campingLocationType } = recommendation
                ? { string1: recommendation.string1, string2: recommendation.string2, campingLocationType: recommendation.campingLocationType }
                : req.body;
    
            const wordsFromString1 = breakdownString(string1);
            const wordsFromString2 = breakdownString(string2);
            console.log("word1", wordsFromString1);
            console.log("word2", wordsFromString2);
    
            const campsites = await Campsites.find({
                campingLocationType,
                $and: [
                    {
                        $or: wordsFromString1.map(word => ({
                            $or: [
                                { name: { $regex: word, $options: 'i' } },
                                { about: { $regex: word, $options: 'i' } },
                                { phoneNo: { $regex: word, $options: 'i' } },
                                { email: { $regex: word, $options: 'i' } },
                                { website: { $regex: word, $options: 'i' } },
                                { rulesAndRegulations: { $regex: word, $options: 'i' } },
                                { campsiteType: { $regex: word, $options: 'i' } }
                            ]
                        }))
                    },
                    {
                        $or: wordsFromString2.map(word => ({
                            $or: [
                                { name: { $regex: word, $options: 'i' } },
                                { about: { $regex: word, $options: 'i' } },
                                { phoneNo: { $regex: word, $options: 'i' } },
                                { email: { $regex: word, $options: 'i' } },
                                { website: { $regex: word, $options: 'i' } },
                                { rulesAndRegulations: { $regex: word, $options: 'i' } },
                                { campsiteType: { $regex: word, $options: 'i' } }
                            ]
                        }))
                    }
                ]
            }).populate('amenities')
              .populate('specialFeatures')
              .populate('peopleJoined') // You can specify fields you want to include
              .populate('wishlistUsers');
    
            if (!campsites.length) {
                return res.status(404).json({ message: 'No campsites found matching the criteria.' });
            }
    
            const formattedResponse = {
                campsites: campsites.map(({ _doc }) => _doc), // Directly use the document data
                total: campsites.length,
                pages: Math.ceil(campsites.length / 10), // Adjust the number per page accordingly
                currentPage: 1 // Adjust based on your pagination logic
            };
             // Check if the search already exists in the user's recommendationData
      const existingRecommendation = user.recommendationData.find(recommendation =>
        recommendation.string1 === string1 &&
        recommendation.string2 === string2 &&
        recommendation.campingLocationType === campingLocationType
      );
  
      // If no existing recommendation, add a new one
      if (!existingRecommendation) {
        user.recommendationData.push({
          string1,
          string2,
          campingLocationType,
          searchedAt: new Date() // Optional: To track when the search was performed
        });
  
        // Save the user with updated recommendationData
        await user.save();
      }

    // Save the user with updated recommendationData
    await user.save();
           return res.json(formattedResponse);
        } catch (error) {
            res.status(500).json({ error: 'Server error' });
        }
    },
    
    getTopRatedCampsites: async (req, res) => {
        try {
            // Find and sort by averageRating in descending order, and limit to 3 results
            const topRatedCampsites = await Campsites.find()
                .sort({ "reviewStats.averageRating": -1 }) // Sort by averageRating in descending order
                .limit(3); // Limit to top 3 campsites
    
            // If no campsites found, return a relevant message
            if (!topRatedCampsites.length) {
                return res.status(404).json({ message: 'No campsites found.' });
            }
    
            // Return the top 3 rated campsites
            return res.status(200).json({ message: "Top 3 most rated campsites", campsites: topRatedCampsites });
        } catch (error) {
            console.log("Error fetching top rated campsites:", error);
            return res.status(500).json({ message: error.message });
        }
    }
}

module.exports = methods