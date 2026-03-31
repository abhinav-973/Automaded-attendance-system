# Automated Attendance System

## 1. Project Overview

The Automated Attendance System is a full-stack classroom attendance platform designed to reduce manual attendance work and improve accuracy through face-based recognition. The system allows administrators to upload teacher and student data, enables teachers to manage class rosters, and supports attendance marking from classroom images. Once attendance is processed, the system stores the results and generates a downloadable CSV report.

This project combines a modern web interface with a backend API and a separate computer-vision service. The frontend provides a clean workflow for login, dashboard access, attendance capture, history review, and admin uploads. The backend handles authentication, authorization, business logic, database operations, and report generation. A Python-based face-recognition service performs the actual student recognition from classroom images.

## 2. Problem Statement

Traditional attendance systems are time-consuming, error-prone, and difficult to scale in classrooms with many students. Manual roll calls reduce teaching time and create administrative overhead. In addition, maintaining attendance records and reports manually can lead to inconsistencies.

The goal of this project is to automate attendance collection by using facial recognition and a structured data-management workflow so that attendance can be taken quickly, stored safely, and exported in a usable format.

## 3. Objectives

- Automate classroom attendance using image-based face recognition.
- Provide secure login and role-based access for teachers and administrators.
- Support bulk upload of teachers, classes, and students through CSV files.
- Allow class-wise student management and mapping of students to trained model identities.
- Generate downloadable attendance reports automatically.
- Provide a dashboard and history view for quick monitoring of attendance records.

## 4. Tech Stack

### Frontend

- React
- Vite
- React Router
- Axios
- React Toastify
- CSS Modules and Tailwind utility classes

### Backend

- Node.js
- Express
- MongoDB
- Mongoose
- JWT authentication
- bcryptjs
- Joi validation
- Multer for CSV uploads
- csv-writer for report generation

### Face Recognition Service

- Python
- FastAPI
- OpenCV
- NumPy
- Custom face-recognition pipeline with detector, aligner, embedder, and classifier

## 5. System Architecture

The system follows a multi-service architecture:

1. The React frontend is responsible for user interaction.
2. The Express backend exposes APIs for authentication, class management, student handling, dashboard data, attendance creation, and CSV import/export.
3. MongoDB stores teachers, classes, students, and attendance records.
4. A FastAPI-based Python service receives classroom images, compares detected faces against the trained model, and returns recognized students.

This separation improves maintainability because the web application logic and the computer-vision logic are handled independently.

## 6. Core Functional Modules

### 6.1 Authentication and Session Management

- Teachers can register and log in securely.
- Passwords are hashed using bcrypt before storage.
- JWT tokens are stored in HTTP-only cookies for session management.
- Protected routes prevent unauthorized access.
- Role-based access ensures that only admins can upload teacher and student CSV files.

### 6.2 Admin Data Upload

- Admins can upload teacher CSV files to create teacher accounts and assign classes.
- Admins can upload student CSV files to populate class rosters.
- The system supports optional fields such as `teacherEmail`, `modelIdentity`, and `faceImage`.
- A migration script is included to transform older imported raw student records into the newer class-linked structure.

### 6.3 Dashboard and Class Management

- Teachers can view their assigned classes from the dashboard.
- Each class card displays total students, last attendance date, and mapping readiness.
- The system indicates whether student identities still need to be mapped to the recognition model.
- Recent attendance records are shown directly on the dashboard for quick access.

### 6.4 Student Face and Identity Management

- Teachers can view students class-wise.
- Each student can be assigned a face image for enrollment.
- Teachers can map a student to the exact identity name used inside the trained classifier.
- The system can fetch known model identities from the face-recognition service and use them as suggestions during mapping.

### 6.5 Attendance Processing

- Teachers can take attendance using classroom images from camera or gallery.
- Multiple classroom images can be uploaded for the same attendance session.
- If the same student appears in multiple images, the student is counted only once.
- Recognized students are marked present, and the rest are marked absent.
- Attendance data is saved in the database for historical access.
- A CSV report is generated and downloaded automatically after processing.

### 6.6 Attendance History

- Teachers can review past attendance records.
- Records can be filtered by class and searched by date.
- The system calculates present count, absent count, total students, and attendance percentage.

## 7. Database Design

The application mainly uses four collections:

- `Auth`: stores teacher/admin details such as name, email, password hash, and role.
- `Class`: stores class name, assigned teacher, total students, and last attendance date.
- `Student`: stores student name, roll number, email, class reference, model identity, and reference face image.
- `Attendance`: stores class, teacher, date, present students, and absent students.

This structure supports role-based access, class ownership, student mapping, and attendance history efficiently.

## 8. Working Flow

