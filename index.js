import express, { json } from  "express"
import cors from "cors"
import multer from "multer"
import {v4 as uuidv4} from "uuid"
import path from "path"
import { log } from "console"

const app= express();
//multer middleware
const storage = multer.diskStorage({
    destination: function(req,file,cb){
        cb(null,"./uploads")
    },
    filename: function(req,file,cb){
     cb(null,file.fieldname + "-" + uuidv4() + path.extname(file.originalname))   
    }
});

//multer configs
const upload = multer({storage:storage})

// module.exports = multer({
//     storage: storage,
//     fileFilter: fileFilter,
//     limits: limits
// });

app.use(
    cors({
        origin:["http://localhost:8000","http://localhost:5173"],
        credentials:true
    })
)

app.use((req,res,next)=>{
    res.header("Access-Control-Allow-Origin","*")
    res.header(
        "Access-Control-Allow-Headers",
        "Origin,X-Requested-With,Content-Type,Accept"
    );
    next()
})

app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use("/uploads",express.static("uploads"))

app.get('/',function(req,res){
    res.json({message: "welcome"})
})

app.post("/upload",upload.single('file'),function(req,res){
    console.log('File Uplaoded');
})

app.listen(8000,function(){
    console.log('App is working at port 8000');
})