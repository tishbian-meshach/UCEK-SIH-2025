# API Documentation

Complete API reference for the Team Formation App.

## Base URL

- Development: `http://localhost:3000`
- Production: `https://your-app.vercel.app`

## Authentication

All API endpoints use Google Service Account authentication configured via environment variables. No additional authentication is required for API calls.

## Students API

### Get All Students

Get a list of students with optional filtering.

**Endpoint:** `GET /api/students`

**Query Parameters:**
- `dept` (optional): Filter by department (CS, IT, ECE, etc.)
- `year` (optional): Filter by academic year (1, 2, 3, 4)

**Example Request:**
\`\`\`bash
curl "http://localhost:3000/api/students?dept=CS&year=3"
\`\`\`

**Response:**
\`\`\`json
[
  {
    "regNo": "REG001",
    "fullName": "John Doe",
    "email": "john.doe@uni.edu",
    "dept": "CS",
    "year": "3",
    "status": "Available",
    "assignedTeamId": "",
    "createdAt": "2024-01-01T00:00:00Z"
  },
  {
    "regNo": "REG002",
    "fullName": "Jane Smith",
    "email": "jane.smith@uni.edu",
    "dept": "CS",
    "year": "3",
    "status": "Assigned",
    "assignedTeamId": "team-123",
    "createdAt": "2024-01-01T00:00:00Z"
  }
]
\`\`\`

### Get Available Students

Get only students with "Available" status.

**Endpoint:** `GET /api/students/available`

**Query Parameters:**
- `dept` (optional): Filter by department
- `year` (optional): Filter by academic year

**Example Request:**
\`\`\`bash
curl "http://localhost:3000/api/students/available?dept=CS"
\`\`\`

**Response:** Same format as above, but only includes students with `status: "Available"`

### Get Student by Registration Number

Get details of a specific student.

**Endpoint:** `GET /api/students/[regNo]`

**Example Request:**
\`\`\`bash
curl "http://localhost:3000/api/students/REG001"
\`\`\`

**Response:**
\`\`\`json
{
  "regNo": "REG001",
  "fullName": "John Doe",
  "email": "john.doe@uni.edu",
  "dept": "CS",
  "year": "3",
  "status": "Available",
  "assignedTeamId": "",
  "createdAt": "2024-01-01T00:00:00Z"
}
\`\`\`

**Error Response (404):**
\`\`\`json
{
  "message": "Student not found"
}
\`\`\`

### Check Student Availability

Quick check if a student is available for team assignment.

**Endpoint:** `GET /api/check-availability`

**Query Parameters:**
- `regNo` (required): Student registration number

**Example Request:**
\`\`\`bash
curl "http://localhost:3000/api/check-availability?regNo=REG001"
\`\`\`

**Response:**
\`\`\`json
{
  "regNo": "REG001",
  "available": true
}
\`\`\`

## Teams API

### Create Team

Create a new team with leader and members.

**Endpoint:** `POST /api/teams`

**Request Body:**
\`\`\`json
{
  "teamName": "Team Rocket",
  "leader": {
    "regNo": "REG001",
    "github": "https://github.com/john",
    "projectLink": "https://project.com"
  },
  "members": [
    {
      "regNo": "REG002",
      "github": "https://github.com/jane",
      "projectLink": "https://project2.com"
    },
    {
      "regNo": "REG003",
      "github": "https://github.com/bob",
      "projectLink": "https://project3.com"
    }
  ],
  "createdBy": "admin@uni.edu"
}
\`\`\`

**Validation Rules:**
- `teamName`: Required, 1-100 characters
- `leader.regNo`: Required
- `leader.github`: Optional, must be valid GitHub URL
- `leader.projectLink`: Optional, must be valid URL
- `members`: Array of 0-5 members (total team size 3-6 including leader)
- No duplicate registration numbers allowed

**Success Response (201):**
\`\`\`json
{
  "ok": true,
  "teamId": "550e8400-e29b-41d4-a716-446655440000",
  "message": "Team created successfully"
}
\`\`\`

**Validation Error Response (400):**
\`\`\`json
{
  "ok": false,
  "message": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": [
    "Team name is required",
    "Team must have at least 3 members (including leader)"
  ]
}
\`\`\`

**Conflict Response (409):**
\`\`\`json
{
  "ok": false,
  "message": "Some students are already assigned to other teams",
  "code": "CONFLICT_ERROR",
  "conflicts": ["REG002", "REG003"]
}
\`\`\`

**Server Error Response (500):**
\`\`\`json
{
  "ok": false,
  "message": "Failed to create team",
  "code": "INTERNAL_ERROR"
}
\`\`\`

### Get Team Details

Retrieve details of a specific team.

**Endpoint:** `GET /api/teams/[teamId]`

**Example Request:**
\`\`\`bash
curl "http://localhost:3000/api/teams/550e8400-e29b-41d4-a716-446655440000"
\`\`\`

**Response:**
\`\`\`json
{
  "teamId": "550e8400-e29b-41d4-a716-446655440000",
  "teamName": "Team Rocket",
  "createdAt": "2024-01-15T10:30:00Z",
  "leader": {
    "name": "John Doe",
    "regNo": "REG001",
    "email": "john.doe@uni.edu",
    "dept": "CS",
    "year": "3",
    "github": "https://github.com/john",
    "projectLink": "https://project.com"
  },
  "members": [
    {
      "name": "Jane Smith",
      "regNo": "REG002",
      "email": "jane.smith@uni.edu",
      "dept": "CS",
      "year": "3",
      "github": "https://github.com/jane",
      "projectLink": "https://project2.com"
    }
  ]
}
\`\`\`

**Error Response (404):**
\`\`\`json
{
  "message": "Team not found"
}
\`\`\`

## Error Handling

### HTTP Status Codes

- `200` - Success
- `201` - Created (for team creation)
- `400` - Bad Request (validation errors)
- `404` - Not Found
- `405` - Method Not Allowed
- `409` - Conflict (student already assigned)
- `500` - Internal Server Error

### Error Response Format

All error responses follow this format:

\`\`\`json
{
  "ok": false,
  "message": "Human-readable error message",
  "code": "ERROR_CODE",
  "details": "Additional error details (optional)"
}
\`\`\`

### Common Error Codes

- `VALIDATION_ERROR` - Request validation failed
- `CONFLICT_ERROR` - Resource conflict (student already assigned)
- `NOT_FOUND_ERROR` - Resource not found
- `DATABASE_ERROR` - Google Sheets operation failed
- `INTERNAL_ERROR` - Unexpected server error

## Rate Limits

### Google Sheets API Limits

- **Read requests**: 300 per minute per project
- **Write requests**: 300 per minute per project
- **Concurrent requests**: 10 per project

### Handling Rate Limits

The API implements automatic retry with exponential backoff for rate limit errors. If you encounter rate limit issues:

1. Reduce request frequency
2. Implement client-side caching
3. Use batch operations where possible

## Data Models

### Student Model

\`\`\`typescript
interface Student {
  regNo: string          // Unique registration number
  fullName: string       // Student's full name
  email: string          // Student's email address
  dept: string           // Department code (CS, IT, ECE, etc.)
  year: string           // Academic year (1, 2, 3, 4)
  status: "Available" | "Assigned"  // Availability status
  assignedTeamId: string // Team ID if assigned (empty if available)
  createdAt?: string     // ISO timestamp
}
\`\`\`

### Team Model

\`\`\`typescript
interface Team {
  teamId: string         // Unique team identifier (UUID)
  teamName: string       // Team name
  leader: TeamMember     // Team leader details
  members: TeamMember[]  // Array of team members
  createdAt: string      // ISO timestamp
}

interface TeamMember extends Student {
  github: string         // GitHub profile URL
  projectLink: string    // Project demonstration URL
}
\`\`\`

### Create Team Request

\`\`\`typescript
interface CreateTeamRequest {
  teamName: string       // Team name (1-100 characters)
  leader: Member         // Leader information
  members: Member[]      // Array of members (0-5 items)
  createdBy?: string     // Optional creator identifier
}

interface Member {
  regNo: string          // Registration number
  github: string         // GitHub URL (optional)
  projectLink: string    // Project URL (optional)
}
\`\`\`

## Examples

### JavaScript/TypeScript Client

\`\`\`typescript
class TeamFormationAPI {
  constructor(private baseUrl: string) {}

  async getStudents(filters?: { dept?: string; year?: string }) {
    const params = new URLSearchParams(filters)
    const response = await fetch(`${this.baseUrl}/api/students?${params}`)
    return response.json()
  }

  async createTeam(teamData: CreateTeamRequest) {
    const response = await fetch(`${this.baseUrl}/api/teams`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(teamData)
    })
    return response.json()
  }

  async getTeam(teamId: string) {
    const response = await fetch(`${this.baseUrl}/api/teams/${teamId}`)
    return response.json()
  }
}

// Usage
const api = new TeamFormationAPI('http://localhost:3000')

// Get CS students in year 3
const students = await api.getStudents({ dept: 'CS', year: '3' })

// Create a team
const result = await api.createTeam({
  teamName: 'My Team',
  leader: { regNo: 'REG001', github: '', projectLink: '' },
  members: [
    { regNo: 'REG002', github: '', projectLink: '' }
  ]
})
\`\`\`

### Python Client

\`\`\`python
import requests
import json

class TeamFormationAPI:
    def __init__(self, base_url):
        self.base_url = base_url
    
    def get_students(self, dept=None, year=None):
        params = {}
        if dept:
            params['dept'] = dept
        if year:
            params['year'] = year
        
        response = requests.get(f"{self.base_url}/api/students", params=params)
        return response.json()
    
    def create_team(self, team_data):
        response = requests.post(
            f"{self.base_url}/api/teams",
            headers={'Content-Type': 'application/json'},
            data=json.dumps(team_data)
        )
        return response.json()

# Usage
api = TeamFormationAPI('http://localhost:3000')

# Get available CS students
students = api.get_students(dept='CS')

# Create team
result = api.create_team({
    'teamName': 'Python Team',
    'leader': {'regNo': 'REG001', 'github': '', 'projectLink': ''},
    'members': [{'regNo': 'REG002', 'github': '', 'projectLink': ''}]
})
\`\`\`

## Testing

### Manual API Testing

Use curl or Postman to test endpoints:

\`\`\`bash
# Test student endpoint
curl -X GET "http://localhost:3000/api/students?dept=CS"

# Test team creation
curl -X POST "http://localhost:3000/api/teams" \
  -H "Content-Type: application/json" \
  -d '{
    "teamName": "Test Team",
    "leader": {"regNo": "REG001", "github": "", "projectLink": ""},
    "members": [{"regNo": "REG002", "github": "", "projectLink": ""}]
  }'
\`\`\`

### Automated Testing

Example Jest test:

\`\`\`typescript
describe('Teams API', () => {
  test('should create team successfully', async () => {
    const teamData = {
      teamName: 'Test Team',
      leader: { regNo: 'REG001', github: '', projectLink: '' },
      members: [{ regNo: 'REG002', github: '', projectLink: '' }]
    }

    const response = await fetch('/api/teams', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(teamData)
    })

    const result = await response.json()
    expect(result.ok).toBe(true)
    expect(result.teamId).toBeDefined()
  })
})
