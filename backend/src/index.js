import 'dotenv/config';
import connectDB from './db/index.js';
import { app } from './app.js';

connectDB()
.then(()=>{
    app.on("error",(error)=>{
        console.log("error: ",error);
        throw error;
    })
    const port = process.env.PORT || 8000
    app.listen(port,()=>{
        console.log(`Server is running at port: ${port}`)
    })
})
.catch((error)=>{
    console.log("MONGO DB connection failed!!!",error)
    process.exitCode = 1
})
