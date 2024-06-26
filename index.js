import express, { json } from  "express"
import cors from "cors"
import multer from "multer"
import {v4 as uuidv4} from "uuid"
import path from "path"
import fs from "fs"
import { exec } from "child_process"
import { error } from "console"
import { stderr, stdout } from "process"
import mysql from 'mysql';
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
    const lessonId= uuidv4();
    const videoPath= req.file.path;
    const outputPath=`./uploads/courses/${lessonId}`;
    const hlsPath= `${outputPath}/index.m3u8`;
    console.log("hlsPath",hlsPath);

    if(!fs.existsSync(outputPath)){
        fs.mkdirSync(outputPath,{recursive:true})
    }

    //ffmpeg
    const ffmpegCommand = `ffmpeg -i ${videoPath} -codec:v libx264 -codec:a aac -hls_time 10 -hls_playlist_type vod -hls_segment_filename "${outputPath}/segment%03d.ts" -start_number 0 ${hlsPath}

`;
//using sql to store data
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'videostream'
  });
  connection.connect((err) => {
    if (err) {
        console.error('Error connecting to database:', err);
        return;
    }
    console.log('Connected to database');

    // SQL query to insert data into the database
    const sql = 'INSERT INTO videourls (videourl, lessonid) VALUES (?, ?)';
    const values = [lessonId, `http://localhost:8000/uploads/courses/${lessonId}/index.m3u8`];

    connection.query(sql, values, (err, result) => {
        if (err) {
            console.error('Error inserting data:', err);
            return;
        }
        console.log('Data inserted successfully');
    });

    // Close the database connection after executing the query
    connection.end();
});
//no queue ,not to be used in production
exec(ffmpegCommand,(error,stdout,stderr)=>{
    if (error){
        console.log(`exec error: ${error}`);
    }
    console.log(`stdout:${stdout}`);
    console.log(`stdout:${stderr}`);
    const videoUrl= `http://localhost:8000/uploads/courses/${lessonId}/index.m3u8`;
    res.json({
        message:"video connverted to hsl",
        videoUrl: videoUrl,
        lessonId:lessonId
    })
})
})

app.listen(8000,function(){
    console.log('App is working at port 8000');
})