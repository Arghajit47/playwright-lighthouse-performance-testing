# 🚀 Playwright + Lighthouse Puppeteer Automated Performance Testing

Welcome to the **Playwright + Lighthouse Puppeteer Automated Performance Testing** project! This tool helps you measure and improve the performance of your web application by automating performance tests for both **logged-in (authorized)** and **public (unauthorized)** users. Whether you're a developer, QA engineer, or project manager, this tool makes it easy to ensure your website runs smoothly on both **desktop**, **tablet** and **mobile** devices.

---

## 🌟 Why Use This Tool?

- **Automated Performance Testing**: Combines the power of **Playwright** (for UI automation) and **Puppeteer** (for Lighthouse browser automation) to test your website's speed and responsiveness.
- **Real User Scenarios**: Tests both **logged-in** and **public** user flows to ensure your app performs well for all users.
- **Cross-Device Testing**: Runs tests on both **desktop** and **mobile** configurations to simulate real-world usage.
- **Interactive Dashboard**: Visualize performance results in an easy-to-understand dashboard deployed on **Netlify**.
- **Easy to Use**: Simple setup and clear instructions make it accessible for both technical and non-technical users.

---

## 📋 Table of Contents

1. [What Does This Tool Do?](#-what-does-this-tool-do)
2. [Getting Started](#-getting-started)
   - [Prerequisites](#-prerequisites)
   - [Installation](#-installation)
   - [Environment Setup](#-environment-setup)
3. [Running Tests](#-running-tests)
   - [Authorized User Tests](#-authorized-user-tests)
   - [Unauthorized User Tests](#-unauthorized-user-tests)
   - [General Tests](#-general-tests)
4. [Understanding the Results](#-understanding-the-results)
5. [Interactive Dashboard](#-interactive-dashboard)
6. [Continuous Integration (CI)](#-continuous-integration-ci)
7. [Project Structure](#-project-structure)
8. [Dependencies](#-dependencies)
9. [FAQs](#-faqs)

---

## 🎯 What Does This Tool Do?

This tool automates performance testing for your web application by simulating two types of users:

1. **Authorized Users (Logged-In)**: Tests the performance of pages that require user login (e.g., dashboards, account settings).
2. **Unauthorized Users (Public)**: Tests the performance of public-facing pages (e.g., homepage, product listings).

It uses:
- **Playwright**: For **UI automation** (e.g., logging in, navigating pages).
- **Puppeteer**: For **Lighthouse browser automation** (e.g., running performance audits).

The results are displayed in an **interactive dashboard** deployed on **Netlify**, where you can visualize key performance metrics like:

- **Page Load Time**: How long it takes for your page to fully load.
- **Time to Interactive (TTI)**: How long it takes for the page to become fully interactive.
- **Performance Score**: A score out of 100 that summarizes your page's performance.

---

## 🚦 Getting Started

### 🛠️ Prerequisites

Before you begin, make sure you have the following installed:

- **Node.js**: Download and install the latest LTS (Long Term Support) version from [nodejs.org](https://nodejs.org/).
- **npm**: This comes pre-installed with Node.js.

To check if you have Node.js and npm installed, run these commands in your terminal:

```bash
node -v
npm -v
```

If you see version numbers, you're good to go! 🎉

---

### 📥 Installation

1. **Clone the Repository**: Download the project to your computer.
   ```bash
   git clone https://github.com/your-repo/playwright-lighthouse-performance-testing.git
   cd playwright-lighthouse-performance-testing
   ```

2. **Install Dependencies**: Install all the required tools and libraries.
   ```bash
   npm ci
   ```

   > **Note**: Use `npm ci` instead of `npm install` to ensure the exact versions of dependencies are installed.

---

### 🔧 Environment Setup

To test **logged-in user flows**, you need to provide login credentials. Create a `.env` file in the root of your project and add the following:

```bash
EMAIL=your_email@example.com
PASSWORD=your_password
```

> **Important**: Never share your `.env` file or commit it to version control (e.g., GitHub). It contains sensitive information.

---

## 🏃 Running Tests

This project includes three types of tests:

### 🔐 Authorized User Tests

Run performance tests for **logged-in users**:

```bash
npm run test:Auth
```

This will:
1. Remove old performance reports.
2. Run tests for both **desktop** and **mobile** configurations.

---

### 🔓 Unauthorized User Tests

Run performance tests for **public users**:

```bash
npm run test:UnAuth
```

This will:
1. Remove old performance reports.
2. Run tests for both **desktop** and **mobile** configurations.

---

### 🧪 General Tests

Run general performance tests (without focusing on login):

```bash
npm run test
```

---

## 📊 Understanding the Results

After running the tests, you'll find performance reports in the `performance-report/` folder. These reports include:

- **Performance Scores**: A score out of 100 for each page.
- **Metrics**: Detailed metrics like page load time, time to interactive, and more.
- **Recommendations**: Suggestions for improving performance.

---

## 📈 Interactive Dashboard

The performance results are visualized in an **interactive dashboard** deployed on **Netlify** and **Render**. You can access the dashboard here:

👉 **[Performance Matrix Dashboard](https://performance-matrix-dashboard.netlify.app/)**

The dashboard provides:
- **Visual Charts**: Bar charts, line graphs, and pie charts to visualize performance metrics.
- **Filter Options**: Filter results by device type (desktop/mobile) or performance range (e.g., 100-80, 79-50, 49-0).
- **Latest Run Data**: View the latest performance results for each test.

Here’s a sneak peek of the dashboard:

![Dashboard Screenshot](https://via.placeholder.com/800x400.png?text=Performance+Dashboard+Screenshot)

---

## 🤖 Continuous Integration (CI)

This project is set up to run tests automatically using **GitHub Actions**. Every time you push changes to the `main` or `master` branch, the tests will run, and performance reports will be generated and saved as artifacts.

---

## 🗂️ Project Structure

Here’s how the project is organized:

```
├── tests
│   ├── Auth
│   │   └── performance.spec.ts    # Tests for logged-in users
│   ├── UnAuth
│   │   └── performance.spec.ts    # Tests for public users
├── utils
│   └── helpers.ts                 # Helper functions for running tests
├── lighthouse
│   └── base.ts                    # Lighthouse configuration
├── test-data
│   └── enum.ts                    # URLs for testing
├── .env                           # Environment variables (not included in repo)
├── package.json                   # Project dependencies and scripts
├── playwright.config.ts           # Playwright configuration
├── playwright.yml                 # GitHub Actions CI workflow
```

---

## 📦 Dependencies

This project uses the following tools:

- **Playwright**: For **UI automation** (e.g., logging in, navigating pages).
- **Puppeteer**: For **Lighthouse browser automation** (e.g., running performance audits).
- **Lighthouse**: For performance audits.
- **Netlify**: For deploying the interactive dashboard.
- **Dotenv**: For managing environment variables.

All dependencies are listed in the `package.json` file.

---

## ❓ FAQs

### 1. **What is Playwright?**
Playwright is a tool for automating browser actions, like clicking buttons, filling forms, and navigating pages. It’s used here to simulate user behavior.

### 2. **What is Puppeteer?**
Puppeteer is a Node.js library for controlling headless Chrome or Chromium. It’s used here to automate Lighthouse performance audits.

### 3. **What is Lighthouse?**
Lighthouse is a tool by Google that audits web pages for performance, accessibility, SEO, and more. It’s used here to measure how fast your website loads.

### 4. **Can I use this for my website?**
Yes! Just update the URLs in the `test-data/enum.ts` file to point to your website.

### 5. **How do I view the test results?**
After running the tests, open the reports in the `allure-report/index-html`.

---

## 🎉 Ready to Get Started?

Follow the steps above to set up and run your performance tests. If you have any questions, feel free to reach out! 🚀

---

