"use client"

import { useState } from "react"

import { useAuthStore } from "@/features/auth/store/auth-store"

import { profileService } from "../services/profile.service"

import type { UpdateProfileDto } from "../types/profile.types"

const MAX_DIMENSION = 320
const JPEG_QUALITY = 0.82

export function useProfile() {

  const user = useAuthStore(s => s.user)
  const setUser = useAuthStore(s => s.setUser)

  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)

  async function save(dto: UpdateProfileDto) {

    setLoading(true)

    try {

      const updated =
        await profileService.updateProfile(dto)

      if (user) {
        setUser({
          ...user,
          ...updated,
        })
      }

      return updated

    } finally {

      setLoading(false)

    }

  }

  async function upload(file: File) {

    setUploading(true)

    try {

      const base64 =
        await resizeImageToBase64(file)

      const { avatarUrl } =
        await profileService.uploadAvatar(base64)

      if (user) {
        setUser({
          ...user,
          avatarUrl,
        })
      }

      return avatarUrl

    } finally {

      setUploading(false)

    }

  }

  async function removePhoto() {

    setUploading(true)

    try {

      await profileService.removeAvatar()

      if (user) {
        setUser({
          ...user,
          avatarUrl: null,
        })
      }

    } finally {

      setUploading(false)

    }

  }

  return {

    profile: user,

    loading,

    uploading,

    save,

    upload,

    removePhoto,

  }

}

function resizeImageToBase64(file: File): Promise<string> {

  return new Promise((resolve, reject) => {

    const img = new Image()

    const objectUrl = URL.createObjectURL(file)

    img.onload = () => {

      URL.revokeObjectURL(objectUrl)

      const scale =
        Math.min(
          1,
          MAX_DIMENSION / Math.max(img.width, img.height),
        )

      const width = Math.round(img.width * scale)
      const height = Math.round(img.height * scale)

      const canvas = document.createElement("canvas")

      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext("2d")

      if (!ctx) {

        reject(new Error("No se pudo procesar la imagen"))

        return

      }

      ctx.drawImage(img, 0, 0, width, height)

      resolve(
        canvas.toDataURL("image/jpeg", JPEG_QUALITY),
      )

    }

    img.onerror = () => {

      URL.revokeObjectURL(objectUrl)

      reject(new Error("No se pudo cargar la imagen"))

    }

    img.src = objectUrl

  })

}