"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, FileText, Upload, AlertCircle, CheckCircle, ExternalLink } from "lucide-react"
import Footer from "@/components/Footer"
import type { Team } from "@/lib/types"

export default function SubmitPPTForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const teamId = searchParams.get("teamId")

  const [team, setTeam] = useState<Team | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [pptLink1, setPptLink1] = useState("")
  const [pptLink2, setPptLink2] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [retrying, setRetrying] = useState(false)

  useEffect(() => {
    if (!teamId) {
      router.push("/dashboard")
      return
    }

    loadTeamData()
  }, [teamId, router])

  const loadTeamData = async (retryCount = 0) => {
    try {
      const response = await fetch(`/api/teams/${teamId}`)
      if (response.ok) {
        const result = await response.json()
        if (result.ok && result.team) {
          setTeam(result.team)
          // Pre-fill existing PPT links if they exist
          setPptLink1(result.team.pptLink1 || "")
          setPptLink2(result.team.pptLink2 || "")
        } else {
          setError("Team not found")
        }
      } else if (response.status === 429) {
        // Quota exceeded - implement exponential backoff
        const delay = Math.min(1000 * Math.pow(2, retryCount), 10000) // Max 10 seconds
        console.log(`Quota exceeded, retrying in ${delay}ms... (attempt ${retryCount + 1})`)

        if (retryCount < 3) { // Max 3 retries
          setRetrying(true)
          setTimeout(() => loadTeamData(retryCount + 1), delay)
          return
        } else {
          setRetrying(false)
          setError("Google Sheets API quota exceeded. This happens when too many requests are made. Please wait a few minutes and try again.")
        }
      } else {
        setError("Failed to load team data")
      }
    } catch (error) {
      console.error("Error loading team data:", error)
      if (retryCount < 3) {
        const delay = Math.min(1000 * Math.pow(2, retryCount), 10000)
        console.log(`Network error, retrying in ${delay}ms... (attempt ${retryCount + 1})`)
        setRetrying(true)
        setTimeout(() => loadTeamData(retryCount + 1), delay)
        return
      }
      setRetrying(false)
      setError("Failed to load team data. Please check your connection and try again.")
    } finally {
      if (retryCount >= 3 || (retryCount === 0 && !error)) {
        setLoading(false)
      }
    }
  }

  const validatePDFLink = (link: string) => {
    if (!link) return true // Empty links are allowed

    const isValidDomain = link.includes('drive.google.com')
    const hasSharingParam = link.includes('usp=sharing')

    return isValidDomain && hasSharingParam
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    // Validate PDF links
    if (pptLink1 && !validatePDFLink(pptLink1)) {
      setError("PDF Link 1 must be a Google Drive link and include sharing parameter (usp=sharing)")
      return
    }

    if (pptLink2 && !validatePDFLink(pptLink2)) {
      setError("PDF Link 2 must be a Google Drive link and include sharing parameter (usp=sharing)")
      return
    }

    // Validate that we don't submit PPT links for non-existent problem statements
    if (pptLink1 && !team?.problemStatementId1) {
      setError("Cannot submit PPT Link 1 without Problem Statement ID 1")
      return
    }

    if (pptLink2 && !team?.problemStatementId2) {
      setError("Cannot submit PPT Link 2 without Problem Statement ID 2")
      return
    }

    setSubmitting(true)

    try {
      const response = await fetch(`/api/teams/${teamId}/ppt`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pptLink1: pptLink1 || "",
          pptLink2: pptLink2 || "",
        }),
      })

      const result = await response.json()

      if (response.ok && result.ok) {
        setSuccess("PPT links updated successfully!")
        // Refresh team data to show updated links
        setTimeout(() => {
          loadTeamData()
        }, 1000)
      } else {
        setError(result.message || "Failed to update PPT links")
      }
    } catch (error) {
      console.error("Error updating PPT links:", error)
      setError("Failed to update PPT links")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {retrying ? "Retrying connection..." : "Loading team data..."}
          </p>
          {retrying && (
            <p className="text-sm text-gray-500 mt-2">
              Experiencing high traffic. Please wait while we reconnect.
            </p>
          )}
        </div>
      </div>
    )
  }

  if (!team) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Fetching Team Details Failed</p>
          <p className="text-sm text-gray-500 mt-2"> Try again later.</p>
          <Button onClick={() => router.push("/dashboard")} className="mt-4">
            Back to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => router.push("/dashboard")}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Submit PDF Links</h1>
                <p className="text-gray-600">{team.teamName}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Upload className="mr-2 h-5 w-5" />
                PDF Submission for Problem Statements
              </CardTitle>
              <CardDescription>
                Submit Google Drive links to your PDF presentations. Convert your PPT to PDF before uploading to Drive, and ensure sharing is enabled.
              </CardDescription>

              {/* Official SIH Template */}
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <span className="font-medium text-blue-900">Official SIH Presentation Template</span>
                </div>
                <p className="text-sm text-blue-700 mb-3">
                  Use this official template for your SIH 2025 presentations:
                </p>
                <a
                  href="https://www.sih.gov.in/letters/SIH2025-IDEA-Presentation-Format.pptx"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-md transition-colors"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Download SIH Template
                  <ExternalLink className="ml-2 h-3 w-3" />
                </a>
              </div>
            </CardHeader>
            <CardContent>
              <Alert className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Important:</strong> Before submitting, ensure your Google Drive PDF files have sharing enabled.
                  Right-click the file → "Get shareable link" → Set to "Anyone with the link can view".
                </AlertDescription>
              </Alert>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Problem Statement 1 */}
                {team.problemStatementId1 && (
                  <div className="space-y-2">
                    <Label htmlFor="pptLink1" className="flex items-center">
                      <FileText className="mr-2 h-4 w-4" />
                      Problem Statement ID 1: {team.problemStatementId1}
                    </Label>
                    <Input
                      id="pptLink1"
                      type="url"
                      placeholder="https://drive.google.com/file/d/.../view?usp=sharing"
                      value={pptLink1}
                      onChange={(e) => setPptLink1(e.target.value)}
                      className="w-full placeholder:text-gray-400"
                    />
                    <p className="text-sm text-gray-500">
                      Enter the Google Drive link to your PDF presentation for Problem Statement 1.
                      Ensure the file is publicly shared.
                    </p>
                  </div>
                )}

                {/* Problem Statement 2 */}
                {team.problemStatementId2 && (
                  <div className="space-y-2">
                    <Label htmlFor="pptLink2" className="flex items-center">
                      <FileText className="mr-2 h-4 w-4" />
                      Problem Statement ID 2: {team.problemStatementId2}
                    </Label>
                    <Input
                      id="pptLink2"
                      type="url"
                      placeholder="https://drive.google.com/file/d/.../view?usp=sharing"
                      value={pptLink2}
                      onChange={(e) => setPptLink2(e.target.value)}
                      className="w-full placeholder:text-gray-400"
                    />
                    <p className="text-sm text-gray-500">
                      Enter the Google Drive link to your PDF presentation for Problem Statement 2.
                      Ensure the file is publicly shared.
                    </p>
                  </div>
                )}

                {/* No problem statements */}
                {!team.problemStatementId1 && !team.problemStatementId2 && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      No problem statements found for this team. Please contact your team leader to add problem statements first.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Error Message */}
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {/* Success Message */}
                {success && (
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">{success}</AlertDescription>
                  </Alert>
                )}

                {/* Submit Button */}
                <div className="flex justify-end space-x-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push("/dashboard")}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting || (!team.problemStatementId1 && !team.problemStatementId2)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Updating...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Update PDF Links
                      </>
                    )}
                  </Button>
                </div>
              </form>

              {/* Current PPT Links Display */}
              {(team.pptLink1 || team.pptLink2) && (
                <div className="mt-8 pt-6 border-t">
                  <h3 className="text-lg font-medium mb-4">Current PDF Links</h3>
                  <div className="space-y-3">
                    {team.pptLink1 && (
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">Problem Statement 1</p>
                          <a
                            href={team.pptLink1}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 underline text-sm"
                          >
                            View PDF
                          </a>
                        </div>
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      </div>
                    )}
                    {team.pptLink2 && (
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">Problem Statement 2</p>
                          <a
                            href={team.pptLink2}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 underline text-sm"
                          >
                            View PDF
                          </a>
                        </div>
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Design Tools & Resources */}
              <div className="mt-8 pt-6 border-t">
                <h3 className="text-lg font-medium mb-6 text-center">- Tools & Resources -</h3>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Design Tools */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900 flex items-center">
                      <span className="text-2xl mr-2">🎨</span>
                      Design
                    </h4>

                    <div className="space-y-3">
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">Canva</p>
                            <p className="text-sm text-gray-600">Easy drag-and-drop tool for presentations, posters, and pitch decks.</p>
                          </div>
                          <a
                            href="https://www.canva.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            Visit →
                          </a>
                        </div>
                      </div>

                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">Gamma.app</p>
                            <p className="text-sm text-gray-600">AI-powered tool to create modern, interactive pitch decks</p>
                          </div>
                          <a
                            href="https://gamma.app"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            Visit →
                          </a>
                        </div>
                      </div>

                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">Beautiful.ai</p>
                            <p className="text-sm text-gray-600">Smart presentation maker that auto-designs your slides</p>
                          </div>
                          <a
                            href="https://www.beautiful.ai"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            Visit →
                          </a>
                        </div>
                      </div>

                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">Pitch.com</p>
                            <p className="text-sm text-gray-600">Collaborative platform for sleek startup-style presentations</p>
                          </div>
                          <a
                            href="https://pitch.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            Visit →
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Flowchart Tools */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900 flex items-center">
                      <span className="text-2xl mr-2">🔹</span>
                      Flowcharts, Diagrams
                    </h4>

                    <div className="space-y-3">
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">Miro</p>
                            <p className="text-sm text-gray-600">Online whiteboard for brainstorming, flowcharts, and teamwork</p>
                          </div>
                          <a
                            href="https://miro.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            Visit →
                          </a>
                        </div>
                      </div>

                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">Whimsical</p>
                            <p className="text-sm text-gray-600">Minimal tool for flowcharts, wireframes, and sticky-note thinking</p>
                          </div>
                          <a
                            href="https://whimsical.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            Visit →
                          </a>
                        </div>
                      </div>

                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">Napkin.ai</p>
                            <p className="text-sm text-gray-600">Turns rough notes into clear, structured diagrams and visuals</p>
                          </div>
                          <a
                            href="https://napkin.ai"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            Visit →
                          </a>
                        </div>
                      </div>

                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">Lucidchart</p>
                            <p className="text-sm text-gray-600">Professional diagramming tool for flowcharts and system designs</p>
                          </div>
                          <a
                            href="https://lucidchart.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            Visit →
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  )
}