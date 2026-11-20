import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { errorHandler } from './middlewares/error.middleware.js'
import userRouter from './routes/user.routes.js'
import notesRouter from './routes/notes.routes.js'

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,  
    credentials: true  //This allows cookies, authorization headers, and sessions to be sent with requests.
}))
app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({
    extended: true,
    limit: "16kb"
}))
app.use(cookieParser())

app.use('/api/v1/users', userRouter)
app.use('/api/v1/notes', notesRouter)

app.use(errorHandler)

export { app }
