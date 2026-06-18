"use client"

import { useEffect, useState } from "react"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"

export function useProtectedImage(url?: string, token?: string | null) {
  const [src, setSrc] = useState("")

  useEffect(() => {
    if (!url || !token) {
      setSrc("")
      return
    }

    let active = true
    let objectUrl = ""
    const absoluteUrl = url.startsWith("http") ? url : `${API_BASE_URL}${url}`

    fetch(absoluteUrl, { headers: { Authorization: `Bearer ${token}` } })
      .then((response) => (response.ok ? response.blob() : null))
      .then((blob) => {
        if (!active || !blob) return
        objectUrl = URL.createObjectURL(blob)
        setSrc(objectUrl)
      })
      .catch(() => {
        if (active) setSrc("")
      })

    return () => {
      active = false
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [token, url])

  return src
}
