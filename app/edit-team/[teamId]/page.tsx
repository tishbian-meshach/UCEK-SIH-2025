"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Users, Save, AlertCircle } from "lucide-react"
import Footer from "@/components/Footer"
import MemberRow from "@/components/MemberRow"
import type { Student, Team } from "@/lib/types"

interface MemberData {
  regNo: string
  github: string
  projectLink: string
}

export default function EditTeamPage() {
  const router = useRouter()
  const params = useParams()
  const teamId = params.teamId as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  
  const [students, setStudents] = useState<Student[]>([])
  const [team, setTeam] = useState<Team | null>(null)
  const [student, setStudent] = useState<Student | null>(null)
  
  // Form data
  const [teamName, setTeamName] = useState("")
  const [problemStatementId, setProblemStatementId] = useState("")
  const [leader, setLeader] = useState<MemberData>({ regNo: "", github: "", projectLink: "" })
  const [members, setMembers] = useState<MemberData[]>([
    { regNo: "", github: "", projectLink: "" },
    { regNo: "", github: "", projectLink: "" },
    { regNo: "", github: "", projectLink: "" },
    { regNo: "", github: "", projectLink: "" },
    { regNo: "", github: "", projectLink: "" }
  ])

  useEffect(() => {
    // Check authentication
    const storedStudent = localStorage.getItem("student")
    const storedTeam = localStorage.getItem("team")
    const storedRole = localStorage.getItem("role")

    if (!storedStudent || storedRole !== "leader") {
      router.push("/dashboard")
      return
    }

    const parsedStudent = JSON.parse(storedStudent)
    const parsedTeam = storedTeam && storedTeam !== "undefined" ? JSON.parse(storedTeam) : null

    if (!parsedTeam || parsedTeam.teamId !== teamId) {
      router.push("/dashboard")
      return
    }

    setStudent(parsedStudent)
    setTeam(parsedTeam)

    console.log("Parsed team data:", parsedTeam)

    // Load students first (passing team data), then populate form data
    loadStudents(parsedTeam).then(() => {
      // Populate form with existing team data after students are loaded
      setTeamName(parsedTeam.teamName)
      setProblemStatementId(parsedTeam.problemStatementId)

      const leaderData = {
        regNo: parsedTeam.leader.regNo,
        github: parsedTeam.leader.github || "",
        projectLink: parsedTeam.leader.projectLink || ""
      }
      console.log("Setting leader data:", leaderData)
      setLeader(leaderData)

      // Populate members
      const newMembers = [...members]
      parsedTeam.members.forEach((member: any, index: number) => {
        if (index < 5) {
          newMembers[index] = {
            regNo: member.regNo,
            github: member.github || "",
            projectLink: member.projectLink || ""
          }
        }
      })
      console.log("Setting members data:", newMembers)
      setMembers(newMembers)
    })
  }, [teamId, router])

  const loadStudents = async (teamData?: Team) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/students`)
      if (!response.ok) throw new Error("Failed to load students")

      const data = await response.json()

      // For editing, we need to include both available students AND currently assigned team members
      const allStudents = data.students || []
      const currentTeam = teamData || team
      const currentTeamRegNos = currentTeam ? [
        currentTeam.leader.regNo,
        ...currentTeam.members.map(m => m.regNo)
      ] : []

      // Include available students + current team members
      const editableStudents = allStudents.filter((student: Student) =>
        student.status === "Available" || currentTeamRegNos.includes(student.regNo)
      )

      console.log("Current team regNos:", currentTeamRegNos)
      console.log("All students count:", allStudents.length)
      console.log("Editable students count:", editableStudents.length)

      setStudents(editableStudents)
      return editableStudents
    } catch (err) {
      setError("Failed to load students. Please try again.")
      console.error("Error loading students:", err)
      return []
    } finally {
      setLoading(false)
    }
  }

  const updateMember = (index: number, data: MemberData) => {
    const newMembers = [...members]
    newMembers[index] = data
    setMembers(newMembers)
  }

  const getExcludedRegNos = () => {
    const excluded = [leader.regNo]
    members.forEach(member => {
      if (member.regNo) excluded.push(member.regNo)
    })
    return excluded
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setSaving(true)

    try {
      // Basic validation
      if (!teamName.trim()) {
        setError("Team name is required")
        setSaving(false)
        return
      }

      if (!problemStatementId.trim()) {
        setError("Problem Statement ID is required")
        setSaving(false)
        return
      }

      if (!leader.regNo) {
        setError("Team leader is required")
        setSaving(false)
        return
      }

      // Check mandatory members
      for (let i = 0; i < 3; i++) {
        if (!members[i].regNo) {
          setError(`Member ${i + 1} is required`)
          setSaving(false)
          return
        }
      }

      // Call the update team API
      const updateData = {
        teamName,
        problemStatementId,
        leader: {
          regNo: leader.regNo,
          github: leader.github,
          projectLink: leader.projectLink
        },
        members: members.filter(m => m.regNo).map(m => ({
          regNo: m.regNo,
          github: m.github,
          projectLink: m.projectLink
        }))
      }

      const response = await fetch(`/api/teams/${teamId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData)
      })

      const result = await response.json()

      if (result.ok) {
        setSuccess("Team updated successfully in Google Sheets!")

        // Update localStorage with the updated team data
        const updatedTeam = {
          ...team,
          teamName,
          problemStatementId,
          leader: { ...team!.leader, github: leader.github, projectLink: leader.projectLink },
          members: members.filter(m => m.regNo).map((m, index) => ({
            ...team!.members[index],
            github: m.github,
            projectLink: m.projectLink
          }))
        }
        localStorage.setItem("team", JSON.stringify(updatedTeam))
      } else {
        setError(result.message || "Failed to update team")
        setSaving(false)
        return
      }

      // Auto-hide success message after 3 seconds
      setTimeout(() => {
        setSuccess("")
      }, 3000)

    } catch (err) {
      setError("Failed to update team. Please try again.")
      console.error("Update error:", err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading team data...</p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      <div className="flex-1">
        <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard")}
            className="mr-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit Team</h1>
            <p className="text-gray-600">Update your team information</p>
          </div>
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
            <AlertCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {/* Edit Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="mr-2 h-5 w-5" />
              Team Information
            </CardTitle>
            <CardDescription>
              Update your team details and member information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-6">
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
                  <AlertCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">{success}</AlertDescription>
                </Alert>
              )}

              {/* Team Name */}
              <div>
                <label htmlFor="teamName" className="block text-sm font-medium text-gray-700 mb-2">
                  Team Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="teamName"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter team name..."
                  required
                />
              </div>

              {/* Problem Statement ID */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="problemStatementId" className="block text-sm font-medium text-gray-700">
                    Problem Statement ID <span className="text-red-500">*</span>
                  </label>
                  <a
                    href="https://tishbian-meshach.github.io/SIH_PS_2025/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-800 underline"
                  >
                    Choose from here
                  </a>
                </div>
                <input
                  type="text"
                  id="problemStatementId"
                  value={problemStatementId}
                  onChange={(e) => setProblemStatementId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter problem statement ID..."
                  required
                />
              </div>

              {/* Team Leader */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Team Leader</h3>
                <MemberRow
                  label="Team Leader"
                  students={students}
                  memberData={leader}
                  onMemberChange={setLeader}
                  excludeRegNos={getExcludedRegNos().filter(regNo => regNo !== leader.regNo)}
                  isRequired={true}
                />
              </div>

              {/* Team Members */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">Team Members</h3>
                  <div className="text-sm text-gray-600">
                    Members 1-3 are <span className="font-medium text-red-600">mandatory</span>, 
                    Members 4-5 are <span className="font-medium text-blue-600">optional</span>
                  </div>
                </div>

                {members.map((member, index) => (
                  <div key={index}>
                    <MemberRow
                      label={`Member ${index + 1}${index >= 3 ? ' (Optional)' : ''}`}
                      students={students}
                      memberData={member}
                      onMemberChange={(data) => updateMember(index, data)}
                      excludeRegNos={getExcludedRegNos().filter(regNo => regNo !== member.regNo)}
                      isRequired={index < 3}
                      isOptional={index >= 3}
                    />
                  </div>
                ))}
              </div>

              {/* Save Button */}
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
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
        </div>
      </div>
      <Footer />
    </div>
  )
}
