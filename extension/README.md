# Save Data Extension

This browser extension is designed to help you quickly save the name, email, and URL of a Facebook page. It provides a simple popup interface for entering and storing this information.

## Features
- Save the name, email, and URL of a Facebook page
- Easy-to-use popup interface
- **Keyboard shortcut support (Ctrl+Shift+S or ⌘+Shift+S on Mac)**
- **Background data processing for reliability**
- **Automatic retry mechanism for failed requests**
- Data is queued and sent even if browser tab is closed

## Google Apps Script Setup for Save Data Extension

This guide explains how to set up the Google Apps Script backend and connect it with your Save Data browser extension. This will allow the extension to save Facebook page name, email, and URL directly to your Google Sheet.

### 1. Create a New Google Apps Script Project

1. Go to [Google Apps Script](https://script.google.com/) and click **New project**.
2. Delete any code in the default `Code.gs` file.
3. Copy the contents of `script.gs` from this extension and paste it into the editor.
4. Click **File > Save**, and give your project a name (e.g., "Save Data API").

### 2. Deploy as Web App

1. Click **Deploy > New deployment**.
2. Click **Select type** and choose **Web app**.
3. Enter a description (e.g., "Initial deployment").
4. Under **Execute as**, select **Me**.
5. Under **Who has access**, select **Anyone** (or "Anyone with the link").
6. Click **Deploy**.
7. Authorize the script with your Google account if prompted.
8. Copy the **Web app URL** (it will look like `https://script.google.com/macros/s/DEPLOYMENT_ID/exec`).

### 3. Prepare Your Google Sheet

1. Create a new Google Sheet (or use an existing one).
2. Copy the **Sheet ID** from the URL (the long string between `/d/` and `/edit`).
3. Decide on a **Sheet Name** (e.g., `Sheet1`).

### 4. Configure the Extension

1. Click the extension icon to open the popup.
2. Paste the **Web app URL** into the **Apps Script URL** field.
3. Enter your **Sheet ID** and **Sheet Name**.
4. Click **Save Settings**.

### 5. Usage

- Navigate to a Facebook page.
- Click the extension icon and then **Save Data**.
- **Or use the keyboard shortcut: Ctrl+Shift+S (⌘+Shift+S on Mac)**
- The name, email, and URL will be sent to your Google Sheet.
- Data is queued for reliable delivery and will retry automatically if the network is temporarily unavailable.

### Troubleshooting
- Make sure your Apps Script deployment is set to "Anyone" can access.
- The Sheet ID and Sheet Name must be correct.
- If you see errors, check the Apps Script project's **Executions** for logs and errors.

### Security Note
- Anyone with the Apps Script URL can send data to your sheet. Do not share the URL publicly.


## Usage

1. Click the extension icon in your browser toolbar to open the popup.
2. Enter the Facebook page's name, email, and URL in the provided fields.
3. Click the save button to store the information locally.
4. You can view or manage your saved data from the popup interface.

## Notes
- This extension does **not** send your data anywhere; all information is stored locally in your browser.
- Designed specifically for saving Facebook page details (name, email, and URL).

## Support
If you encounter any issues or have suggestions, please contact the [Developer](https://t.me/MehebubMukut).
