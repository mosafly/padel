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

## Getting Started

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

To start the development server:

```bash
pnpm run dev
```
then to run the app:

```bash
supabase login
supabase link
supabase db push
```

Active docker then

supabase functions deploy create-lomi-checkout-session --no-verify-jwt


The application should now be running on your local development server (usually `http://localhost:5173` or similar).