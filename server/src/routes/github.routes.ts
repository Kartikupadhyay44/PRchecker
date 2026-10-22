import { Router, Request, Response } from 'express';
import { githubService } from '../services/github.service.js';

const router = Router();

// Get GitHub contributor analytics for a username
router.get('/user/:username', async (req: Request, res: Response) => {
  try {
    const username = req.params.username as string;
    if (!username || username.trim() === '') {
      return res.status(400).json({ error: 'Username is required' });
    }

    const customToken = req.headers['x-github-token'] as string | undefined;
    const analytics = await githubService.getUserAnalytics(username, customToken);

    return res.json(analytics);
  } catch (err: any) {
    console.error('Error in /api/github/user/:username:', err);
    if (err.status === 404) {
      return res.status(404).json({ error: 'GitHub user not found' });
    }
    if (err.status === 403) {
      return res.status(403).json({
        error: 'GitHub API rate limit exceeded. Please configure a GitHub Personal Access Token in Settings to enjoy 5,000 requests/hour.',
        isRateLimited: true,
      });
    }
    return res.status(500).json({ error: err.message || 'Failed to retrieve user data' });
  }
});

// Validate GitHub URL
router.get('/validate-url', (req: Request, res: Response) => {
  const url = req.query.url as string;
  if (!url) {
    return res.status(400).json({ valid: false, error: 'URL parameter required' });
  }

  const parsed = githubService.parseUrl(url);
  if (!parsed) {
    return res.status(400).json({
      valid: false,
      error: 'Invalid GitHub URL. Expected format: https://github.com/:owner/:repo/(pull|issues)/:number',
    });
  }

  return res.json({
    valid: true,
    ...parsed,
  });
});

export default router;
