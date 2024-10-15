Here is a **README** file Github AI PR Review system 

# GitHub Pull Request Reviewer using AI

This project is an **automatic GitHub Pull Request (PR) review system** that leverages **OAuth for GitHub authentication**, creates a webhook for pull request events, and uses **AI (Hugging Face API)** to analyze and comment on the code changes. It is built using **Node.js**, **Express**, and **Octokit** (for GitHub API interactions).

## Features

- **GitHub OAuth Authentication**: Users can authenticate using their GitHub account.
- **Webhook Creation**: Automatically sets up a webhook in the repository to trigger on pull request events.
- **AI Review**: Uses Hugging Face GPT-2 model to review the pull requests.
- **Automatic PR Commenting**: Posts AI-generated reviews as comments on the pull requests.

## Prerequisites

Before you start, make sure you have the following:

1. **Node.js** and **npm** installed on your machine.
2. A **GitHub account**.
3. A **Hugging Face API key** (if using the Hugging Face API for PR analysis).
4. **OpenPort** (or another tool for exposing localhost).

## Setup

### 1. Clone the repository:

```bash
git clone https://github.com/your-username/your-repo-name.git
cd your-repo-name
```

### 2. Install dependencies:

```bash
npm install
```

### 3. Create a `.env` file:

In the root of your project, create a `.env` file with the following environment variables:

```env
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_ACCESS_TOKEN=your_github_access_token
HUGGINGFACE_API_KEY=your_huggingface_api_key
REDIRECT_URI=http://localhost:5000/auth/github/callback
PORT=5000
```

- Replace `your_github_client_id` and `your_github_client_secret` with your GitHub OAuth app credentials.
- `HUGGINGFACE_API_KEY` is needed if you want to use Hugging Face for PR review generation.
- `REDIRECT_URI` is the URL where GitHub will redirect after authentication.

### 4. Expose Localhost using OpenPort or ngrok:

To allow GitHub to send webhook events to your local environment, you will need to expose your localhost.

Example using **OpenPort**:

```bash
openport 5000
```

### 5. Start the server:

```bash
npm start
```

The server should now be running at `http://localhost:5000`.

## Usage

### 1. Authenticate via GitHub:

Go to `http://localhost:5000/auth/github` to authenticate the app with your GitHub account. This will trigger the OAuth process, and upon successful authentication, a webhook will be created on your repository.

### 2. Webhook Endpoint:

Once authenticated, a webhook will be created for your repository. Any new pull request created will trigger the webhook, which will analyze the pull request using AI and post a comment with the review.

The webhook URL is: `http://spr.openport.io:32192/webhook`.

### 3. Analyze Pull Requests with AI:

The AI will analyze the PR title and description using Hugging Face's GPT-2 model, and then post a review comment on the PR identifying potential bugs, coding style issues, and suggestions for improvement.

## API Endpoints

- **`GET /auth/github`**: Redirects users to GitHub OAuth for authentication.
- **`GET /auth/github/callback`**: Handles the OAuth callback and creates a GitHub webhook.
- **`POST /webhook`**: Receives GitHub PR events and triggers the AI review process.
- **`GET /`**: Fetches access tokens for debugging purposes.
