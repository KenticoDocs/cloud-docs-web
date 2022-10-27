const checkKKProject = require('./kkProject');
const checkAlgolia = require('./algolia');
const checkSubscriptionService = require('./subscriptionService');
const checkApiReferences = require('./apiReferences');
const checkAuth0 = require('./auth0');
const checkSendgrid = require('./sendgrid');
const checkCosmosDb = require('./cosmosDb');
const checkScorm = require('./scorm');
const checkMissingObjectProperties = require('./missingObjectProperties');
const checkLicenses = require('./licenses');

const checkAll = async () => {
  const checkItems = [{
    name: 'KK Project',
    method: checkKKProject
  }, {
    name: 'Algolia',
    method: checkAlgolia
  }, {
    name: 'Subscription Service',
    method: checkSubscriptionService
  }, {
    name: 'API References',
    method: checkApiReferences
  }, {
    name: 'Scorm',
    method: checkScorm
  }, {
    name: 'Auth0',
    method: checkAuth0
  }, {
    name: 'Sendgrid',
    method: checkSendgrid
  }, {
    name: 'CosmosDB',
    method: checkCosmosDb
  }, {
    name: 'Missing object properties',
    method: checkMissingObjectProperties
  }, {
    name: 'Licenses',
    method: checkLicenses
  }];
  const resultItems = [];

  for (const check of checkItems) {
    const result = await check.method();
    resultItems.push({
      name: check.name,
      result: result
    })
  }

  return resultItems;
};

module.exports = checkAll;
