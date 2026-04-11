
# Syncare Frontend API Documentation

Welcome to the frontend API documentation for the **Syncare** backend. This document outlines the available endpoints, expected request structures, authentication mechanisms, and response formats to help you correctly integrate the frontend with this service.

---

## 🚀 Get Started

### Prerequisites

- **Node.js** v18 or higher : [nodejs.org](https://nodejs.org)
- **npm** v9 or higher (bundled with Node.js)

---

### 1. Clone the Repository

```bash
git clone https://github.com/KTD-11/Syncare-Backend
cd Syncare-Backend
```

---

### 2. Install Dependencies

Run the following command from the project root to install all required packages:

```bash
npm install
```

This will install the following production dependencies declared in `package.json`:

| Package | Version | Purpose |
|---|---|---|
| `express` | ^5.2.1 | Web framework for routing and handling HTTP requests |
| `jsonwebtoken` | ^9.0.3 | Signing and verifying JWT tokens for user authentication |
| `bcrypt` | ^6.0.0 | Hashing and comparing passwords securely |
| `sqlite3` | ^6.0.1 | Lightweight embedded SQL database driver |
| `dotenv` | ^17.3.1 | Loads environment variables from the `.env` file |
| `cors` | ^2.8.6 | Enables Cross-Origin Resource Sharing (CORS) for all origins |

---

### 3. Configure Environment Variables

Create a `.env` file in the project root. The server **will not start correctly** without these variables.

```bash
# .env
ADMIN_PASSWORD=
JWT_SECRET=
PORT=
```

| Variable | Required | Description |
|---|---|---|
| `ADMIN_PASSWORD` | ✅ Yes | A **bcrypt hash** of your chosen admin password. This is used to authenticate all `/admin/` endpoints. Generate one with `bcrypt.hash('yourpassword', 10)`. |
| `JWT_SECRET` | ✅ Yes | A long, random secret string used to sign and verify JWT tokens. Keep this private and never commit it. |
| `PORT` | ✅ Yes | The port the Express server will listen on (e.g. `3000`). |

> **⚠️ Security Warning:** `ADMIN_PASSWORD` must be stored as a **bcrypt hash**, not plaintext. The server compares incoming admin passwords against this hash at runtime.

**Example `.env`:**

```env
ADMIN_PASSWORD=$2a$10$XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
JWT_SECRET=some-long-random-secret-string-that-nobody-can-guess
PORT=3000
```

---

### 4. Run the Server

```bash
node index.js
```

The server will start and log:
```
Listening on port <PORT>
```

---

## 🔗 Base Details
* **Base URL**: `[TO BE ADDED LATER]`
* **Default Content-Type**: `application/json`

---

## 🌐 CORS Policy

This API uses the `cors` middleware with **default settings**, which means:

* **All origins are allowed** : any domain may make requests to this API.
* **All standard HTTP methods** are permitted (`GET`, `POST`, `PUT`, `DELETE`, etc.).
* No custom origin whitelist or credentials restrictions are enforced.

---

## 🔐 Authentication

This API uses **JSON Web Tokens (JWT)** for standard users.
For any endpoints that require authentication, you must include the token in your requests via the `Authorization` header:

```http
Authorization: Bearer <YOUR_JWT_TOKEN>
```
*Note: The token will expire after **2 hours**.*

**Authentication error responses (applies to all protected endpoints):**
* `401 Unauthorized`: `{ "status": 401, "message": "Missing token credentials" }` — No token was provided.
* `403 Forbidden`: `{ "status": 403, "message": "Invalid or expired token" }` — Token failed verification or has expired.

---

## 👤 Users & Authentication Endpoints

### 1. Register a new Patient
`POST /signup/`

Registers a new user and returns an authentication token immediately upon success.

**Request Body:**
```json
{
  "name": "John Doe",
  "age": 30,
  "gender": "M",
  "number": "0123456789",
  "gov_id": "29876543210987",
  "password": "supersecretpassword"
}
```

| Field | Type | Description |
|---|---|---|
| `name` | String | Full name of the patient |
| `age` | Integer | Patient age. Min: `0`, Max: `200` |
| `gender` | String | Single character — `"M"` or `"F"` (case-insensitive) |
| `number` | String | Contact phone number |
| `gov_id` | String | Exactly 14 characters. Must start with `2` or `3` and match gender rules |
| `password` | String | Minimum 10 characters |

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
* `204 No Content`

---

## 📅 Appointments

### 1. Book an Appointment
`POST /book/`

Schedules a new appointment. The scheduling engine validates whether the slot time is free inside the backend.

* **Headers Required:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "date": "15/05/2026",
  "time": "14:30",
  "type": "General Surgery"
}
```

| Field | Type | Description |
|---|---|---|
| `date` | String | Format: `DD/MM/YYYY`. Must be a future date |
| `time` | String | Format: `HH:MM` (24-hour clock) |
| `type` | String | Clinic type — see [Clinic Typings](#-important-clinic-typings) section below |
**Responses:**
* `201 Created`: `{ "status": 201, "message": "Appointment successfully booked at 14:30" }`
* `400 Bad Request`: Failed basic validation formats.

---

### 2. Fetch All Appointments
`GET /appointments/`

Fetches all appointments belonging to the authenticated user.

* **Headers Required:** `Authorization: Bearer <token>`
* **Request Body:** None required.

**Responses:**
* `200 OK`: 
```json
{
  "status": 200,
  "data": [
    {
      "appointment_id": 42,
      "appointment_date": "15/05/2026",
      "appointment_time": "14:30",
      "appointment_name": "General Surgery"
    }
  ]
}
```
* `404 Not Found`: `{ "status": 404, "message": "Not found" }` (User has no appointments)

---

### 3. Cancel an Appointment
`POST /cancel/`

Cancels either a single appointment or ALL appointments belonging to the user.

* **Headers Required:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "appointment_id": 42
}
```

