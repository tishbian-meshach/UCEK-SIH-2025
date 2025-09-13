import { NextRequest, NextResponse } from "next/server"
import { getStudentRequestsStatus } from "@/lib/sheets"

interface GetStudentRequestsResponse {
  ok: boolean
  message: string
  requestsStatus?: {[teamId: string]: boolean}
}

export async function GET(
  request: NextRequest,
  { params }: { params: { regNo: string } }
) {
  try {
    const { regNo } = params

    if (!regNo) {
      return NextResponse.json<GetStudentRequestsResponse>({
        ok: false,
        message: "Registration number is required"
      }, { status: 400 })
    }

    // Get student's request status for all teams
    const requestsStatus = await getStudentRequestsStatus(regNo)

    return NextResponse.json<GetStudentRequestsResponse>({
      ok: true,
      message: "Student requests status retrieved successfully",
      requestsStatus: requestsStatus
    })

  } catch (error) {
    console.error("Error getting student requests status:", error)
    return NextResponse.json<GetStudentRequestsResponse>({
      ok: false,
      message: "Internal server error"
    }, { status: 500 })
  }
}
