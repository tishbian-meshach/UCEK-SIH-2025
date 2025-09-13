import { NextRequest, NextResponse } from "next/server"
import { hasStudentRequestedTeam } from "@/lib/sheets"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const studentRegNo = searchParams.get('studentRegNo')
    const teamId = searchParams.get('teamId')

    if (!studentRegNo || !teamId) {
      return NextResponse.json({
        ok: false,
        message: "Both studentRegNo and teamId are required"
      }, { status: 400 })
    }

    const hasRequested = await hasStudentRequestedTeam(studentRegNo, teamId)

    return NextResponse.json({
      ok: true,
      studentRegNo,
      teamId,
      hasRequested,
      message: hasRequested ? "Student has requested this team" : "Student has not requested this team"
    })

  } catch (error) {
    console.error("Error checking request:", error)
    return NextResponse.json({
      ok: false,
      message: "Internal server error"
    }, { status: 500 })
  }
}