| Field | Type | Description |
|---|---|---|
| `appointment_id` | Integer \| String | Required. The ID of the appointment to cancel. Pass `"*"` as a string to delete **all** appointments for this patient |

**Responses:**
* `200 OK`: `{ "status": 200, "message": "appointment deleted successfully" }`
* `400 Bad Request`: Passed invalid ID shapes.
* `404 Not Found`: Trying to delete an appointment that didn't exist or belonged to someone else.

---

## 🛡️ Admin Endpoints

Admin routes **do not** require a JWT Bearer token. Instead, they require the secure `ADMIN_PASSWORD` to be passed directly in the request body.

### 1. Fetch Patient Data
`POST /admin/users/`

Fetches user data for administrative oversight.

**Request Body:**
```json
{
  "password": "supersecretadminpassword",
  "id": 12
}
```

| Field | Type | Description |
|---|---|---|
| `password` | String | Required. The admin master password |
| `id` | Integer | The specific Patient ID to fetch. Pass `-1` to fetch **all** patients |

> **Wildcard:** Setting `id` to `-1` returns every patient in the database.

**Responses:**
* `200 OK`: `{ "status": 200, "data": [ ...patient details... ] }`
* `400 Bad Request`: `{ "status": 400, "message": "Invalid ID" }` (Non-numeric ID)
* `401 Unauthorized`: `{ "status": 401, "message": "Invalid credentials" }` (Wrong admin password)
* `404 Not Found`: `{ "status": 404, "message": "No users found in the database" }` (Empty result)

---

### 2. Fetch Appointment Data
`POST /admin/appointments/`

Fetches specific appointment data for administrative oversight.

**Request Body:**
```json
{
  "password": "supersecretadminpassword",
  "patient_id": 12,
  "appointment_id": 42
}
```

| Field | Type | Description |
|---|---|---|
| `password` | String | Required. The admin master password |
| `patient_id` | Integer | The patient the appointment belongs to. Set to `0` to mark as "not specified" |
| `appointment_id` | Integer | The specific appointment ID. Set to `0` to mark as "not specified" |

> **⚠️ ID Precedence Note:** `appointment_id` takes **precedence** over `patient_id`. If `appointment_id` is provided (non-zero), the server will look up by appointment only and will **ignore** `patient_id` entirely. Either field can be set to `0` to mark it as "not specified", but **both cannot be `0` simultaneously** (at least one must be set).

> **Wildcard:** Setting either `appointment_id` or `patient_id` to `-1` returns **all appointments** in the database, ignoring the other field.

**Responses:**
* `200 OK`: `{ "status": 200, "data": [ ...appointment details... ] }`
* `400 Bad Request`: `{ "status": 400, "message": "Invalid ID" }` (Non-numeric ID)
* `401 Unauthorized`: `{ "status": 401, "message": "Invalid credentials" }` (Wrong admin password)
* `404 Not Found`: `{ "status": 404, "message": "No patient or appointment was selected" }` (Both IDs were `0`)
* `404 Not Found`: `{ "status": 404, "message": "No appointments were found" }` (Valid query returned empty results)

---

## 📋 Important Clinic Typings

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
