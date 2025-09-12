"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { LogIn, User, Lock, AlertCircle } from "lucide-react"
import type { LoginRequest, LoginResponse } from "@/lib/types"
import Footer from "@/components/Footer"

export default function LoginPage() {
  const router = useRouter()
  const [regNo, setRegNo] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const loginData: LoginRequest = { regNo, password }
      
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginData)
      })

      const result: LoginResponse = await response.json()

      if (result.ok && result.student) {
        // Store user data in localStorage
        localStorage.setItem("student", JSON.stringify(result.student))
        localStorage.setItem("team", JSON.stringify(result.team))
        localStorage.setItem("role", result.role || "none")
        
        // Redirect to dashboard
        router.push("/dashboard")
      } else {
        setError(result.message)
      }
    } catch (err) {
      setError("Login failed. Please try again.")
      console.error("Login error:", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <LogIn className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle className="text-2xl font-bold">Student Login</CardTitle>
              <CardDescription>
                Sign in with your registration number and password
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div>
                  <label htmlFor="regNo" className="block text-sm font-medium text-gray-700 mb-2">
                    University Registration Number
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      id="regNo"
                      value={regNo}
                      onChange={(e) => setRegNo(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter your registration number"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="password"
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter your password"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Don't have an account?{" "}
                  <Link href="/create-account" className="font-medium text-blue-600 hover:text-blue-500">
                    Create account here
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  )
}
