import { NextRequest, NextResponse } from "next/server"
import { rejectJoinRequest } from "@/lib/sheets"

interface RejectRequestResponse {
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
      return NextResponse.json<RejectRequestResponse>({
        ok: false,
        message: "Request ID is required"
      }, { status: 400 })
    }

    // Reject the join request
    const success = await rejectJoinRequest(requestId)

    if (!success) {
      return NextResponse.json<RejectRequestResponse>({
        ok: false,
        message: "Failed to reject request. Request may not exist."
      }, { status: 400 })
    }

    return NextResponse.json<RejectRequestResponse>({
      ok: true,
      message: "Request rejected successfully."
    })

  } catch (error) {
    console.error("Error rejecting request:", error)
    return NextResponse.json<RejectRequestResponse>({
      ok: false,
      message: "Internal server error"
    }, { status: 500 })
  }
}
