const handleCache = require('../handleCache');
const commonContent = require('../commonContent');
const cosmos = require('../cosmos');
const surveyData = require('./data');

const updateAttempt = async (attempt) => {
  try {
    const db = await cosmos.initDatabase(process.env.COSMOSDB_CONTAINER_SURVEY);
    const itemToUpdate = await db.item(attempt.id);
    await itemToUpdate.replace(attempt);
  } catch (error) {
    cosmos.logAppInsightsError(error);
  }
};

const getAttempt = async (id) => {
  let attempt = null;

  try {
    const db = await cosmos.initDatabase(process.env.COSMOSDB_CONTAINER_SURVEY);
    const query = {
      query: 'SELECT * FROM c WHERE c.id = @id',
      parameters: [{
        name: '@id',
        value: id
      }]
    };

    const { resources } = await db.items.query(query).fetchAll();

    if ((resources && resources.length)) {
      attempt = resources[0];
    }
  } catch (error) {
    cosmos.logAppInsightsError(error);
  }

  return attempt;
};

const createAttempt = async (body, user, res) => {
  const { codename, email, courseid } = body;
  let attempt = null;

  const survey = await handleCache.evaluateSingle(res, codename, async () => {
    return await commonContent.getSurvey(res, codename);
  });

  const questions = surveyData.getQuestions(survey);

  try {
    const db = await cosmos.initDatabase(process.env.COSMOSDB_CONTAINER_SURVEY);
    attempt = await db.items.create({
      survey_id: survey.items[0].system.id,
      email: email,
      course_id: courseid,
      username: user?.firstName && user?.lastName ? `${user?.firstName} ${user?.lastName}` : email,
      start: new Date().toISOString(),
      end: null,
      questions: questions
    });
  } catch (error) {
    cosmos.logAppInsightsError(error);
  }

  return attempt;
};

module.exports = {
  createAttempt,
  getAttempt,
  updateAttempt
};
