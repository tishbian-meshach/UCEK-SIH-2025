import { NextRequest, NextResponse } from "next/server"
import { acceptJoinRequest } from "@/lib/sheets"

interface AcceptRequestResponse {
  ok: boolean
  message: string
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { requestId: string } }
) {
  try {
    const { requestId } = params

    if (!requestId) {
      return NextResponse.json<AcceptRequestResponse>({
        ok: false,
        message: "Request ID is required"
      }, { status: 400 })
    }

    // Accept the join request
    const success = await acceptJoinRequest(requestId)

    if (!success) {
      return NextResponse.json<AcceptRequestResponse>({
        ok: false,
        message: "Failed to accept request. Request may not exist or team may be full."
      }, { status: 400 })
    }

    return NextResponse.json<AcceptRequestResponse>({
      ok: true,
      message: "Request accepted successfully. Student has been added to the team."
    })

  } catch (error) {
    console.error("Error accepting request:", error)
    return NextResponse.json<AcceptRequestResponse>({
      ok: false,
      message: "Internal server error"
    }, { status: 500 })
  }
}
