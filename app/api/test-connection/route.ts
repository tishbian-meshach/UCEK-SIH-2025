import { NextResponse } from "next/server"
import { GoogleSpreadsheet } from "google-spreadsheet"
import { JWT } from "google-auth-library"

export async function GET() {
  try {
    console.log("Testing Google Sheets connection...")
    
    // Check environment variables
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL) {
      return NextResponse.json({ 
        error: "GOOGLE_SERVICE_ACCOUNT_EMAIL not set" 
      }, { status: 500 })
    }
    
    if (!process.env.GOOGLE_PRIVATE_KEY) {
      return NextResponse.json({ 
        error: "GOOGLE_PRIVATE_KEY not set" 
      }, { status: 500 })
    }
    
    if (!process.env.SPREADSHEET_ID) {
      return NextResponse.json({ 
        error: "SPREADSHEET_ID not set" 
      }, { status: 500 })
    }

    // Create service account auth
    const serviceAccountAuth = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    })

    // Create spreadsheet instance
    const doc = new GoogleSpreadsheet(process.env.SPREADSHEET_ID, serviceAccountAuth)
    
    // Try to load spreadsheet info
    await doc.loadInfo()
    
    // Get sheet names
    const sheetNames = Object.keys(doc.sheetsByTitle)
    
    return NextResponse.json({
      success: true,
      message: "Successfully connected to Google Sheets",
      spreadsheetTitle: doc.title,
      sheetNames,
      serviceAccountEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      spreadsheetId: process.env.SPREADSHEET_ID
    })
    
  } catch (error) {
    console.error("Google Sheets connection test failed:", error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      message: "Failed to connect to Google Sheets. Make sure the service account has access to the spreadsheet."
    }, { status: 500 })
  }
}
