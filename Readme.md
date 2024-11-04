# 📱 Phone Shop POS Backend Server (Node.js)

## Overview

This project is a backend server built with Node.js to manage and process business transactions for a phone shop's point-of-sale (POS) system. The server performs all essential business operations, such as product management, sales transactions, and customer data handling. It exposes a REST API and uses Sequelize ORM to interact with a PostgreSQL database. The server is deployed on an AWS EC2 instance and integrates with other components like the dashboard app.

## Features

- **Business Operations**: Manages key functions like product management, sales transactions, and customer data for the phone shop.
- **RESTful API**: Exposes a set of RESTful endpoints to communicate with the frontend.
- **PostgreSQL Database**: Utilizes a PostgreSQL database hosted on AWS RDS.
- **Pagination**: Implements pagination for major requests to ensure that large datasets are fetched efficiently.
- **Redis Caching**: Speeds up frequent data requests using Redis caching for enhanced performance.
- **MeiliSearch Integration**: Keeps search results synchronized and up-to-date on the frontend with MeiliSearch, allowing for fast and efficient searching.
- **JWT Authentication**: Firebase ID tokens are decoded to validate users and grant access tokens. This flow checks if the user exists in the database and issues a JWT for authenticated access.
- **Google SMTP Integration (Nodemailer)**: The server uses Google SMTP through Nodemailer to send emails, including reports and notifications.

## Security Measures

- **AWS EC2 Deployment**: The server is deployed on AWS EC2 with a robust security setup.
- **AWS RDS**: PostgreSQL database hosted securely on AWS RDS.
- **Nginx Reverse Proxy**: Nginx is used as a reverse proxy for the Node.js server.
- **SSL Encryption**: All traffic is secured via SSL, with a custom domain configured using AWS Route53.

### Security Tools

- **ModSecurity WAF**: Deployed with OWASP CRS (Core Rule Set) for comprehensive web application protection.
- **AWS Inspector**: Actively scans the EC2 instance to identify vulnerabilities and security risks.



