const express = require('express');
const router = express.Router();

const handleCache = require('../helpers/handleCache');
const commonContent = require('../helpers/commonContent');
const helper = require('../helpers/helperFunctions')

router.get('*', async (req, res, next) => {
    const rules = await handleCache.evaluateSingle(res, 'redirectRules', async () => {
        return await commonContent.getRedirectRules(res);
    });
    const normalizedUrlPath = req.originalUrl.toLowerCase().split('?')[0];

    if (rules) {
        for (let i = 0; i < rules.length; i++) {
            if (rules[i].redirect_to && rules[i].redirect_to.value && rules[i].redirect_from && rules[i].redirect_from.value) {
                const normalizedRedirectFrom = `/learn${rules[i].redirect_from.value}${helper.addTrailingSlash(rules[i].redirect_from.value)}`;
                if (normalizedRedirectFrom === normalizedUrlPath) {
                    const url = rules[i].redirect_to.value.includes('://') ? rules[i].redirect_to.value : `/learn${rules[i].redirect_to.value}${helper.addTrailingSlash(rules[i].redirect_to.value)}`;
                    return res.redirect(301, url);
                }
            }
        }
    }

    return next();
});

module.exports = router;
