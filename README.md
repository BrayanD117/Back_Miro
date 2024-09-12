<h1 align="center">MIRÓ - Backend</h1>

<p align="center">
  <img src="https://lh5.googleusercontent.com/proxy/G-mVSy0KJv_Gin7Fp58xKKdJuVcdmU705gREkBiPheH1NlAR-HkaEde-_x3tRjCyssQe5hpbV_3EXC95ocYouhOxxU6eMKdeMogTy9mksHZ4_SBdKG-5u-O8LsoMuMRLUMpurHwr8FwSVQlrHZTtRLF524WCz5nu-gK9xv9XN4-7" alt="University of Ibagué Logo" />
</p>

## Overview

**MIRÓ** (Official Information and Reporting Mechanism) is an information management system designed to streamline the accreditation process for the University of Ibagué. This repository contains the backend implementation of the system, built using **Node.js (v20.11.1)**.

## Table of Contents

1. [Project Setup](#project-setup)
2. [Key Features](#key-features)
3. [Technologies Used](#technologies-used)
4. [Available Scripts](#available-scripts)
5. [API Documentation](#api-documentation)

## Project Setup

To get started with the backend of MIRÓ, follow these steps:

- Clone the repository:

```bash
git clone https://github.com/BrayanD117/Back_Miro.git
```

- Navigate to the project directory:

```bash
cd Back_Miro
```

- Install the dependencies:

```bash
npm install
```

- Set up the environment variables by creating a `.env` file in the root directory based on the `.env.example`.

- Start the server:

```bash
npm run start
```

## Key Features

- **Express.js Framework**: Handling HTTP requests and building RESTful APIs.
- **MongoDB with Mongoose**: For data storage and schema validation.
- **Google Drive Integration**: Manage file storage through Google Drive.
- **Swagger Documentation**: Auto-generated API documentation using Swagger.
- **File Upload**: Manage file uploads with Multer.
- **Environment Variables**: Managed securely with `dotenv`.

## Technologies Used

- **Node.js** (v20.11.1)
- **Express.js**: A fast, minimalistic web framework.
- **MongoDB & Mongoose**: Database and ODM.
- **Google APIs**: Integration with Google Drive and Google Authentication.
- **Multer**: File upload middleware.
- **Swagger**: For API documentation.

## Available Scripts

- `npm start`: Starts the backend server with file watching.
- `npm run release`: Uses **semantic-release** to automate versioning and changelog generation.
- `npm test`: Currently no test scripts are specified.

## API Documentation

The API documentation is generated using **Swagger**. You can access the live documentation by navigating to `/docs` once the server is running.

---

### Author

Developed by **Brayan & Steven**.

For more information, visit the [University of Ibagué](https://www.unibague.edu.co).
