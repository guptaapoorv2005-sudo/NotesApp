import { Router } from "express"
import { createNote, getNotes, getNote, updateNote, deleteNote } from "../controllers/notes.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"

const router = Router()

router.use(verifyJWT)

router.route("/").post(createNote).get(getNotes)
router.route("/:noteId").get(getNote).patch(updateNote).delete(deleteNote)

export default router
