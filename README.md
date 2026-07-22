# Welcome to user management API project!

Node.js REST API built with Express, TypeScript, PostgreSQL, and MinIO object storage. Features pure, zero-framework input validation, manual Base64 image parsing, JWT authentication, and isolated integration test suites using Docker Compose.

## Install dependencies

Ensure you have the following installed locally:

- **Node.js** (v18 or higher)
- **npm**
- **Docker** & **Docker Compose**

Install project dependencies.

npm i

## Configure Environment Variables

Place the provided .env file directly in the root directory of the project.

## Start PostgreSQL and MinIO containers via Docker Compose:

docker compose up -d

## Execute the migration script to create database tables:

npm run migrate

## Available npm scripts:

1. npm run test - Runs isolated unit test suites using Jest
2. npm run integration-tests - Runs integration tests against live Docker containers (--runInBand)
