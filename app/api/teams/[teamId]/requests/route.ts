import { NextRequest, NextResponse } from "next/server"
import { getRequestsForTeam } from "@/lib/sheets"
import type { JoinRequest } from "@/lib/types"

interface GetRequestsResponse {
  ok: boolean
  message: string
  requests?: JoinRequest[]
}

export async function GET(
  request: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    const { teamId } = params

    if (!teamId) {
      return NextResponse.json<GetRequestsResponse>({
        ok: false,
        message: "Team ID is required"
      }, { status: 400 })
    }

    // Get requests for the team
    const requests = await getRequestsForTeam(teamId)

    return NextResponse.json<GetRequestsResponse>({
      ok: true,
      message: "Requests retrieved successfully",
      requests: requests
    })

  } catch (error) {
    console.error("Error getting requests for team:", error)
    return NextResponse.json<GetRequestsResponse>({
      ok: false,
      message: "Internal server error"
    }, { status: 500 })
  }
}
