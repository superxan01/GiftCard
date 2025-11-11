# GiftCard
I built a webapp for sterling glams to be able to issue and make changes on giftcards.

# GiftCard Validator Web App

This project is a full-stack web application that allows you to manage and validate gift cards using a Google Sheet as your database. The backend is powered by a serverless Google Apps Script, and the frontend is built with HTML and TailwindCSS.

## 🗂️ File Structure

-   `/public/index.html`: The customer-facing page to check a gift card's balance and status.
-   `/public/cashier.html`: A portal for cashiers to log in, add new gift cards, and update balances.
-   `/public/admin.html`: A dashboard for administrators to perform full CRUD (Create, Read, Update, Delete) operations on all gift cards.
-   `/src/Code.gs`: The Google Apps Script backend code that handles all logic and communication with your Google Sheet.

---

## 🚀 Setup Instructions

Follow these three parts carefully to get your application running.

### Part 1: Google Sheet Setup

1.  **Create a new Google Sheet:** Go to [sheets.new](https://sheets.new).
2.  **Find your Sheet ID:** The ID is the long string in the URL. For example, in `https://docs.google.com/spreadsheets/d/1aBcDeFgHiJkLmNoPqRsTuVwXyZ...`, the Sheet ID is `1aBcDeFgHiJkLmNoPqRsTuVwXyZ...`. Copy this ID.
3.  **Create Two Sheets (Tabs):**
    *   Rename the first sheet from `Sheet1` to `GiftCards`.
    *   Click the `+` icon to add a new sheet and name it `Users`.
4.  **Set Up `GiftCards` Sheet:** In the first row of the `GiftCards` sheet, add the following headers:
    *   `Card ID`
    *   `Balance`
    *   `Status`
    *   `CreatedBy`
    *   `DateCreated`
5.  **Set Up `Users` Sheet:** In the first row of the `Users` sheet, add the following headers:
    *   `Email`
    *   `Password`
    *   `Role`
6.  **Add Sample Users:** Add at least one `admin` and one `cashier` to the `Users` sheet so you can log in. For example:
    *   `admin@example.com`, `adminpass`, `admin`
    *   `cashier@example.com`, `cashierpin`, `cashier`

### Part 2: Google Apps Script Backend Setup

1.  **Create a new Apps Script:** Go to your Google Sheet, then click `Extensions` > `Apps Script`.
2.  **Paste the Backend Code:** Delete any boilerplate code in the `Code.gs` editor and paste the entire contents of the `/src/Code.gs` file you downloaded.
3.  **Update Configuration:** In the script editor, replace `'YOUR_GOOGLE_SHEET_ID'` with the Sheet ID you copied in Part 1.
    ```javascript
    // --- CONFIGURATION ---
    const SHEET_ID = 'PASTE_YOUR_SHEET_ID_HERE'; 
    ```
4.  **Deploy as a Web App:**
    *   Click the **Deploy** button in the top-right.
    *   Select **New deployment**.
    *   Click the gear icon next to "Select type" and choose **Web app**.
    *   In the configuration, set the following:
        *   **Description:** `GiftCard API`
        *   **Execute as:** `Me`
        *   **Who has access:** `Anyone` (This is necessary for the frontend to call the API).
    *   Click **Deploy**.
5.  **Authorize Permissions:** Google will ask you to authorize the script's permissions to access your Sheet. Follow the prompts. You may see a "Google hasn't verified this app" warning; click "Advanced" and then "Go to (your project name)".
6.  **Copy the Web App URL:** After deployment, a URL will be provided. **Copy this URL.** This is your API endpoint.

### Part 3: Frontend Configuration

You are almost done!

1.  **Open the HTML Files:** Open `index.html`, `cashier.html`, and `admin.html` from the `/public/` folder in a text editor or browser.
2.  **Paste the Web App URL:** In each of the three HTML files, find the line:
    ```javascript
    const WEB_APP_URL = 'YOUR_WEB_APP_URL';
    ```
3.  **Replace the placeholder** with the Web App URL you copied from the Apps Script deployment.
4.  **Save the files.**

---

## ✅ How to Use

-   **Customer Page (`index.html`):** Open this file in your browser. Enter a gift card ID and click "Check Balance".
-   **Cashier Page (`cashier.html`):** Open this file. Log in with the cashier credentials you added to the `Users` sheet. You can then add new cards or update existing balances.
-   **Admin Page (`admin.html`):** Open this file. Log in with the admin credentials. You will see a table of all gift cards and have full control to add, edit, or delete them.

> **🔐 Security Note:** The authentication system in this project is for demonstration purposes only. Passwords are sent and stored in plain text. For a production application, you should implement a more secure solution like OAuth2 or use a professional identity service.

