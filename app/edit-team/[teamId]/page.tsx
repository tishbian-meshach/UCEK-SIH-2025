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
  const [problemStatementId1, setProblemStatementId1] = useState("")
  const [problemStatementId2, setProblemStatementId2] = useState("")
  const [needOtherDept, setNeedOtherDept] = useState(false)
  const [deptNeeded, setDeptNeeded] = useState<string[]>([])
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

    // Fetch fresh team data from Google Sheets instead of using localStorage
    const loadFreshTeamData = async () => {
      try {
        const response = await fetch(`/api/teams/${teamId}/get`)
        if (!response.ok) {
          throw new Error("Failed to fetch team data")
        }

        const result = await response.json()
        if (!result.ok) {
          throw new Error(result.message)
        }

        const freshTeamData = result.team
        console.log("Fresh team data from Google Sheets:", freshTeamData)

        setTeam(freshTeamData)

        // Load students first, then populate form data
        await loadStudents(freshTeamData)

        // Populate form with fresh team data from Google Sheets
        setTeamName(freshTeamData.teamName)
        setProblemStatementId1(freshTeamData.problemStatementId1 || freshTeamData.problemStatementId || "")
        setProblemStatementId2(freshTeamData.problemStatementId2 || "")

        // Handle department data - could be comma-separated string or array
        const deptData = freshTeamData.deptNeeded || ""
        const deptArray = deptData ? deptData.split(", ").filter((d: string) => d.trim()) : []
        setDeptNeeded(deptArray)
        setNeedOtherDept(deptArray.length > 0)

        const leaderData = {
          regNo: freshTeamData.leader.regNo,
          github: freshTeamData.leader.github || "",
          projectLink: freshTeamData.leader.projectLink || ""
        }
        console.log("Setting leader data:", leaderData)
        setLeader(leaderData)

        // Populate members
        const newMembers = [...members]
        freshTeamData.members.forEach((member: any, index: number) => {
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

        setLoading(false)
      } catch (error) {
        console.error("Error loading fresh team data:", error)
        setError("Failed to load team data from server")
        setLoading(false)
      }
    }

    loadFreshTeamData()
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

      if (!problemStatementId1.trim()) {
        setError("Problem Statement ID 1 is required")
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
        problemStatementId1,
        problemStatementId2,
        deptNeeded: needOtherDept ? deptNeeded.join(", ") : "",
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
          problemStatementId1,
          problemStatementId2,
          deptNeeded: needOtherDept ? deptNeeded.join(", ") : "",
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

              {/* Problem Statement ID 1 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="problemStatementId1" className="block text-sm font-medium text-gray-700">
                    Problem Statement ID 1 <span className="text-red-500">*</span>
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
                  id="problemStatementId1"
                  value={problemStatementId1}
                  onChange={(e) => setProblemStatementId1(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter problem statement ID 1..."
                  required
                />
              </div>

              {/* Problem Statement ID 2 (Optional) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="problemStatementId2" className="block text-sm font-medium text-gray-700">
                    Problem Statement ID 2 <span className="text-gray-500">(Optional)</span>
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
                  id="problemStatementId2"
                  value={problemStatementId2}
                  onChange={(e) => setProblemStatementId2(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter problem statement ID 2 (optional)..."
                />
              </div>

              {/* Department Needed - Highlighted */}
              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
                <div className="mb-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={needOtherDept}
                      onChange={(e) => {
                        setNeedOtherDept(e.target.checked)
                        if (!e.target.checked) {
                          setDeptNeeded([])
                        }
                      }}
                      className="mr-3 h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-lg font-semibold text-gray-800">
                      🤝 Need other department members?
                    </span>
                  </label>
                  <p className="text-sm text-gray-600 mt-2 ml-8">
                    Check this if your team needs members from different departments for diverse skills
                  </p>
                </div>

                {needOtherDept && (
                  <div className="ml-8">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Select Departments Needed (Multiple allowed)
                    </label>
                    <div className="space-y-2">
                      {["CSE", "ECE", "EEE", "MECH", "Cyber Security"].map((dept) => (
                        <label key={dept} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={deptNeeded.includes(dept)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setDeptNeeded([...deptNeeded, dept])
                              } else {
                                setDeptNeeded(deptNeeded.filter(d => d !== dept))
                              }
                            }}
                            className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <span className="text-sm font-medium text-gray-700">{dept}</span>
                        </label>
                      ))}
                    </div>
                    {deptNeeded.length > 0 && (
                      <div className="mt-3 p-2 bg-blue-50 rounded-md">
                        <p className="text-sm text-blue-800">
                          <strong>Selected:</strong> {deptNeeded.join(", ")}
                        </p>
                      </div>
                    )}
                  </div>
                )}
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
