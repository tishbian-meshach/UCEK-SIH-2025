"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Footer from "@/components/Footer"

export default function Page() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to login page
    router.push("/login")
  }, [router])

  // Show loading while redirecting
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
      <Footer />
    </div>
  )
}