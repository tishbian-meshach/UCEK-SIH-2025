import { NextRequest, NextResponse } from "next/server"
import { createTeam } from "@/lib/sheets"
import { CreateTeamSchema } from "@/lib/validation"
import { validateTeamRequest } from "@/lib/validation-utils"
import type { CreateTeamRequest, CreateTeamResponse } from "@/lib/types"

export async function POST(request: NextRequest) {
  try {
    const body: CreateTeamRequest = await request.json()

    // Validate request body with Zod schema
    const schemaValidation = CreateTeamSchema.safeParse(body)
    if (!schemaValidation.success) {
      return NextResponse.json(
        {
          ok: false,
          message: "Validation failed",
          code: "VALIDATION_ERROR",
          details: schemaValidation.error.errors.map(err => err.message)
        } as CreateTeamResponse,
        { status: 400 }
      )
    }

    // Additional business logic validation
    const businessValidation = validateTeamRequest(body)
    if (!businessValidation.isValid) {
      return NextResponse.json(
        {
          ok: false,
          message: "Team validation failed",
          code: "BUSINESS_VALIDATION_ERROR",
          details: businessValidation.errors
        } as CreateTeamResponse,
        { status: 400 }
      )
    }

    // Create the team
    const result = await createTeam(body)

    if (result.conflicts.length > 0) {
      return NextResponse.json(
        {
          ok: false,
          message: "Some students are already assigned to other teams",
          code: "CONFLICT_ERROR",
          conflicts: result.conflicts
        } as CreateTeamResponse,
        { status: 409 }
      )
    }

    return NextResponse.json(
      {
        ok: true,
        teamId: result.teamId,
        message: "Team created successfully"
      } as CreateTeamResponse,
      { status: 201 }
    )

  } catch (error) {
    console.error("Error creating team:", error)
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes("not found")) {
        return NextResponse.json(
          {
            ok: false,
            message: error.message,
            code: "STUDENT_NOT_FOUND"
          } as CreateTeamResponse,
          { status: 404 }
        )
      }
      
      if (error.message.includes("Duplicate students")) {
        return NextResponse.json(
          {
            ok: false,
            message: error.message,
            code: "DUPLICATE_STUDENTS"
          } as CreateTeamResponse,
          { status: 400 }
        )
      }
    }

    return NextResponse.json(
      {
        ok: false,
        message: "Internal server error",
        code: "INTERNAL_ERROR"
      } as CreateTeamResponse,
      { status: 500 }
    )
  }
}
