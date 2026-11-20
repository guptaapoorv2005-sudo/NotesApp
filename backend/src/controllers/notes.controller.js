import mongoose from "mongoose"
import { Note } from "../models/notes.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const validateNoteId = (noteId) => {
    if (!mongoose.isValidObjectId(noteId)) {
        throw new ApiError(400, "Invalid note ID")
    }
}

const createNote = asyncHandler(async (req, res) => {
    const { title, content } = req.body || {}

    if (typeof title !== "string" || !title.trim() ||
        typeof content !== "string" || !content.trim()) {
        throw new ApiError(400, "Title and content are required")
    }

    const note = await Note.create({ title, content, owner: req.user._id })

    return res.status(201).json(new ApiResponse(201, note, "Note created successfully"))
})

const getNotes = asyncHandler(async (req, res) => {
    const notes = await Note.find({ owner: req.user._id }).sort({ updatedAt: -1 })

    return res.status(200).json(new ApiResponse(200, notes, "Notes fetched successfully"))
})

const getNote = asyncHandler(async (req, res) => {
    validateNoteId(req.params.noteId)
    const note = await Note.findOne({ _id: req.params.noteId, owner: req.user._id })

    if (!note) throw new ApiError(404, "Note not found")

    return res.status(200).json(new ApiResponse(200, note, "Note fetched successfully"))
})

const updateNote = asyncHandler(async (req, res) => {
    validateNoteId(req.params.noteId)
    const { title, content } = req.body || {}

    if (title === undefined && content === undefined) {
        throw new ApiError(400, "Title or content is required")
    }
    if ((title !== undefined && (typeof title !== "string" || !title.trim())) ||
        (content !== undefined && (typeof content !== "string" || !content.trim()))) {
        throw new ApiError(400, "Title and content must be non-empty strings")
    }

    const updates = {}
    if (title !== undefined) updates.title = title
    if (content !== undefined) updates.content = content

    const note = await Note.findOneAndUpdate(
        { _id: req.params.noteId, owner: req.user._id },
        updates,
        { new: true, runValidators: true }
    )
    if (!note) throw new ApiError(404, "Note not found")

    return res.status(200).json(new ApiResponse(200, note, "Note updated successfully"))
})

const deleteNote = asyncHandler(async (req, res) => {
    validateNoteId(req.params.noteId)
    const note = await Note.findOneAndDelete({ _id: req.params.noteId, owner: req.user._id })

    if (!note) throw new ApiError(404, "Note not found")

    return res.status(200).json(new ApiResponse(200, {}, "Note deleted successfully"))
})

export { createNote, getNotes, getNote, updateNote, deleteNote }
