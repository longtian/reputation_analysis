const GitHubApi = require('github');

const {
  CLIENT_ID,
  CLIENT_SECRET,
  DEBUG_GITHUB
} = process.env;

var github = new GitHubApi({
  headers: {
    "user-agent": "reputation_analysis" // GitHub is happy with a unique user agent
  },
  timeout: 5000,
  debug: DEBUG_GITHUB
});

github.authenticate({
  type: "oauth",
  key: CLIENT_ID,
  secret: CLIENT_SECRET
});

module.exports = github;
