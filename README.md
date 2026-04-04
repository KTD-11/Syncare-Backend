# Orchestrator Frontend API Documentation

Welcome to the frontend API documentation for the **Orchestrator** backend. This document outlines the available endpoints, expected request structures, authentication mechanisms, and response formats to help you correctly integrate the frontend with this service.

##  Base Details
* **Base URL**: `http://localhost:2002` (Local development)
* **Default Content-Type**: `application/json`

---

##  Authentication

This API uses **JSON Web Tokens (JWT)**.
For any endpoints that require authentication, you must include the token in your requests via the `Authorization` header:

```http
Authorization: Bearer <YOUR_JWT_TOKEN>
```
*Note: The token will expire after **2 hours**.*

---

##  ️ Users & Authentication Endpoints

### 1. Register a new Patient
`POST /signup/`

Registers a new user and returns an authentication token immediately upon success.

**Request Body:**
```json
{
  "name": "John Doe",
  "age": 30, // Integer (Max: 200, Min: 0)
  "gender": "M", // Single character "M" or "F" (case-insensitive)
  "number": "0123456789", // String
  "gov_id": "29876543210987", // String, Exactly 14 chars. Must start with 2 or 3 and match gender rules.
  "password": "supersecretpassword" // String, Min 10 characters
}
```

**Responses:**
* `201 Created`: `{ "status": 201, "message": "user with id X has been successfully added", "id": X, "token": "..." }`
* `400 Bad Request`: `{ "status": 400, "message": "Missing data-fields..." }` (Failed validation)
* `409 Conflict`: `{ "status": 409, "message": "User was found" }` (Gov ID taken)

---

### 2. Sign In
`POST /signin/`

Authenticates a user and returns their initial data and JWT payload.

**Request Body:**
```json
{
  "gov_id": "29876543210987",
  "password": "supersecretpassword"
}
```

**Responses:**
* `200 OK`: `{ "status": 200, "data": { "patient_id": X, "patient_name": "...", "patient_gender": "..." }, "token": "..." }`
* `401 Unauthorized`: `{ "status": 401, "message": "Invalid Credentials" }`

---

### 3. Delete Account
`DELETE /remove/`

Deletes the currently authenticated user based on their JWT token payload.

* **Headers Required:** `Authorization: Bearer <token>`
* **Request Body:** None required.

**Responses:**
* `204 No Content`: `{ "status": 204, "message": "user deleted successfully" }`

---

##  Appointments

### 1. Book an Appointment
`POST /book/`

Schedules a new appointment. The scheduling engine validates whether the slot time is free inside the backend.

* **Headers Required:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "date": "15/05/2026", // String format: DD/MM/YYYY (Must be a future date)
  "time": "14:30", // String format: HH:MM (24-hour)
  "type": "General Surgery" // String (See "Clinic Typings" section below)
}
```
**Responses:**
* `201 Created`: `{ "status": 201, "message": "Appointment successfully booked at 14:30" }`
* `400 Bad Request`: Failed basic validation formats.

---

### 2. Fetch a Single Appointment
`GET /appointments/:id/`

Fetches details of a specific appointment. The appointment must belong to the authenticated user.

* **Headers Required:** `Authorization: Bearer <token>`
* **URL Params:** `id` (integer) - The appointment ID (e.g. `/appointments/42/`)

**Responses:**
* `200 OK`: 
```json
{
  "status": 200,
  "data": {
     "appointment_id": 42,
     "appointment_date": "15/05/2026",
     "appointment_time": "14:30",
     "appointment_type": "General Surgery"
  }
}
```
* `404 Not Found`: `{ "status": 404, "message": "Not found" }`

---

### 3. Cancel an Appointment
`POST /cancel/`

Cancels either a single appointment or ALL appointments belonging to the user.

* **Headers Required:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "patient_id": 12, // Required
  "appointment_id": 42 // Required. (You can pass "*" as a string to delete ALL appointments for this patient)
}
```

**Responses:**
* `200 OK`: `{ "status": 200, "message": "appointment deleted successfully" }`
* `400 Bad Request`: Passed invalid ID shapes.
* `404 Not Found`: Trying to delete an appointment that didn't exist or belonged to someone else.

---

## ⚙️ Important Clinic Typings

When making a request to `POST /book/`, your frontend dropdowns or selectors *must* submit the exact strings listed below for the `type` field. These map to the backend's `AVG_CLINIC_WAITING_TIME` durations:

* `"Adult General Medicine"`
* `"General Surgery"`
* `"Women's Health"`
* `"Children's Health"`
* `"Heart Clinic"`
* `"Eye Clinic"`
* `"Bones and Joints"`
* `"Brain and Nerves"`
* `"Skin Clinic"`
* `"Cancer Care"`
* `"Ear, Nose, and Throat"`
