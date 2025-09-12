import { NextRequest, NextResponse } from "next/server"
import { updateTeam } from "@/lib/sheets"

interface UpdateTeamRequest {
  teamName: string
  problemStatementId1: string
  problemStatementId2?: string
  deptNeeded?: string
  leader: {
    regNo: string
    github: string
    projectLink: string
  }
  members: Array<{
    regNo: string
    github: string
    projectLink: string
  }>
}

interface UpdateTeamResponse {
  ok: boolean
  message: string
  team?: any
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    const teamId = params.teamId
    const body: UpdateTeamRequest = await request.json()
    const { teamName, problemStatementId1, problemStatementId2, deptNeeded, leader, members } = body

    // Validation
    if (!teamName || !problemStatementId1 || !leader.regNo) {
      return NextResponse.json<UpdateTeamResponse>({
        ok: false,
        message: "Team name, problem statement ID 1, and team leader are required"
      }, { status: 400 })
    }

    // Validate minimum team size (leader + at least 3 members)
    const validMembers = members.filter(m => m.regNo)
    if (validMembers.length < 3) {
      return NextResponse.json<UpdateTeamResponse>({
        ok: false,
        message: "Team must have at least 3 members plus the leader"
      }, { status: 400 })
    }

    // Update team in Google Sheets
    const updatedTeam = await updateTeam(teamId, {
      teamName,
      problemStatementId1,
      problemStatementId2,
      deptNeeded,
      leader,
      members: validMembers
    })

    if (!updatedTeam) {
      return NextResponse.json<UpdateTeamResponse>({
        ok: false,
        message: "Team not found or failed to update"
      }, { status: 404 })
    }

    return NextResponse.json<UpdateTeamResponse>({
      ok: true,
      message: "Team updated successfully",
      team: updatedTeam
    })

  } catch (error) {
    console.error("Error updating team:", error)
    return NextResponse.json<UpdateTeamResponse>({
      ok: false,
      message: "Internal server error"
    }, { status: 500 })
  }
}