1. Admin uploads teacher and student CSV files.
2. Teachers log in and access their dashboard.
3. Teachers review each class and complete student-to-model identity mapping if needed.
4. Teachers upload or maintain student face reference images where required.
5. Teachers start attendance by uploading one or more classroom images.
6. The backend sends these images and student roster data to the Python face-recognition service.
7. The face service detects faces, extracts embeddings, runs classification, and returns recognized students.
8. The backend saves the attendance result, updates class metadata, and generates a CSV attendance report.
9. Teachers can later review the attendance history from the dashboard and history page.

## 9. Important Implementation Highlights

- Environment-based configuration for API URLs, CORS origins, cookie behavior, admin emails, and face-service URLs.
- Separate FastAPI service for recognition so the ML pipeline is isolated from the main web backend.
- Support for identity normalization to reduce mismatch between roster names and classifier labels.
- Automatic class-wise student counting and mapping status calculation.
- Session persistence on the frontend through refresh handling and stored user data.
- Downloadable attendance reports generated directly from processed results.

## 10. My Contribution in the Group

Based on the repository history, the visible implementation work in this project is committed under my account (`abhinav-973`). My contribution was not limited to one isolated file; it covered major parts of the end-to-end system. The key areas I contributed are listed below.

### 10.1 Full-Stack Project Foundation

- Set up the initial full-stack structure with React frontend and Node/Express backend.
- Created the main routing, layout, authentication pages, dashboard, attendance history view, and backend API structure.
- Defined the main MongoDB models for teachers, classes, students, and attendance.

### 10.2 Authentication and Access Control

- Implemented registration, login, logout, and session validation APIs.
- Added password hashing, JWT-based authentication, cookie handling, and request validation.
- Built protected routing on the frontend and role-aware navigation for admin and teacher workflows.

### 10.3 Admin Upload and Data Management

- Implemented CSV upload for teachers and students.
- Added logic to auto-create classes during teacher import and assign students to the correct class.
- Added migration support for older raw student records to align them with the current database structure.

### 10.4 Face-Recognition Integration

- Integrated the Express backend with a dedicated Python FastAPI face-recognition service.
- Implemented the `cv_adapter` layer and the face-service endpoints.
- Added the custom recognition pipeline components for detection, alignment, embedding, and classification.
- Added model-identity support so students can be matched correctly with trained classifier labels.
- Added model weights and classifier assets required for face attendance.

### 10.5 Teacher Workflow Improvements

- Built the class-wise attendance workflow from the dashboard.
- Added support for taking attendance using multiple classroom images in a single run.
- Implemented report generation and direct CSV download after attendance is processed.
- Built the student identity mapping modal and student face-enrollment modal to support setup before recognition.

### 10.6 Dashboard, History, and Bug Fixing

- Improved dashboard insights such as total students, mapped students, unmapped students, and setup readiness.
- Built recent attendance and attendance history views for teachers.
- Fixed bugs related to attendance flow, dashboard logic, sidebar behavior, and overall UX.

### 10.7 Evidence From Commit History

The commit history shows a clear progression of my work:

- `2026-03-29`: Initial full-stack project setup.
- `2026-03-30`: Major attendance and recognition features added, including face pipeline integration and student identity mapping.
- `2026-03-30`: Bug fixes and workflow improvements for dashboard and attendance flow.
- `2026-03-30`: Model weights added for face attendance support.

This shows that my contribution was central to the system design, implementation, integration, and refinement stages of the project.

## 11. Challenges Faced

- Integrating a JavaScript-based web backend with a Python-based computer-vision service.
- Matching student records with model identity names inside the classifier.
- Handling multiple classroom images without double-counting the same student.
- Managing secure authentication while keeping the workflow simple for users.
- Handling CSV-based data import in a way that supports both normal cases and edge cases such as ambiguous classes.

## 12. Current Limitations

- The repository does not currently include an automated test suite.
- Accuracy depends on the quality of the trained face model and classroom images.
- Recognition performance may vary with lighting, camera angle, and occlusion.
- Deployment and production hardening are not yet fully documented in the repository.

## 13. Future Scope

- Add automated backend and frontend tests.
- Add model training and retraining workflow inside the application.
- Add richer analytics such as monthly attendance summaries and low-attendance alerts.
- Add support for live camera streaming instead of still-image upload only.
- Improve deployment readiness with Docker and CI/CD support.

## 14. Conclusion

The Automated Attendance System is a practical and scalable solution for modern classroom attendance management. It combines secure user management, structured academic data handling, and face-recognition-based automation into a single workflow. From the visible repository work, my role in the group was a major implementation role spanning backend development, frontend development, integration of the recognition pipeline, admin data flows, and bug fixing. This project demonstrates both application development skills and the ability to integrate AI/ML functionality into a real-world software system.
