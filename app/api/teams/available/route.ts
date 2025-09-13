import { NextRequest, NextResponse } from "next/server"
import { getAllTeamsWithVacancies, getStudentRequestsStatus } from "@/lib/sheets"
import type { AvailableTeam } from "@/lib/types"

interface AvailableTeamsResponse {
  ok: boolean
  message: string
  teams?: AvailableTeam[]
  requestsStatus?: {[teamId: string]: boolean}
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const studentRegNo = searchParams.get('studentRegNo')

    // Get all teams with available slots
    const teams = await getAllTeamsWithVacancies()

    let requestsStatus: {[teamId: string]: boolean} = {}

    // If student reg no is provided, get their request status
    if (studentRegNo) {
      requestsStatus = await getStudentRequestsStatus(studentRegNo)
    }

    return NextResponse.json<AvailableTeamsResponse>({
      ok: true,
      message: "Available teams retrieved successfully",
      teams: teams,
      requestsStatus: requestsStatus
    })

  } catch (error) {
    console.error("Error getting available teams:", error)
    return NextResponse.json<AvailableTeamsResponse>({
      ok: false,
      message: "Internal server error"
    }, { status: 500 })
  }
}
