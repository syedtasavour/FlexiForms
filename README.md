# FlexiForms

A dynamic form builder application that allows users to create, manage, and submit custom forms with drag-and-drop functionality.

## Features

- **Dynamic Form Creation with Multiple Sections**: Users can create forms with multiple sections for better organization.
- **Drag-and-Drop Interface**: Easily add and rearrange fields using a drag-and-drop interface.
- **Real-Time Form Preview**: View forms in real-time as they are being created.
- **Multiple Field Types**: Support for various field types (text, number, date, file upload, etc.).
- **Form Submission Handling**: Users can submit their responses, which are stored in the database.
- **Responsive Design**: The application is fully responsive and works well on all devices.
- **User Authentication**: Users can register, log in, and manage their forms.
- **Submission Management**: Users can view submissions for forms they created.
- **Edit Forms**: Users can edit the forms they created.
- **MongoDB Data Persistence**: All data is stored in MongoDB.

## Tech Stack

### Frontend
**Main Technologies**:
- React 18
- React Router DOM v6
- react-beautiful-dnd
- TailwindCSS

**Additional Packages**:
- @radix-ui/react-label
- @radix-ui/react-slot
- class-variance-authority
- clsx
- lucide-react
- tailwind-merge
- tailwindcss-animate

### Backend
**Main Technologies**:
- Node.js
- Express
- MongoDB
- Mongoose

**Additional Packages**:
- cors
- dotenv
- body-parser
- bcryptjs (for password hashing)
- jsonwebtoken (for authentication)

## Architecture

### Frontend
**Components**:
- **FormBuilder**: Main component for creating forms.
- **FormPreview**: Component for viewing and submitting forms.
- **Login**: Component for user login.
- **Register**: Component for user registration.
- **UserForms**: Component for managing user-created forms and viewing submissions.

**Controllers**:
- **FormController**: Business logic for form operations.
- **AuthController**: Business logic for user authentication.

**Models**:
- **FormModel**: Data handling and API communication for forms.
- **UserModel**: Data handling for user accounts.

### Backend
**Models**:
- **Form**: Schema for form structure.
- **FormSubmission**: Schema for form submissions.
- **User**: Schema for user accounts.

**Routes**:
- **formRoutes**: API endpoints for form operations.
- **authRoutes**: API endpoints for user authentication.

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/syedtasavour/FlexiForms.git
   ```

2. Install dependencies:
   ```bash
   cd FlexiForms
   npm install
   cd frontend
   npm install
   cd ../backend
   npm install
   ```

3. Set up environment variables: Create a `.env` file in the root directory with:
   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/formbuilder
   NODE_ENV=development
   JWT_SECRET=your_jwt_secret
   ```

4. Start the application:
   - Backend: `npm start` (in the backend directory)
   - Frontend: `npm start` (in the frontend directory)

## API Endpoints

### User Authentication
- Register User
  - Method: POST
  - Path: `/api/auth/register`
  - Description: Register a new user.

- Login User
  - Method: POST
  - Path: `/api/auth/login`
  - Description: Login an existing user.

### Form Operations
- Create Form
  - Method: POST
  - Path: `/api/forms`
  - Description: Create a new form.

- Get Form
  - Method: GET
  - Path: `/api/forms/:id`
  - Description: Get form by ID.

- Submit Form
  - Method: POST
  - Path: `/api/forms/:id/submit`
  - Description: Submit form response.

- Get Submissions
  - Method: GET
  - Path: `/api/forms/:id/submissions`
  - Description: Get form submissions for a specific form.

- Edit Form
  - Method: PUT
  - Path: `/api/forms/:id`
  - Description: Update an existing form.

## Contributing

1. Fork the repository.
2. Create your feature branch: `git checkout -b feature/YourFeature`
3. Commit your changes: `git commit -m 'Add YourFeature'`
4. Push to the branch: `git push origin feature/YourFeature`
5. Submit a pull request.

## License

MIT

## Contact

- GitHub: syedtasavour
- Email: FlexiForms@syedtasavour.me

Version: 1.0.0
Author: Syed Tasavour
