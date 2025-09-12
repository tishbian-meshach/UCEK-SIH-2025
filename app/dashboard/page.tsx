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
  CheckCircle
} from "lucide-react"
import Footer from "@/components/Footer"
import type { Student, Team } from "@/lib/types"

export default function DashboardPage() {
  const router = useRouter()
  const [student, setStudent] = useState<Student | null>(null)
  const [team, setTeam] = useState<Team | null>(null)
  const [role, setRole] = useState<"leader" | "member" | "none">("none")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is logged in
    const storedStudent = localStorage.getItem("student")
    const storedTeam = localStorage.getItem("team")
    const storedRole = localStorage.getItem("role")

    if (!storedStudent) {
      router.push("/login")
      return
    }

    setStudent(JSON.parse(storedStudent))
    setTeam(storedTeam && storedTeam !== "undefined" ? JSON.parse(storedTeam) : null)
    setRole((storedRole as any) || "none")
    setLoading(false)
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

  const handleEditTeam = () => {
    if (team) {
      router.push(`/edit-team/${team.teamId}`)
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
                {role === "leader" && (
                  <Button onClick={handleEditTeam}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Team
                  </Button>
                )}
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
                  You can create a new team or wait to be added to an existing team by a team leader.
                </AlertDescription>
              </Alert>
              <div className="mt-4">
                <Button onClick={handleCreateTeam}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create New Team
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
        </div>
      </div>
      <Footer />
    </div>
  )
}
