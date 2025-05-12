# Padel Society

An application for booking padel courts, featuring integration with lomi. payments.

## Overview

padelsociety.ci is a modern web application designed to streamline the process of reserving padel courts. Users can browse available courts, make bookings, and handle payments securely. Administrators have tools to manage reservations and oversee the platform.

This project is built with:

- **Frontend**: React, TS
- **Backend**: Supabase
- **Styling**: Tailwind CSS + Shadcn
- **Payments**: lomi.
- **Emails**: Resend

## Features

- User registration and authentication.
- Browse and search for available padel courts.
- Real-time court booking system.
- Secure payment processing via lomi. integration.
- User dashboard to manage existing reservations.
- Admin panel for managing courts, users, and all reservations (confirm/cancel).
- Responsive design for accessibility on various devices.

## Getting started

Follow these instructions to get a local copy up and running for development and testing purposes.

### Prerequisites

- Node.js (v16 or higher recommended)
- An active Supabase account
- An active lomi. account for payment processing

### Installation

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/lomiafrica/booking
    cd booking
    ```

2.  **Install dependencies:**

    ```bash
    pnpm install
    ```

3.  **Set up environment variables:**
    Create a `.env` file by copying the example file:
    ```bash
    cp .env.example .env
    ```
    Populate the `.env` file with your credentials and configuration details for Supabase and lomi. Refer to `.env.example` for the required variables.

### Running Locally

Follow these steps to get the application running on your machine:

1.  **Start the Frontend development server:**
    Open a terminal window, navigate to the project directory, and run:
    ```bash
    pnpm run dev
    ```
    This compiles the frontend code and serves the application, usually at `http://localhost:5173`. Keep this terminal window open while you are developing.

2.  **Set Up Supabase backend (One-time or after pulling changes):**
   
    In a *separate* terminal window (while the first one is still running `pnpm run dev`), run the following commands. You typically only need to run `login` and `link` once per project setup. Run `db push` initially and whenever database schema changes are made (e.g., in `supabase/migrations`).
    ```bash
    # Log in to your Supabase account via the CLI (if not already logged in)
    supabase login

    # Link this local project to your Supabase project online (replace YOUR_PROJECT_REF)
    # Find YOUR_PROJECT_REF in your Supabase project settings (General > Project Ref)
    supabase link --project-ref YOUR_PROJECT_REF

    # Apply database schema changes from local migrations to your Supabase database
    supabase db push
    ```

3.  **Deploy the lomi. Checkout function (Initial setup or after function changes):**
    Ensure Docker Desktop (or Docker Engine for Linux) is **running** on your machine. Then, in the second terminal window, deploy the Supabase Edge Function:
    
    ```bash
    supabase functions deploy create-lomi-checkout-session --no-verify-jwt
    ```
    You only need to re-run this command if you modify the code within the `supabase/functions/create-lomi-checkout-session/` directory.

After completing these steps, your local frontend application (running from step 1) should be accessible in your browser and able to communicate with your configured Supabase backend and the deployed Edge Function for payments.

## Note: FOR AMOS (Kindly refer to point 4.)

This section provides a more detailed explanation to help better understand the setup process and the core payment logic.

### Getting Started

The "Getting Started" section guides you through setting up the project locally. Here's a breakdown of the crucial steps:

*   **Prerequisites:**
    *   **Node.js:** Essential for running JavaScript/TypeScript outside the browser, managing project dependencies (`pnpm install`), and running the local development server (`pnpm run dev`). Ensure it's installed (`node -v`).
    *   **Supabase account:** Provides the backend (database, authentication, serverless functions). Sign up, create a project, and note your Project URL and API keys for the `.env` file.
    *   **lomi. account:** Handles secure payment processing. Sign up and get your Lomi API Key for the `.env` file.

