const GitHubApi = require('github');

const {
  CLIENT_ID,
  CLIENT_SECRET,
} = process.env;

var github = new GitHubApi({
  headers: {
    "user-agent": "reputation_analysis" // GitHub is happy with a unique user agent
  },
  timeout: 5000,
  debug: true
});

github.authenticate({
  type: "oauth",
  key: CLIENT_ID,
  secret: CLIENT_SECRET
});

module.exports = github;
