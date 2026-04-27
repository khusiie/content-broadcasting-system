# Content Broadcasting System API Documentation

Base URL for production: `https://content-broadcasting-system-b4wc.onrender.com`
Base URL for local development: `http://localhost:5000`

---

## Authentication Endpoints

### 1. User Registration
Register a new user (Principal or Teacher).

* **URL**: `/api/auth/register`
* **Method**: `POST`
* **Body Format**: JSON
* **Request Body**:
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "password": "securepassword123",
    "role": "teacher" // Must be "teacher" or "principal"
  }
  ```
* **Success Response** (`201 Created`):
  ```json
  {
    "message": "User registered successfully",
    "user": { "id": "uuid", "name": "John Doe", "email": "john@example.com", "role": "teacher" }
  }
  ```
* **Error Response** (`400 Bad Request` or `409 Conflict`):
  ```json
  { "error": "An account with this email already exists" }
  ```

### 2. User Login
Authenticate a user and receive a JWT token.

* **URL**: `/api/auth/login`
* **Method**: `POST`
* **Body Format**: JSON
* **Request Body**:
  ```json
  {
    "email": "john@example.com",
    "password": "securepassword123"
  }
  ```
* **Success Response** (`200 OK`):
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI...",
    "user": { "id": "uuid", "name": "John Doe", "role": "teacher" }
  }
  ```

---

## Content Endpoints (Teacher Only)
*All routes here require an Authorization header: `Authorization: Bearer <your_jwt_token>`*

### 3. Upload Content
Upload an image file along with scheduling details.

* **URL**: `/api/content/upload`
* **Method**: `POST`
* **Body Format**: `multipart/form-data`
* **Form Fields**:
  * `file`: The actual image file (JPG, PNG, GIF) - Max 10MB (Required)
  * `title`: String (Required)
  * `subject`: String (Required)
  * `description`: String (Optional)
  * `start_time`: ISO DateTime String (Optional)
  * `end_time`: ISO DateTime String (Optional)
  * `rotation_duration`: Number in seconds (Optional, defaults to 5)
* **Success Response** (`201 Created`):
  ```json
  {
    "message": "Content uploaded successfully and pending approval",
    "content": { /* Database object representation */ }
  }
  ```

### 4. Get My Content
Fetch all content uploaded by the authenticated teacher.

* **URL**: `/api/content/my-content`
* **Method**: `GET`
* **Success Response** (`200 OK`):
  ```json
  [
    { "id": "uuid", "title": "Math Lesson", "status": "pending", "file_url": "..." }
  ]
  ```

---

## Approval Endpoints (Principal Only)
*All routes here require an Authorization header: `Authorization: Bearer <your_jwt_token>`*

### 5. Get All Pending Content
Fetch all content currently awaiting approval.

* **URL**: `/api/approval/pending`
* **Method**: `GET`
* **Success Response** (`200 OK`): Array of content objects with a joined `users` object for the uploader's name.

### 6. Approve or Reject Content
Change the status of a specific content item.

* **URL**: `/api/approval/status/:contentId`
* **Method**: `POST`
* **Body Format**: JSON
* **Request Body (Approval)**:
  ```json
  {
    "status": "approved"
  }
  ```
* **Request Body (Rejection)**:
  ```json
  {
    "status": "rejected",
    "rejection_reason": "Image is blurry"
  }
  ```
* **Success Response** (`200 OK`):
  ```json
  {
    "message": "Content approved successfully",
    "content": { /* Updated object */ }
  }
  ```

### 7. Get All Content (With Filters & Pagination)
Fetch all content across the platform with optional filters.

* **URL**: `/api/approval/all`
* **Method**: `GET`
* **Query Parameters (Optional)**:
  * `page`: Number (Defaults to 1)
  * `limit`: Number (Defaults to 10)
  * `subject`: String
  * `teacherId`: UUID
  * `status`: "uploaded" | "pending" | "approved" | "rejected"
* **Success Response** (`200 OK`):
  ```json
  {
    "data": [ /* Array of content */ ],
    "pagination": { "page": 1, "limit": 10, "total": 50, "totalPages": 5 }
  }
  ```

---

## Public Live Endpoints
*These endpoints are public and do not require authentication.*

### 8. Get Live Broadcast Content
Fetch the currently active/scheduled content for a specific teacher.

* **URL**: `/api/public/live/:teacherId` (Also accessible at `/content/live/:teacherId`)
* **Method**: `GET`
* **Query Parameters (Optional)**:
  * `subject`: Filter live content by a specific subject.
* **Success Response** (`200 OK`):
  ```json
  [
    { "id": "uuid", "file_url": "...", "title": "...", "rotation_duration": 5 }
  ]
  ```
* **Empty/Not Found Response** (`200 OK`):
  ```json
  { "message": "No content available" }
  ```
