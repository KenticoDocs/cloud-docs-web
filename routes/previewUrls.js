const express = require('express');
const asyncHandler = require('express-async-handler');
const router = express.Router();
const cache = require('memory-cache');
const commonContent = require('../helpers/commonContent');
const requestDelivery = require('../helpers/requestDelivery');
const handleCache = require('../helpers/handleCache');

const getType = (params) => {
    let type = '';
    if (params.article) {
        type = 'article';
    } else if (params.scenario) {
        type = 'scenario';
    }
    return type;
};

const getItem = async (res, type, slug) => {
    const KCDetails = commonContent.getKCDetails(res);
    const urlMap = cache.get(`urlMap_${KCDetails.projectid}`);

    return await handleCache.evaluateSingle(res, `${type}_${slug}`, async () => {
        return await requestDelivery({
            type: type,
            slug: slug,
            depth: 2,
            resolveRichText: true,
            urlMap: urlMap,
            ...KCDetails
        });
    });
};

router.get(['/article/:article', '/scenario/:scenario'], asyncHandler(async (req, res, next) => {
    const KCDetails = commonContent.getKCDetails(res);
    const urlMap = cache.get(`urlMap_${KCDetails.projectid}`);
    const type = getType(req.params);
    const urlSlug = req.params.article || req.params.scenario;
    let item = await getItem(res, type, urlSlug);

    if (item.length) {
        const redirectUrl = urlMap.filter(url => {
            return url.codename === item[0].system.codename;
        });
        if (redirectUrl.length) {
            return res.redirect(301, redirectUrl[0].url);
        }
        if (type === 'article') {
            return res.redirect(301, `/other/${urlSlug}`);
        }
    }

    return next();
}));

module.exports = router;
