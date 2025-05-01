import axios from "axios"
import { logger } from "./logger"

interface ChapaTransactionRequest {
  amount: string
  currency: string
  email: string
  first_name: string
  last_name: string
  tx_ref: string
  callback_url: string
  return_url: string
  customization?: {
    title?: string
    description?: string
    logo?: string
  }
}

interface ChapaTransactionResponse {
  status: string
  message: string
  data: {
    checkout_url: string
    tx_ref: string
    flw_ref: string
  }
}

interface ChapaVerificationResponse {
  status: string
  message: string
  data: {
    tx_ref: string
    flw_ref: string
    amount: string
    currency: string
    status: string
    payment_date: string
  }
}

// Create a Chapa transaction
export const createChapaTransaction = async (
  data: ChapaTransactionRequest,
): Promise<{ checkout_url: string; tx_ref: string }> => {
  try {
    const response = await axios.post<ChapaTransactionResponse>(
      "https://api.chapa.co/v1/transaction/initialize",
      data,
      {
        headers: {
          Authorization: `Bearer ${process.env.CHAPA_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      },
    )

    if (response.data.status !== "success") {
      throw new Error(`Chapa transaction initialization failed: ${response.data.message}`)
    }

    return {
      checkout_url: response.data.data.checkout_url,
      tx_ref: response.data.data.tx_ref,
    }
  } catch (error) {
    logger.error("Error creating Chapa transaction:", error)
    throw error
  }
}

// Verify a Chapa transaction
export const verifyTransaction = async (tx_ref: string): Promise<ChapaVerificationResponse["data"]> => {
  try {
    const response = await axios.get<ChapaVerificationResponse>(
      `https://api.chapa.co/v1/transaction/verify/${tx_ref}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.CHAPA_SECRET_KEY}`,
        },
      },
    )

    if (response.data.status !== "success") {
      throw new Error(`Chapa transaction verification failed: ${response.data.message}`)
    }

    return response.data.data
  } catch (error) {
    logger.error("Error verifying Chapa transaction:", error)
    throw error
  }
}
