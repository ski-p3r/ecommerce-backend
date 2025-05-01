import type { Request, Response, NextFunction } from "express"
import { z } from "zod"
import { v4 as uuidv4 } from "uuid"
import path from "path"
import { generatePresignedUrl, getPublicUrl } from "../utils/minio"
import { AppError } from "../utils/appError"

// Validation schema
const uploadRequestSchema = z.object({
  fileName: z.string(),
  fileType: z.string().refine(
    (val) => {
      const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"]
      return allowedTypes.includes(val)
    },
    {
      message: "File type not supported. Allowed types: jpeg, png, webp, gif",
    },
  ),
})

// Generate presigned URL for file upload
export const getUploadUrl = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate request body
    const validatedData = uploadRequestSchema.parse(req.body)

    // Generate unique file name
    const fileExtension = path.extname(validatedData.fileName)
    const uniqueFileName = `${uuidv4()}${fileExtension}`
    const filePath = `uploads/${uniqueFileName}`

    // Generate presigned URL
    const presignedUrl = await generatePresignedUrl(filePath, validatedData.fileType)

    // Get public URL
    const publicUrl = getPublicUrl(filePath)

    res.status(200).json({
      status: "success",
      data: {
        presignedUrl,
        publicUrl,
        fileName: uniqueFileName,
        filePath,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(new AppError("Validation error", 400, error.format()))
    }
    next(error)
  }
}
