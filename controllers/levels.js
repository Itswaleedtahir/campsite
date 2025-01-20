const Level = require("../models/Levels")


let methods = {
  addLevel: async(req, res) => {
    try {
        const { levelName, pointsRequired } = req.body;
        await Level.create({ levelName, pointsRequired });
      return res.status(200).send({Message:"Level Created"});
    } catch (error) {
      console.log("error", error)
     return res.status(500).send({ message: 'Error creating Level', error: error.message });
    }
  },
  
  getLevels: async(req, res) => {
    try {
        const levels = await Level.find().sort({ pointsRequired: 1 });
        return res.status(201).send(levels)
    } catch (error) {
        console.log("error", error);
       return res.status(500).send({ message: 'Error retrieving levels', error: error.message });
    }
},
    updateLevel:async(req,res)=>{
        try {
            const { levelName, pointsRequired } = req.body;
         const updatedLevel= await Level.findByIdAndUpdate(req.params.id, { levelName, pointsRequired },{new:true});
            return res.status(201).send({message:"Level Updated", Level:updatedLevel })
        } catch (error) {
            console.log("error", error);
            return res.status(500).send({ message: 'Error updateing levels', error: error.message });
        }
    },
    deleteLevel:async(req,res)=>{
        try {
            await Level.findByIdAndDelete(req.params.id);
            return res.status(200).send({Message:"Level Deleted"})
        } catch (error) {
            console.log("error", error);
            return res.status(500).send({ message: 'Error Deleting level', error: error.message });
        }
    }

}
module.exports = methods