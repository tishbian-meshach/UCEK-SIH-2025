"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import {
  Users,
  Crown,
  User,
  Plus,
  Edit,
  LogOut,
  Github,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  UserPlus,
  Bell,
  X,
  FileText
} from "lucide-react"
import Footer from "@/components/Footer"
import type { Student, Team, JoinRequest } from "@/lib/types"

export default function DashboardPage() {
  const router = useRouter()
  const [student, setStudent] = useState<Student | null>(null)
  const [team, setTeam] = useState<Team | null>(null)
  const [role, setRole] = useState<"leader" | "member" | "none">("none")
  const [loading, setLoading] = useState(true)
  const [requests, setRequests] = useState<JoinRequest[]>([])
  const [requestsLoading, setRequestsLoading] = useState(false)

  useEffect(() => {
    const loadDashboardData = async () => {
      // Check if user is logged in
      const storedStudent = localStorage.getItem("student")
      const storedRole = localStorage.getItem("role")

      if (!storedStudent) {
        router.push("/login")
        return
      }

      const parsedStudent = JSON.parse(storedStudent)
      const parsedRole = (storedRole as any) || "none"

      setStudent(parsedStudent)
      setRole(parsedRole)

      console.log("Dashboard: User role:", parsedRole)
      console.log("Dashboard: Student regNo:", parsedStudent.regNo)

      let currentTeam = null

      // Always fetch fresh team data from API with cache busting
      try {
        const timestamp = Date.now()
        const teamResponse = await fetch(`/api/teams?regNo=${parsedStudent.regNo}&t=${timestamp}`, {
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        })
        if (teamResponse.ok) {
          const teamResult = await teamResponse.json()
          if (teamResult.ok && teamResult.team) {
            // Update localStorage with fresh data
            localStorage.setItem("team", JSON.stringify(teamResult.team))
            currentTeam = teamResult.team
            setTeam(teamResult.team)
            console.log("Dashboard: Team loaded successfully:", teamResult.team.teamName)
          } else {
            // No team found
            localStorage.removeItem("team")
            setTeam(null)
          }
        } else {
          // Fallback to localStorage if API fails
          const storedTeam = localStorage.getItem("team")
          const parsedTeam = storedTeam && storedTeam !== "undefined" ? JSON.parse(storedTeam) : null
          currentTeam = parsedTeam
          setTeam(parsedTeam)
        }
      } catch (error) {
        console.error("Error fetching team data:", error)
        // Fallback to localStorage
        const storedTeam = localStorage.getItem("team")
        const parsedTeam = storedTeam && storedTeam !== "undefined" ? JSON.parse(storedTeam) : null
        currentTeam = parsedTeam
        setTeam(parsedTeam)
      }

      setLoading(false)

      // Load requests if user is a team leader
      if (parsedRole === "leader" && currentTeam) {
        console.log("Dashboard: Loading requests for team:", currentTeam.teamId)
        loadRequests(currentTeam.teamId)
      } else {
        console.log("Dashboard: Not loading requests - role:", parsedRole, "team:", !!currentTeam)
      }
    }

    loadDashboardData()
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem("student")
    localStorage.removeItem("team")
    localStorage.removeItem("role")
    router.push("/login")
  }

  const handleCreateTeam = () => {
    router.push("/create-team")
  }

  const handleJoinTeam = () => {
    router.push("/join-team")
  }

  const handleEditTeam = () => {
    if (team) {
      router.push(`/edit-team/${team.teamId}`)
    }
  }

  const handleSubmitPPT = () => {
    if (team) {
      router.push(`/submit-ppt?teamId=${team.teamId}`)
    }
  }

  const loadRequests = async (teamId: string) => {
    console.log("Dashboard: loadRequests called with teamId:", teamId)
    setRequestsLoading(true)
    try {
      const response = await fetch(`/api/teams/${teamId}/requests`, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })
      console.log("Dashboard: loadRequests response status:", response.status)
      if (response.ok) {
        const result = await response.json()
        console.log("Dashboard: loadRequests result:", result)
        if (result.ok) {
          setRequests(result.requests || [])
          console.log("Dashboard: Set requests:", result.requests?.length || 0, "requests")
        }
      } else {
        console.error("Dashboard: loadRequests failed with status:", response.status)
      }
    } catch (error) {
      console.error("Error loading requests:", error)
    } finally {
      setRequestsLoading(false)
    }
  }

  const handleAcceptRequest = async (requestId: string) => {
    try {
      console.log("Accepting request:", requestId)
      const response = await fetch(`/api/requests/${requestId}/accept`, {
        method: "PUT",
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })

      console.log("Accept response status:", response.status)

      if (response.ok) {
        console.log("Request accepted successfully, reloading page...")
        // Force a full page reload to get fresh data
        window.location.reload()
      } else {
        console.error("Failed to accept request:", response.status)
      }
    } catch (error) {
      console.error("Error accepting request:", error)
    }
  }

  const handleRejectRequest = async (requestId: string) => {
    try {
      console.log("Rejecting request:", requestId)
      const response = await fetch(`/api/requests/${requestId}/reject`, {
        method: "PUT",
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })

      console.log("Reject response status:", response.status)

      if (response.ok) {
        console.log("Request rejected successfully, reloading page...")
        // Force a full page reload to get fresh data
        window.location.reload()
      } else {
        console.error("Failed to reject request:", response.status)
      }
    } catch (error) {
      console.error("Error rejecting request:", error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!student) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Team Dashboard</h1>
              <p className="text-gray-600">Welcome, {student.fullName}</p>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Student Info Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="mr-2 h-5 w-5" />
              Your Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600">Registration No.</p>
                <p className="font-medium">{student.regNo}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Department</p>
                <p className="font-medium">{student.dept}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Year</p>
                <p className="font-medium">{student.year}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <Badge variant={student.status === "Available" ? "secondary" : "default"}>
                  {student.status}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Team Section */}
        {team ? (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center">
                    <Users className="mr-2 h-5 w-5" />
                    {team.teamName}
                    {role === "leader" && (
                      <Crown className="ml-2 h-4 w-4 text-yellow-500" />
                    )}
                  </CardTitle>
                  <CardDescription>
                    Problem Statement ID: {team.problemStatementId}
                  </CardDescription>
                </div>
                <div className="flex space-x-2">
                  {role === "leader" && (
                    <Button onClick={handleEditTeam}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Team
                    </Button>
                  )}
                  <Button
                    onClick={handleSubmitPPT}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold px-6 py-2 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Submit PDF
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Team Leader */}
                <div>
                  <h3 className="text-lg font-medium mb-3 flex items-center">
                    <Crown className="mr-2 h-4 w-4 text-yellow-500" />
                    Team Leader
                  </h3>
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{team.leader.fullName}</p>
                        <p className="text-sm text-gray-600">{team.leader.regNo}</p>
                      </div>
                      <div className="flex space-x-2">
                        {team.leader.github && (
                          <Button variant="outline" size="sm" asChild>
                            <a href={team.leader.github} target="_blank" rel="noopener noreferrer">
                              <Github className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                        {team.leader.projectLink && (
                          <Button variant="outline" size="sm" asChild>
                            <a href={team.leader.projectLink} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Team Members */}
                <div>
                  <h3 className="text-lg font-medium mb-3">Team Members</h3>
                  <div className="grid gap-4">
                    {team.members.map((member, index) => (
                      <div key={member.regNo} className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{member.fullName}</p>
                            <p className="text-sm text-gray-600">{member.regNo}</p>
                            <p className="text-sm text-gray-600">{member.dept} - {member.year}</p>
                          </div>
                          <div className="flex space-x-2">
                            {member.github && (
                              <Button variant="outline" size="sm" asChild>
                                <a href={member.github} target="_blank" rel="noopener noreferrer">
                                  <Github className="h-4 w-4" />
                                </a>
                              </Button>
                            )}
                            {member.projectLink && (
                              <Button variant="outline" size="sm" asChild>
                                <a href={member.projectLink} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="h-4 w-4" />
                                </a>
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Team Stats */}
                <div className={`p-4 rounded-lg ${
                  (1 + team.members.length) >= 6 ? "bg-green-50" : "bg-orange-50"
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {(1 + team.members.length) >= 6 ? (
                        <>
                          <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                          <span className="font-medium text-green-700">Team Complete</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-5 w-5 text-orange-500 mr-2" />
                          <span className="font-medium text-orange-700">Team Incomplete</span>
                        </>
                      )}
                    </div>
                    <div className="text-sm text-gray-600">
                      {1 + team.members.length} of 6 members
                    </div>
                  </div>
                  {(1 + team.members.length) < 6 && (
                    <div className="mt-2 text-sm text-orange-600">
                      Add {6 - (1 + team.members.length)} more member{6 - (1 + team.members.length) !== 1 ? 's' : ''} to complete your team
                    </div>
                  )}
                </div>

                {/* PDF Links Section */}
                {(team.pptLink1 || team.pptLink2) && (
                  <div>
                    <h3 className="text-lg font-medium mb-3">PDF Submissions</h3>
                    <div className="space-y-3">
                      {team.pptLink1 && (
                        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                          <div>
                            <p className="font-medium text-blue-900">Problem Statement 1</p>
                            <p className="text-sm text-blue-700">{team.problemStatementId1}</p>
                          </div>
                          <Button variant="outline" size="sm" asChild>
                            <a href={team.pptLink1} target="_blank" rel="noopener noreferrer">
                              <FileText className="h-4 w-4 mr-1" />
                              View PDF
                            </a>
                          </Button>
                        </div>
                      )}
                      {team.pptLink2 && (
                        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                          <div>
                            <p className="font-medium text-green-900">Problem Statement 2</p>
                            <p className="text-sm text-green-700">{team.problemStatementId2}</p>
                          </div>
                          <Button variant="outline" size="sm" asChild>
                            <a href={team.pptLink2} target="_blank" rel="noopener noreferrer">
                              <FileText className="h-4 w-4 mr-1" />
                              View PDF
                            </a>
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertCircle className="mr-2 h-5 w-5 text-orange-500" />
                No Team Found
              </CardTitle>
              <CardDescription>
                You are not currently assigned to any team.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  You can create a new team or request to join an existing team.
                </AlertDescription>
              </Alert>
              <div className="mt-4 flex space-x-4">
                <Button onClick={handleCreateTeam}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create New Team
                </Button>
                <Button variant="outline" onClick={handleJoinTeam}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Request to Join Team
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Requests Section - Only for Team Leaders */}
        {role === "leader" && team && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="mr-2 h-5 w-5" />
                Join Requests
                {requests.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {requests.length}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Students requesting to join your team
              </CardDescription>
            </CardHeader>
            <CardContent>
              {requestsLoading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-gray-600">Loading requests...</p>
                </div>
              ) : requests.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No pending join requests</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {requests.map((request) => (
                    <div key={request.id} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h4 className="font-medium text-gray-900">{request.studentName}</h4>
                            <Badge variant="outline">{request.studentRegNo}</Badge>
                          </div>

                          <div className="mb-3">
                            <p className="text-sm font-medium text-gray-700 mb-1">Skills & Experience:</p>
                            <p className="text-sm text-gray-600 bg-white p-2 rounded border">
                              {request.note}
                            </p>
                          </div>

                          {request.githubPortfolioLink && (
                            <div className="mb-3">
                              <p className="text-sm font-medium text-gray-700 mb-1">Portfolio:</p>
                              <a
                                href={request.githubPortfolioLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:text-blue-800 underline flex items-center"
                              >
                                <ExternalLink className="h-3 w-3 mr-1" />
                                View Portfolio
                              </a>
                            </div>
                          )}

                          <p className="text-xs text-gray-500">
                            Requested on {new Date(request.timestamp).toLocaleDateString()}
                          </p>
                        </div>

                        <div className="flex space-x-2 ml-4">
                          <Button
                            size="sm"
                            onClick={() => handleAcceptRequest(request.id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRejectRequest(request.id)}
                            className="text-red-600 border-red-300 hover:bg-red-50"
                          >
                            <X className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
        </div>
      </div>
      <Footer />
    </div>
  )
}
