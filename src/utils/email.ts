import nodemailer from "nodemailer"
import { logger } from "./logger"

interface EmailOptions {
  to: string
  subject: string
  text: string
  html: string
}

export const sendEmail = async (options: EmailOptions) => {
  try {
    // Create transporter
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number.parseInt(process.env.EMAIL_PORT!),
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    })

    // Define email options
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    }

    // Send email
    const info = await transporter.sendMail(mailOptions)
    logger.info(`Email sent: ${info.messageId}`)

    return info
  } catch (error) {
    logger.error("Error sending email:", error)
    throw error
  }
}
