# 📱 Phone Shop POS Backend Server (Node.js)

## Overview

This project is a backend server built with Node.js to manage and process business transactions for a phone shop's point-of-sale (POS) system. The server performs all essential business operations, such as product management, sales transactions, and customer data handling. It exposes a REST API and uses Firestore for data storage and retrieval. The server is deployed on an AWS EC2 instance and integrates with other components like the dashboard app.

## Features

- **Business Operations**: Manages key functions like product management, sales transactions, and customer data for the phone shop.
- **RESTful API**: Exposes a set of RESTful endpoints to communicate with the frontend.
- **Firestore Database**: Utilizes Firestore for low-latency data storage, eliminating the need for Redis caching.
- **Pagination**: Implements pagination for major requests to ensure efficient handling of large datasets.
- **MeiliSearch Integration**: Keeps search results synchronized and up-to-date on the frontend, allowing for fast and efficient searching.
- **JWT Authentication**: Firebase ID tokens are decoded to validate users. The flow checks Firestore's users table to verify user existence and issues a JWT for authenticated access.
- **Google SMTP Integration (Nodemailer)**: The server uses Google SMTP through Nodemailer to send emails, including reports and notifications.

## Security Measures

- **AWS EC2 Deployment**: The server is deployed on AWS EC2 with a robust security setup.
- **Nginx Reverse Proxy**: Nginx is used as a reverse proxy for the Node.js server.
- **SSL Encryption**: All traffic is secured via SSL, with a custom domain configured using AWS Route53.
- **Helmet for Security Headers**: Helmet is used to manage various security headers, including the Content Security Policy (CSP), enhancing the app's resilience against common web vulnerabilities.

### Security Tools

- **Cloudflare Protection**: Multiple security mechanisms are set up on Cloudflare to protect against threats and improve performance.
- **ModSecurity WAF**: Deployed with the OWASP Core Rule Set (CRS) for comprehensive web application protection.
