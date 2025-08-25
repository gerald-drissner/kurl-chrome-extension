# kurl - YOURLS Shortener for Chrome & Edge

> **Looking for the Firefox version? [Find it here\!](https://github.com/gerald-drissner/kurl-firefox-addon)**

[](https://www.google.com/search?q=https://github.com/gerald-drissner/kurl-chrome-extension/releases)
[](https://www.google.com/search?q=LICENSE)
[](https://github.com/YOURLS/awesome)

A browser extension for **Chrome** and **Edge** to shorten URLs with your self-hosted YOURLS instance.

## Features

  * **Quickly shorten links**: Create short URLs for any website directly from your browser.
  * **Universal Link Cleaning**: Automatically finds the real destination URL from tracking links (Google, Bing, etc.) before shortening.
  * **Custom Keywords & Titles**: Assign optional custom keywords and titles to your short links for easy management.
  * **QR Code Generation**: Instantly generate and download a high-quality QR code for any short URL.
  * **Instance Dashboard**: View your YOURLS instance's total links and clicks at a glance.
  * **Full Link Management**: Check the click count and target URL for any existing short link, or delete it directly from the extension.
  * **Streamlined Workflow**: Use the **toolbar button** or the **right-click context menu**.
  * **Privacy-Focused**: Connects only to your own YOURLS instance. No data is sent to third parties.
  * **Multi-language Support**: Available in English, German, French, Spanish, and many more languages.

-----

## About YOURLS (Your Own URL Shortener)

YOURLS is a free, open-source set of PHP scripts that allows you to run your own URL shortening service. Unlike commercial services, YOURLS gives you full control over your data, with powerful features like detailed statistics, link management, and a plugin architecture to extend its functionality.

This extension requires you to have your own YOURLS instance already installed and running on a web server.

### How to Install YOURLS

Self-hosting YOURLS requires a web server with PHP and a MySQL database. For complete and detailed instructions, please refer to the official guide:
**[Official YOURLS Installation Guide](https://yourls.org/#Install)**

### Finding Your API Signature Token

To connect this extension to your YOURLS instance, you need your unique API signature token.

1.  Log in to your YOURLS admin dashboard (e.g., `http://your-domain.com/admin/`).
2.  In the top menu, click on **Tools**.
3.  Your API signature token is the long string of characters displayed in the **"Secure passwordless API call"** section at the top of the page.

-----

## Installation

### 🔹 Option 1: Install from Official Stores

Install the latest stable version directly from your browser's official store:

[](https://chrome.google.com/webstore/category/extensions)
[](https://microsoftedge.microsoft.com/addons/Microsoft-Edge-Extensions-Home)

### 🔹 Option 2: Manual Installation (for development)

1.  Go to the [**Releases Page**](https://github.com/gerald-drissner/kurl-chrome-extension/releases).
2.  Download the `.zip` file from the latest release.
3.  Unzip the downloaded file into a permanent folder.
4.  In your browser, navigate to the extensions page:
      * Chrome: `chrome://extensions`
      * Edge: `edge://extensions`
5.  Enable **"Developer mode"** using the toggle switch.
6.  Click the **"Load unpacked"** button.
7.  Select the folder where you unzipped the files.

-----

## Usage

Before the first use, you must configure the extension. **Right-click the kurl icon** in your toolbar and select **"Options"**. You will need to enter your **YOURLS instance URL** and your **API signature token**.

There are two ways to use the shortener:

1.  **Toolbar Button**: Click the "kurl" icon in the toolbar to shorten the current page's URL.
2.  **Context Menu**: Right-click on a page, a link, or selected text to see shortening options.

-----

## Privacy Policy

kurl communicates directly with the YOURLS instance URL that you configure in the extension's settings. It does not collect, store, or transmit any data to any other third-party servers.

## License

This project is licensed under the MIT License.
