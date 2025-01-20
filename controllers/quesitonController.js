const Question = require("../models/questionModel")

let methods = {
    addQuestion: async(req,res)=>{
        try {
            const question = new Question(req.body);
            await question.save();
          return  res.status(201).json(question);
          } catch (error) {
            console.log("error",error)
           return res.status(400).json({ message: error.message });
          }
    },
    getQuestions:async(req,res)=>{
        try {
            const questions = await Question.find();
           return res.json(questions);
          } catch (error) {
            console.log("error",error)
           return res.status(500).json({ message: error.message });
          }
    },
    deleteQuestion:async(req,res)=>{
      try {
        const question = await Question.findByIdAndDelete(req.params.id);
        if (!question) return res.status(404).json({ message: 'Question not found' });
       return res.json({ message: 'Question deleted successfully' });
      } catch (error) {
        console.log("error",error)
       return res.status(500).json({ message: error.message });
      }
    }
}
module.exports=methods