import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';
import { Octokit } from '@octokit/rest';
// Importing Hugging Face Inference if you plan to use it
// import { HfInference } from '@huggingface/inference';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// In-memory store for access tokens (for demonstration purposes)
let userAccessTokens = {};

// GitHub OAuth authorization
app.get('/auth/github', (req, res) => {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const redirectUri = process.env.REDIRECT_URI;
  const scope = 'user,repo';
  res.redirect(
    `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`
  );
});

// GitHub OAuth callback and webhook creation
app.get('/auth/github/callback', async (req, res) => {
  const { code } = req.query;
  if (!code) return res.status(400).send('Missing code parameter');

  try {
    const { data } = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        redirect_uri: process.env.REDIRECT_URI,
        code,
      },
      { headers: { Accept: 'application/json' } }
    );

    const { access_token } = data;
    if (!access_token) return res.status(500).send('Failed to exchange code for token');

    userAccessTokens[code] = access_token;
    const octokit = new Octokit({ auth: access_token });

    const repoOwner = 'ayush-singh-26';
    const repoName = 'Sample';

    // Create a webhook
    await createWebhook(octokit, repoOwner, repoName);
    res.send('User authorized and GitHub authentication and webhook creation successful');
  } catch (error) {
    console.error('Error during token exchange:', error.response?.data || error.message);
    res.status(500).send('Error during token exchange');
  }
});

// Function to create GitHub webhook
const createWebhook = async (octokit, owner, repo) => {
  try {
    await octokit.repos.createWebhook({
      owner,
      repo,
      config: {
        url: 'https://spr.openport.io/l/3432//webhook',
        content_type: 'json',
      },
      events: ['pull_request'],
      active: true,
    });
    console.log('Webhook created successfully');
  } catch (error) {
    console.error('Error creating webhook:', error.response?.data || error.message);
    throw new Error('Error creating webhook');
  }
};

// Webhook endpoint for handling GitHub events
app.post('/webhook', async (req, res) => {
  const GITHUB_TOKEN = process.env.GITHUB_ACCESS_TOKEN;
  const { owner, repo } = req.body;

  const octokit = new Octokit({ auth: GITHUB_TOKEN });

  try {
    const { data } = await octokit.request('GET /repos/{owner}/{repo}/pulls', {
      owner,
      repo,
      headers: { 'X-GitHub-Api-Version': '2022-11-28' },
    });

    if (data.length === 0) {
      return res.status(404).send('No pull requests found');
    }

    const prData = data[0];
    console.log('Recent Pull Request:', prData.title);

    const reviewComment = await analyzePullRequestWithAI(prData.title, prData.body);
    await postReviewComment(prData.number, prData.head.repo.owner.login, prData.head.repo.name, reviewComment);

    res.json(data);
  } catch (error) {
    console.error('Error fetching recent deliveries:', error.response ? error.response.data : error.message);
    res.status(500).send('Error fetching recent deliveries');
  }
});

// Analyze the pull request using Hugging Face
const analyzePullRequestWithAI = async (title, body) => {
  const prompt = `Title: ${title}\nDescription: ${body}\nPlease review the following code changes and provide feedback. Identify any potential bugs, coding style issues, and suggestions for improvement.`;
  const maxRetries = 5;
  let attempts = 0;

  while (attempts < maxRetries) {
    try {
      const response = await axios.post(
        'https://api-inference.huggingface.co/models/openai-community/gpt2',
        { inputs: prompt },
        {
          headers: {
            Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('Hugging Face API Response:', response.data);
      return response.data[0]?.generated_text?.trim() || 'No review could be generated at this time.';
    } catch (error) {
      if (error.response && error.response.status === 503) {
        attempts++;
        console.error(`Service unavailable. Attempt ${attempts} of ${maxRetries}. Retrying...`);
        await new Promise(res => setTimeout(res, 5000));
      } else {
        console.error('Error calling Hugging Face API:', error);
        return 'Could not generate review at this time.';
      }
    }
  }

  return 'Could not generate review after multiple attempts.';
};

// Post a comment on the pull request using Octokit
const postReviewComment = async (prNumber, owner, repo, comment) => {
  const octokit = new Octokit({ auth: process.env.GITHUB_ACCESS_TOKEN });

  try {
    console.log('Posting comment:', comment);
    const response = await octokit.issues.createComment({
      owner,
      repo,
      issue_number: prNumber,
      body: comment,
    });
    console.log('Comment posted on PR:', response.data.html_url);
  } catch (error) {
    console.error('Error posting comment:', error);
  }
};

// Fetch tokens for debugging purposes
app.get('/', (req, res) => {
  res.json(userAccessTokens);
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
