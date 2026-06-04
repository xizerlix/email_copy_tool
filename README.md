<p align="left">
    <img src="https://img.shields.io/badge/Chrome-4285F4?style=flat&logo=googlechrome&logoColor=white" alt="Chrome" height="20">
    <img src="https://img.shields.io/badge/Edge-0078D7?style=flat&logo=microsoftedge&logoColor=white" alt="Edge" height="20">
    <img src="https://img.shields.io/badge/Firefox-FF7139?style=flat&logo=firefox&logoColor=white" alt="Firefox" height="20">
</p>

## Email Copy Tool

A lightweight browser extension for Google Chrome, Microsoft Edge, and Mozilla Firefox. It automates the extraction of email addresses from page content.

## Demo

![Demo](assets/demo.gif)

### Features

* **Smart Scanning:** Automatically detects email addresses in real-time, including those inside dynamic popups and hover-over tooltips.

* **Domain Filtering:** Only copies emails matching your specified domains (e.g., @company.com).

* **Allow Repeated Copying:** By default, the plugin remembers the last copied value and won't copy it again to avoid clipboard spam.

* **Bulk Copying:** When enabled, the plugin scans the entire page and collects all unique email addresses matching your domain filter

* **Toast Notifications:** Displays a sleek, non-intrusive notification at the bottom of the screen upon successful copy.

* **Keep Screen Awake:** A checkbox in the popup prevents the browser and system from going idle while the extension is enabled.

* **Heart Toolbar Indicator:** The toolbar icon is always a heart — gray on regular sites, red (`#ff4444`, same as the Save button) on configured target sites. When **Keep screen awake** is enabled, the heart gently pulses: gray on other sites, red on target sites.


## Installation (Developer Mode)

**Since this is a custom internal tool, install it manually:**

* Download or clone this repository to your local machine.

* Open your browser and navigate to:

    Chrome: `chrome://extensions/`

    Edge: `edge://extensions/`

    Firefox: `about:debugging#/runtime/this-firefox`

* Enable **Developer mode** (Chrome/Edge) or use **Load Temporary Add-on** (Firefox).

* Click **Load unpacked** (Chrome/Edge) or **Load Temporary Add-on…** (Firefox) and select the extension folder.

## Configuration

**After installation, click the extension's icon in your browser toolbar:**

**Target URL:** Enter the base URLs, separated by commas or new lines (e.g., `creatio.example.com`).

**Domains:** Enter allowed email domains, separated by commas or new lines (e.g., `@shwarma.com`).

Click **Save Settings**.

If you need to keep the computer awake, open the popup and enable **Keep screen awake**. Turn it off by unchecking the box.

Refresh your page (F5) to apply changes.


# License

Distributed under the MIT License. Feel free to use and modify for your needs.
