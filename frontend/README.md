# Book Trading Club

This project is a web application for managing a book trading club, allowing users to view, add, and trade books with each other. It is built to fulfill the requirements of the freeCodeCamp "Manage a Book Trading Club" challenge.

## Objective

The goal is to build a full-stack web application functionally similar to the example provided by freeCodeCamp: [https://manage-a-book-trading-club.freecodecamp.rocks/](https://manage-a-book-trading-club.freecodecamp.rocks/).

## User Stories

The application implements the following features based on the user stories:

1.  **View All Books:** Users can view a list of all books posted by every user on the platform.
2.  **Add a New Book:** Authenticated users can add new books to their collection, making them available for potential trading.
3.  **Update Settings:** Authenticated users can update their profile information, including their full name, city, and state.
4.  **Propose and Manage Trades:** Authenticated users can propose trades for books owned by others and manage incoming and outgoing trade requests (accept/reject).

## Features Implemented

* User Registration and Authentication (Login/Logout)
* Viewing a public list of all books.
* Authenticated users adding books associated with their account.
* Authenticated users updating their profile information.
* Mechanism for users to propose trades for books they want.
* Views for users to see incoming and outgoing trade proposals.
* Functionality for the book owner to accept or reject a trade proposal.
* Updating book ownership upon successful trade acceptance.

## Tech Stack

* **Frontend:** React.js (built with Vite)
* **Backend:** Node.js with Express.js
* **Database:** MongoDB (using Mongoose ODM)
* **Authentication:** JSON Web Tokens (JWT)

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

* Node.js and npm (or yarn/pnpm) installed on your machine.
* A MongoDB database (local or cloud, e.g., MongoDB Atlas). If using Atlas, you will need your connection string and whitelist your IP address.

### Installation

1.  **Clone the repository (or use the files you created):**
    ```bash
    # If using Git
    # git clone
    # cd book-trading-club
    ```
    If you followed the previous steps, you already have the `book-trading-club` directory with `backend` and `frontend` subdirectories.

2.  **Backend Setup:**
    * Navigate into the `backend` directory:
        ```bash
        cd backend
        ```
    * Install backend dependencies:
        ```bash
        npm install # or yarn install or pnpm install
        ```
    * Create a `.env` file in the `backend` directory root and add your MongoDB URI and JWT secret:
        ```env
        MONGO_URI=your_mongodb_connection_string
        PORT=5000 # Or your desired backend port
        JWT_SECRET=a_strong_random_string_for_jwt_signing
        ```
        *Replace `your_mongodb_connection_string` with your actual URI.*
        *Replace `a_strong_random_string_for_jwt_signing` with a unique secret key.*

3.  **Frontend Setup:**
    * Navigate into the `frontend` directory:
        ```bash
        cd ../frontend
        ```
    * Install frontend dependencies:
        ```bash
        npm install # or yarn install or pnpm install
        ```
    * Create a `.env` file in the `frontend` directory root. Add the URL of your backend API:
        ```env
        VITE_REACT_APP_BACKEND_URL=http://localhost:5000/api # Replace 5000 with your backend port
        # If deploying, this will change to your deployed backend URL
        ```
        *(Vite uses environment variables prefixed with `VITE_` by default)*

## Running the Application

1.  **Start the Backend Server:**
    * Open a terminal window and navigate to the `backend` directory.
    * Run the server:
        ```bash
        npm start # Or node server.js
        ```
    * The backend server should start and connect to your MongoDB database.

2.  **Start the Frontend Development Server:**
    * Open a *new* terminal window and navigate to the `frontend` directory.
    * Run the development server:
        ```bash
        npm run dev # or yarn dev or pnpm dev
        ```
    * Vite will provide a local URL (e.g., `http://localhost:5173`). Open this URL in your web browser.

The application should now be running locally, with the frontend communicating with the backend.

## Deployment

You will need to deploy both your frontend and backend separately.

* **Backend:** Can be deployed to platforms like Heroku, Render, Vercel Functions (serverless), AWS, Google Cloud, etc. Ensure your `MONGO_URI`, `JWT_SECRET`, and `PORT` are configured as environment variables on the hosting platform.
* **Frontend:** Can be deployed to platforms like Netlify, Vercel, GitHub Pages, or served from your backend server. Remember to update the `VITE_REACT_APP_BACKEND_URL` environment variable in your frontend's build process to point to your *deployed* backend URL.

## Potential Future Improvements

* Add book cover images (e.g., integrating with the Google Books API).
* Implement notifications for trade requests.
* Allow users to cancel trade requests.
* Add user profiles to view books owned by a specific user.
* Search and filtering functionality for books.
* More complex trade options (e.g., multiple books for multiple books).

