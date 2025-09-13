"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ArrowLeft, Users, UserPlus, AlertCircle, CheckCircle, Github, ExternalLink } from "lucide-react"
import Footer from "@/components/Footer"
import type { Student, AvailableTeam, CreateJoinRequestRequest, CreateJoinRequestResponse } from "@/lib/types"

export default function JoinTeamPage() {
  const router = useRouter()
  const [student, setStudent] = useState<Student | null>(null)
  const [availableTeams, setAvailableTeams] = useState<AvailableTeam[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [requestsStatus, setRequestsStatus] = useState<{[teamId: string]: boolean}>({})
  
  // Join request form state
  const [selectedTeam, setSelectedTeam] = useState<AvailableTeam | null>(null)
  const [note, setNote] = useState("")
  const [githubPortfolioLink, setGithubPortfolioLink] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)

  useEffect(() => {
    // Check authentication
    const storedStudent = localStorage.getItem("student")
    const storedRole = localStorage.getItem("role")

    if (!storedStudent) {
      router.push("/login")
      return
    }

    if (storedRole !== "none") {
      router.push("/dashboard")
      return
    }

    const parsedStudent = JSON.parse(storedStudent)
    setStudent(parsedStudent)

    loadAvailableTeams()
    loadRequestsStatus(parsedStudent.regNo)
  }, [router])



  const loadAvailableTeams = async () => {
    try {
      const response = await fetch("/api/teams/available")
      if (!response.ok) {
        throw new Error("Failed to fetch available teams")
      }

      const result = await response.json()
      if (result.ok) {
        setAvailableTeams(result.teams)
      } else {
        setError(result.message)
      }
    } catch (err) {
      setError("Failed to load available teams")
      console.error("Error loading teams:", err)
    } finally {
      setLoading(false)
    }
  }

  const loadRequestsStatus = async (studentRegNo: string) => {
    try {
      console.log("[DEBUG] Loading requests status for:", studentRegNo)
      const response = await fetch(`/api/students/${studentRegNo}/requests`)
      if (response.ok) {
        const result = await response.json()
        console.log("[DEBUG] API response:", result)
        if (result.ok) {
          console.log("[DEBUG] Setting requests status:", result.requestsStatus)
          setRequestsStatus(result.requestsStatus || {})
        } else {
          console.log("[DEBUG] API returned not ok:", result.message)
        }
      } else {
        console.log("[DEBUG] Response not ok:", response.status)
      }
    } catch (error) {
      console.error("Error loading requests status:", error)
    }
  }



  const handleJoinRequest = (team: AvailableTeam) => {
    setSelectedTeam(team)
    setNote("")
    setGithubPortfolioLink("")
    setDialogOpen(true)
  }

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedTeam || !note.trim()) {
      setError("Please fill in all required fields")
      return
    }

    setSubmitting(true)
    setError("")

    try {
      const requestData: CreateJoinRequestRequest & { studentRegNo: string } = {
        teamId: selectedTeam.teamId,
        note: note.trim(),
        githubPortfolioLink: githubPortfolioLink.trim(),
        studentRegNo: student!.regNo
      }

      const response = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData)
      })

      const result: CreateJoinRequestResponse = await response.json()

      if (result.ok) {
        setSuccess("Join request sent successfully! The team leader will review your request.")
        setDialogOpen(false)
        setNote("")
        setGithubPortfolioLink("")
        setSelectedTeam(null)
        // Reload request status to show "Requested" button
        if (student) {
          loadRequestsStatus(student.regNo)
        }
      } else {
        setError(result.message)
      }
    } catch (err) {
      setError("Failed to send join request. Please try again.")
      console.error("Error submitting request:", err)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading available teams...</p>
        </div>
      </div>
    )
  }

  if (!student) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      <div className="flex-1">
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <Button
              variant="outline"
              onClick={() => router.push("/dashboard")}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Join a Team</h1>
            <p className="text-gray-600">
              Browse available teams and request to join one that matches your interests
            </p>
          </div>

          {/* Messages */}
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-6 border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}

          {/* Available Teams */}
          {availableTeams.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Available Teams</h3>
                <p className="text-gray-600 mb-4">
                  There are currently no teams with available slots.
                </p>
                <Button onClick={() => router.push("/create-team")}>
                  <Users className="mr-2 h-4 w-4" />
                  Create Your Own Team
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {availableTeams.map((team) => (
                <Card key={team.teamId} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{team.teamName}</CardTitle>
                        <CardDescription className="mt-1">
                          Led by {team.leader.name}
                        </CardDescription>
                      </div>
                      <Badge variant="secondary">
                        {team.currentMemberCount}/{team.maxMembers} members
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Problem Statement</p>
                        <p className="text-sm text-gray-600">{team.problemStatementId1}</p>
                        {team.problemStatementId2 && (
                          <p className="text-sm text-gray-600">{team.problemStatementId2}</p>
                        )}
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-gray-700">Team Leader</p>
                        <p className="text-sm text-gray-600">
                          {team.leader.dept} - {team.leader.year}
                        </p>
                      </div>

                      {team.deptNeeded && (
                        <div>
                          <p className="text-sm font-medium text-gray-700">Looking for</p>
                          <p className="text-sm text-gray-600">{team.deptNeeded}</p>
                        </div>
                      )}

                      <div className="pt-2">
                        {requestsStatus[team.teamId] ? (
                          <Button
                            className="w-full"
                            disabled
                            variant="outline"
                          >
                            <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                            Requested
                          </Button>
                        ) : (
                          <Button
                            onClick={() => handleJoinRequest(team)}
                            className="w-full"
                            disabled={!team.hasVacancy}
                          >
                            <UserPlus className="mr-2 h-4 w-4" />
                            {team.hasVacancy ? "Request to Join" : "Team Full"}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Join Request Dialog */}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent className="sm:max-w-md bg-white">
              <DialogHeader>
                <DialogTitle>Request to Join Team</DialogTitle>
                <DialogDescription>
                  Send a request to join "{selectedTeam?.teamName}". Tell them about your skills and experience.
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmitRequest} className="space-y-4">
                <div>
                  <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-2">
                    Describe your skills and why you want to join <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="note"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={4}
                    placeholder="Tell the team leader about your skills, experience, and what you can contribute to the team..."
                    required
                  />
                </div>

                <div>
                  <label htmlFor="githubPortfolio" className="block text-sm font-medium text-gray-700 mb-2">
                    GitHub Profile / Portfolio Link
                  </label>
                  <input
                    type="url"
                    id="githubPortfolio"
                    value={githubPortfolioLink}
                    onChange={(e) => setGithubPortfolioLink(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="https://github.com/yourusername or your portfolio URL"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Send Request
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <Footer />
    </div>
  )
}
