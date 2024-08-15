const Blog = require("../models/blog")

let methods = {
    createBlog: async(req,res)=>{
        try {
            const { title,blogText,toDisplay } = req.body;
            console.log("body",req.body)
        await Blog.create({title,blogText,toDisplay });
        return res.status(200).send({Message:"Blog Created"});
        } catch (error) {
            console.log("error", error);
            return res.status(500).send({ message: 'Error creating the blog', error: error.message });
        }
    },
    getBlogs:async(req,res)=>{
        try {
            const blogs = await Blog.find()
            return res.status(201).send(blogs)
        } catch (error) {
            console.log("error", error);
            return res.status(500).send({ message: 'Error getting the blog', error: error.message });
        }
    },
    updateBlog:async(req,res)=>{
        try {

            const { title,blogText,toDisplay } = req.body;
            const updatedBlog= await Blog.findByIdAndUpdate(req.params.id, { title,blogText,toDisplay },{new:true});
               return res.status(201).send({message:"blog Updated", Blog:updatedBlog })
            
        } catch (error) {
            console.log("error", error);
            return res.status(500).send({ message: 'Error updating the blog', error: error.message });
        }
    }
}

module.exports = methods