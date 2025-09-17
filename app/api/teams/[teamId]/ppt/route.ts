import { NextRequest, NextResponse } from "next/server"
import { getTeamById, updateTeamPPTLinks } from "@/lib/sheets"

export async function PUT(
  request: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    const { pptLink1, pptLink2 } = await request.json()

    // Validate PDF links - must be drive.google only, end with .pdf, and be publicly accessible
    const validatePDFLink = async (link: string) => {
      if (!link) return { valid: true, message: "" } // Empty links are allowed

      const isValidDomain = link.includes('drive.google.com')
      const hasSharingParam = link.includes('usp=sharing')

      if (!isValidDomain) {
        return { valid: false, message: "PDF Link must be a Google Drive link" }
      }


      if (!hasSharingParam) {
        return { valid: false, message: "PDF Link must include sharing parameter (usp=sharing). Please enable sharing on your Google Drive file." }
      }

      // Check if the link is publicly accessible with retry logic
      const checkLinkAccessibility = async (retryCount = 0): Promise<{ accessible: boolean; error?: string }> => {
        try {
          const response = await fetch(link, {
            method: 'HEAD',
            headers: {
              'User-Agent': 'Mozilla/5.0 (compatible; TeamFormationApp/1.0)'
            },
            // Add timeout to prevent hanging
            signal: AbortSignal.timeout(5000) // 5 second timeout
          })

          if (response.ok) {
            return { accessible: true }
          } else if (response.status === 429) {
            // Rate limited - wait and retry
            if (retryCount < 2) {
              await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)))
              return checkLinkAccessibility(retryCount + 1)
            }
            return { accessible: false, error: "Rate limited while checking link accessibility" }
          } else {
            return { accessible: false, error: `Link returned status ${response.status}` }
          }
        } catch (error) {
          if (error instanceof Error && error.name === 'TimeoutError') {
            return { accessible: false, error: "Link check timed out" }
          }
          // For network errors, retry once
          if (retryCount < 1) {
            await new Promise(resolve => setTimeout(resolve, 1000))
            return checkLinkAccessibility(retryCount + 1)
          }
          return { accessible: false, error: "Network error while checking link" }
        }
      }

      const linkCheck = await checkLinkAccessibility()

      if (!linkCheck.accessible) {
        return {
          valid: false,
          message: `PDF link is not publicly accessible. ${linkCheck.error || 'Please enable sharing on your Google Drive file.'}`
        }
      }

      return { valid: true, message: "" }
    }

    // Validate PDF Link 1
    if (pptLink1) {
      const validation1 = await validatePDFLink(pptLink1)
      if (!validation1.valid) {
        return NextResponse.json({
          ok: false,
          message: validation1.message
        }, { status: 400 })
      }
    }

    // Validate PDF Link 2
    if (pptLink2) {
      const validation2 = await validatePDFLink(pptLink2)
      if (!validation2.valid) {
        return NextResponse.json({
          ok: false,
          message: validation2.message
        }, { status: 400 })
      }
    }

    // Get current team to validate problem statement IDs
    const team = await getTeamById(params.teamId)
    if (!team) {
      return NextResponse.json({
        ok: false,
        message: "Team not found"
      }, { status: 404 })
    }

    // Validate that we don't submit PDF links for non-existent problem statements
    if (pptLink1 && !team.problemStatementId1) {
      return NextResponse.json({
        ok: false,
        message: "Cannot submit PDF Link 1 without Problem Statement ID 1"
      }, { status: 400 })
    }

    if (pptLink2 && !team.problemStatementId2) {
      return NextResponse.json({
        ok: false,
        message: "Cannot submit PDF Link 2 without Problem Statement ID 2"
      }, { status: 400 })
    }

    // Update PDF links
    const success = await updateTeamPPTLinks(params.teamId, pptLink1 || "", pptLink2 || "")

    if (success) {
      return NextResponse.json({
        ok: true,
        message: "PDF links updated successfully"
      })
    } else {
      return NextResponse.json({
        ok: false,
        message: "Failed to update PDF links"
      }, { status: 500 })
    }
  } catch (error) {
    console.error("Error updating PDF links:", error)
    return NextResponse.json({
      ok: false,
      message: "Internal server error"
    }, { status: 500 })
  }
}