const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');
const github = require('./lib/github');
const listAll = require('./lib/listAll');
const async = require('async');
const _ = require('underscore');

const debug = require('debug')('reputation_analysis');

const {
  USERNAME,
  MONGODB
} = process.env;

MongoClient.connect(MONGODB, function (err, db) {
  assert(!err);
  db.unref();
  debug(`Connected to ${MONGODB}`)

  const repos = db.collection('repos');
  const activities = db.collection('activity');
  const users = db.collection('user');

  const fetchRepos = github.repos.getForUser({ user: USERNAME, per_page: 100 }).then(listAll({}));

  github.users.getForUser({
    user: USERNAME
  }).then(user => {
    users.updateOne(
      {
        _id: user.id
      },
      Object.assign({},
        _.omit(user, ['id', 'meta']),
        {
          created_at: new Date(user.created_at),
          updated_at: new Date(user.updated_at),
        }
      ),
      {
        upsert: true
      },
      ()=> {
        debug(`Saved ${USERNAME} to user`)
      }
    );
  });

  fetchRepos.then(repositories => {
    const [firstRepo ] = repositories;
    if (firstRepo) {

      const ommitKeys = Object.keys(firstRepo).filter(k => k.endsWith('_url'));

      repos.bulkWrite(
        repositories.map(repo=>({
          updateOne: {
            filter: {
              _id: repo.id,
            },
            update: Object.assign(_.omit(repo, [...ommitKeys, 'owner', 'id']), {
              _id: repo.id,
              created_at: new Date(repo.created_at),
              updated_at: new Date(repo.updated_at),
              pushed_at: new Date(repo.pushed_at),
            }),
            upsert: true
          }
        })), ()=> {
          debug(`Saved ${repositories.length} repos for ${USERNAME}`)
        }
      );
    }
  });

  fetchRepos.then(res => new Promise(resolve => {
    const DEFAULT_HEADERS = {
      Accept: 'application/vnd.github.v3.star+json'
    };
    async.eachLimit(res, 3, (repo, done)=> {
      github.activity.getStargazersForRepo({
        owner: USERNAME,
        repo: repo.name,
        per_page: 100,
        headers: DEFAULT_HEADERS
      }).then(listAll(DEFAULT_HEADERS)).then(stargazers => {
        if (!stargazers.length) {
          done();
        } else {
          activities.bulkWrite(
            stargazers.map(stargazer=>({
              updateOne: {
                filter: {
                  id: stargazer.user.id,
                  full_name: repo.full_name,
                  type: 'star'
                },
                update: {
                  id: stargazer.user.id,
                  date: new Date(stargazer.starred_at),
                  full_name: repo.full_name,
                  login: stargazer.user.login,
                  type: 'star'
                },
                upsert: true
              }
            })),
            ()=> {
              debug(`Saved ${stargazers.length} stargazers for ${repo.full_name}`);
              done();
            }
          );
        }
      })
    }, resolve);
  }))

});


setTimeout(()=> {
  console.log('timeout after 99 seconds')
  process.exit(0);
}, 99000);