*   **Installation:**
    1.  `git clone ...`: Downloads the project code.
    2.  `cd ...`: Moves your terminal into the project directory.
    3.  `pnpm install`: Downloads required libraries listed in `package.json`. Install `pnpm` first if needed (`npm install -g pnpm`).
    4.  `cp .env.example .env`: Creates your personal configuration file from the template.
    5.  **Populate `.env`:** Edit the `.env` file and replace placeholders with your actual Supabase and credentials. **This is critical for the app to connect to backend services.**

*   **Running locally:**

    1.  `pnpm run dev`: Starts the frontend development server (usually `http://localhost:5173`). Keep this running.
    2.  `supabase login`: Connects the Supabase CLI tool to your account (do this once).
    3.  `supabase link --project-ref YOUR_PROJECT_ID`: Links your local project folder to your remote Supabase project (replace `YOUR_PROJECT_ID`).
    4.  `supabase db push`: Updates your remote Supabase database schema based on local files (`supabase/migrations`). Ensures database tables match the application's expectations.
    5.  `Active docker then supabase functions deploy ...`:
        *   **Docker:** Required by the Supabase CLI to package Edge Functions. Ensure Docker Desktop (or Engine) is running.
        *   `supabase functions deploy create-lomi-checkout-session --no-verify-jwt`: Uploads the payment function code (`supabase/functions/create-lomi-checkout-session/index.ts`) to Supabase, making it callable via an API endpoint. `--no-verify-jwt` might be used for simplified access during development, but review security implications for production.

### Understanding the Checkout function (`supabase/functions/create-lomi-checkout-session/index.ts`)

This file defines a Supabase Edge Function, which is server-side code running on Supabase infrastructure. Its main job is to securely create a payment session with Lomi.

*   **Purpose:** Acts as a secure bridge between your frontend and the lomi. payment gateway.
*   **Why an Edge function?** Keeps sensitive information (like your lomi. API Key) off the frontend (browser) and handles server-to-server communication securely.
*   **How it Works:**

    1.  **Receives request:** Listens for HTTP requests from your frontend (triggered when a user initiates checkout). The request includes details like amount, currency, and a unique reservation ID.
    2.  **Reads Environment Variables:** Gets your secret `LOMI_API_KEY` and your `APP_BASE_URL` (needed for redirect URLs) from the Supabase function's settings (which you configure based on your `.env`).
    3.  **Validates input:** Checks if required data (amount, currency, reservation ID) is present and if the Lomi API key is configured.
    4.  **Prepares lomi. payload:** Constructs the data object required by the lomi. API. This includes:
        *   `success_url` & `cancel_url`: Where Lomi redirects the user after payment attempt (back to your app). Includes the `reservation_id` so your app knows which booking was paid for.
        *   `amount`, `currency_code`: Payment details.
        *   `metadata`: Custom data (like `reservation_id`) sent to Lomi for tracking.

        *   **Dynamic vs. Predefined product or subscription plan:**
            *   **Dynamic:** By default, it creates a session for the specific `amount` sent in the request (an "instant" payment).
            *   **Predefined:** If the frontend sends optional lomi. IDs like `product_id` or `plan_id` (which you'd set up in your lomi. dashboard), the function includes these in the payload, potentially linking the payment to a specific item in Lomi. The function supports both models based on what the frontend sends.

    5.  **Calls API:** Makes a secure `POST` request to Lomi's `/checkout-sessions` endpoint, sending the prepared payload and your `LOMI_API_KEY` in the headers.
    6.  **Handles lomi. response:** Checks if Lomi successfully created the session and returned a `checkout_url`.
    7.  **Returns checkout URL:** If successful, sends the unique `checkout_url` received from Lomi back to your frontend.
    8.  **Frontend redirect:** Your frontend receives this URL and redirects the user's browser to Lomi's payment page.
    9.  **lomi. handles payment:** User interacts with lomi.'s interface.
    10. **Redirect back:** lomi. redirects the user back to your app's `success_url` or `cancel_url` or any other predefined URL.
*   **Error handling:** Includes `try...catch` blocks and CORS headers to handle potential errors gracefully and allow communication between your frontend and the Supabase function.