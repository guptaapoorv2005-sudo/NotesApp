import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js"
import { User } from "../models/user.model.js";
import jwt from "jsonwebtoken";


const registerUser = asyncHandler(async (req,res)=>{
    const {email, password} = req.body

    if(!email?.trim() || !password?.trim()){
        throw new ApiError(400, "All fields are required")
    }

    const existedUser = await User.findOne({
        email: email.trim().toLowerCase()
    })
    if(existedUser){
        throw new ApiError(409,"User with same username or email already exists")
    }

    const user = await User.create({
        email: email.trim().toLowerCase(),
        password,
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500,"Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(201,createdUser,"User registered successfully")
    )
})

const loginUser = asyncHandler(async (req,res)=>{
    const {username, email, password} = req.body

    if(!email?.trim()){
        throw new ApiError(400,"Username or email is required")
    }
    if(!password?.trim()){
        throw new ApiError(400,"Password is required")
    }

    const user = await User.findOne({
        email: email.trim().toLowerCase()
    })
    if(!user){
        throw new ApiError(404, "No user found")
    }
    
    const passwordCorrect = await user.isPasswordCorrect(password) 
    if(!passwordCorrect){
        throw new ApiError(401, "Password is incorrect")
    }

    const accessToken = user.generateAccessToken()
    const refreshToken = user.generateRefreshToken()

    user.refreshToken = refreshToken

    await user.save({validateBeforeSave: false})

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const accessTokenOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        maxAge: 24 * 60 * 60 * 1000  // 1 day time in milliseconds
    }

    const refreshTokenOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        maxAge: 10 * 24 * 60 * 60 * 1000  // 10 days
    }

    return res
    .status(200)
    .cookie("accessToken",accessToken,accessTokenOptions)
    .cookie("refreshToken",refreshToken,refreshTokenOptions)
    .json(
        new ApiResponse(200, { user: loggedInUser, accessToken, refreshToken }, "user logged in successfully")
    )
})

const logoutUser = asyncHandler(async (req,res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1
            }
        }
    )

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax"
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json( new ApiResponse(200, {}, "User logged out successfully"))
})

const refreshAccessToken = asyncHandler(async (req,res)=>{
    const incomingRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken
    if(!incomingRefreshToken){
        throw new ApiError(401,"Unauthorised request")
    }

    let decodedToken;
    try{
        decodedToken = jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
    }catch(error){
        throw new ApiError(401,"Invalid refresh token")
    }
    
    const user = await User.findById(decodedToken._id)
    if(!user){
        throw new ApiError(401,"Invalid refresh token")
    }

    if(incomingRefreshToken !== user.refreshToken){
        throw new ApiError(401, "refresh token is expired or used")
    }

    const accessToken = user.generateAccessToken()
    const newRefreshToken = user.generateRefreshToken()

    user.refreshToken = newRefreshToken
    await user.save({validateBeforeSave: false})

    const accessTokenOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        maxAge: 24 * 60 * 60 * 1000  // 1 day
    }

    const refreshTokenOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        maxAge: 10 * 24 * 60 * 60 * 1000  // 10 days
    }

    return res
    .status(200)
    .cookie("accessToken",accessToken,accessTokenOptions)
    .cookie("refreshToken",newRefreshToken,refreshTokenOptions)
    .json( new ApiResponse(200, { accessToken, refreshToken: newRefreshToken}, "Access token refreshed"))

})

const getCurrentUser = asyncHandler(async (req,res)=>{
    return res
    .status(200)
    .json(new ApiResponse( 200, req.user, "Current user fetched successfully"))
})


export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    getCurrentUser,
}
