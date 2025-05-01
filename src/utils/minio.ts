import { Client } from "minio"
import { logger } from "./logger"

// Create MinIO client
export const minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT!,
  port: Number.parseInt(process.env.MINIO_PORT!),
  useSSL: process.env.MINIO_USE_SSL === "true",
  accessKey: process.env.MINIO_ACCESS_KEY!,
  secretKey: process.env.MINIO_SECRET_KEY!,
})

// Create bucket if it doesn't exist
export async function createBucket() {
  const bucketName = process.env.MINIO_BUCKET_NAME!

  try {
    const exists = await minioClient.bucketExists(bucketName)

    if (!exists) {
      await minioClient.makeBucket(bucketName)
      logger.info(`Bucket '${bucketName}' created successfully`)

      // Set bucket policy to public
      const policy = {
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Principal: { AWS: ["*"] },
            Action: ["s3:GetObject"],
            Resource: [`arn:aws:s3:::${bucketName}/*`],
          },
        ],
      }

      await minioClient.setBucketPolicy(bucketName, JSON.stringify(policy))
      logger.info(`Bucket '${bucketName}' policy set to public`)
    } else {
      logger.info(`Bucket '${bucketName}' already exists`)
    }
  } catch (error) {
    logger.error("Error creating or configuring bucket:", error)
    throw error
  }
}

// Generate a presigned URL for uploading a file
export async function generatePresignedUrl(fileName: string, fileType: string) {
  try {
    const bucketName = process.env.MINIO_BUCKET_NAME!
    const presignedUrl = await minioClient.presignedPutObject(bucketName, fileName, 60 * 60) // 1 hour expiry
    return presignedUrl
  } catch (error) {
    logger.error("Error generating presigned URL:", error)
    throw error
  }
}

// Get public URL for a file
export function getPublicUrl(fileName: string) {
  const bucketName = process.env.MINIO_BUCKET_NAME!
  const endPoint = process.env.MINIO_ENDPOINT!
  const port = process.env.MINIO_PORT!
  const useSSL = process.env.MINIO_USE_SSL === "true"

  const protocol = useSSL ? "https" : "http"
  return `${protocol}://${endPoint}:${port}/${bucketName}/${fileName}`
}
