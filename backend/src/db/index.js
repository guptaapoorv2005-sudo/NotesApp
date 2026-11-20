import mongoose from 'mongoose'

const connectDB = async ()=>{
    if (!process.env.MONGODB_URI) {
        throw new Error("MONGODB_URI is required")
    }
    const connectionInstance = await mongoose.connect(process.env.MONGODB_URI)
    console.log(`\n MONGODB connected !! DB HOST: ${connectionInstance.connection.host}`)
}

export default connectDB
