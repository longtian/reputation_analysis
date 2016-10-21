const github = require('./github');

const listAll = (headers = {}) => res => new Promise(resolve => {
  let result = [];
  const fetchMore = (err, link) => {
    if (err) {
      throw err;
    }
    result = result.concat(link);
    if (github.hasNextPage(link)) {
      github.getNextPage(link, headers, fetchMore)
    } else {
      resolve(result);
    }
  }
  fetchMore(null, res);
});

module.exports = listAll;
