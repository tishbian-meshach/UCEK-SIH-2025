import { NextRequest, NextResponse } from "next/server"
import { getTeamById } from "@/lib/sheets"

interface GetTeamResponse {
  ok: boolean
  message: string
  team?: any
}

export async function GET(
  request: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    const teamId = params.teamId

    if (!teamId) {
      return NextResponse.json<GetTeamResponse>({
        ok: false,
        message: "Team ID is required"
      }, { status: 400 })
    }

    // Get team data from Google Sheets
    const team = await getTeamById(teamId)

    if (!team) {
      return NextResponse.json<GetTeamResponse>({
        ok: false,
        message: "Team not found"
      }, { status: 404 })
    }

    return NextResponse.json<GetTeamResponse>({
      ok: true,
      message: "Team retrieved successfully",
      team: team
    })

  } catch (error) {
    console.error("Error getting team:", error)
    return NextResponse.json<GetTeamResponse>({
      ok: false,
      message: "Internal server error"
    }, { status: 500 })
  }
}
