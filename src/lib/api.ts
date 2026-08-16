import axios from "axios"

import { apiBaseUrl } from "./api-url"

export const api = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    "Content-Type": "application/json",
  },
})

// FormData debe ir con boundary del browser; el default application/json
// hace que Multer no vea `file` → 400 "file required".
api.interceptors.request.use((config) => {
  if (typeof FormData !== "undefined" && config.data instanceof FormData) {
    if (config.headers) {
      const h = config.headers as {
        delete?: (key: string) => void
        [key: string]: unknown
      }
      if (typeof h.delete === "function") {
        h.delete("Content-Type")
        h.delete("content-type")
      } else {
        delete h["Content-Type"]
        delete h["content-type"]
      }
    }
  }
  return config
})
