const express = require('express');
const router = express.Router();
const cache = require('memory-cache');
const signatureHelper = require('@kentico/kontent-webhook-helper');
var util = require('util');
const asyncHandler = require('express-async-handler');
const cacheInvalidate = require('../helpers/cacheInvalidate');

const isValidSignature = (req, secret) => {
    return signatureHelper(req.body, secret, req.headers['x-kc-signature']);
};

const poolPayload = (req) => {
    const items = JSON.parse(req.body).data.items;
    const pool = cache.get('webhook-payload-pool') || [];

    for (let i = 0; i < items.length; i++) {
        let itemExists = false;

        for (let j = 0; j < pool.length; j++) {
            if (pool[j].codename === items[i].codename) {
                itemExists = true;
            }
        }

        if (!itemExists) {
            pool.push(items[i]);
        }
    }

    cache.put('webhook-payload-pool', pool);
};

const logInvalidate = (log) => {
    const key = 'cache-invalidate';
    const logs = cache.get(key) || [];
    logs.unshift(log);
    if (logs.length > 200) {
        logs.length = 200;
    }
    cache.put(key, logs);
};

router.post('/', asyncHandler(async (req, res) => {
    const log = {
        timestamp: (new Date()).toISOString(),
        env: false,
        valid: false
    };

    if (process.env['Webhook.Cache.Invalidate.CommonContent']) {
        log.env = true;
        if (isValidSignature(req, process.env['Webhook.Cache.Invalidate.CommonContent'])) {
            log.valid = true;
            poolPayload(req, res);
        }
    }

    log.pool = util.inspect(cache.get('webhook-payload-pool'), {
        maxArrayLength: 500
    });

    logInvalidate(log);
    return res.end();
}));

router.post('/pool', asyncHandler(async (req, res) => {
    await cacheInvalidate(res);
    cache.del('webhook-payload-pool');
    return res.end();
}));

router.get('/keys', (req, res) => {
    const keys = cache.keys();
    keys.sort();
    res.cacheControl = {
        maxAge: 0
    };
    return res.render('tutorials/pages/cacheKeys', { keys });
});

router.get('/keys/:key', (req, res) => {
    const key = cache.get(req.params.key);
    res.set('Content-Type', 'text/plain');
    res.cacheControl = {
        maxAge: 0
    };
    return res.send(util.inspect(key, {
        maxArrayLength: 200
    }));
});

router.get('/keys/:key/invalidate', (req, res) => {
    cache.del(req.params.key);
    return res.redirect('/cache-invalidate/keys');
});

module.exports = router;
