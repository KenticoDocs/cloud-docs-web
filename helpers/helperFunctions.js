const axios = require('axios');
const cache = require('memory-cache');
const cheerio = require('cheerio');
// const fs = require('fs');
// const { promisify } = require('util');
// const readFileAsync = promisify(fs.readFile);

const helper = {
    escapeHtml: (unsafe) => {
        return unsafe
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    },
    escapeQuotes: (unsafe) => {
        return unsafe
            .replace(/"/g, '\\"')
    },
    escapeQuotesHtml: (unsafe) => {
        return unsafe
            .replace(/"/g, '&quot;')
    },
    removeNewLines: (unsafe) => {
        return unsafe.replace(/\r?\n|\r/g, '');
    },
    getFormValue: (formValues, fieldName) => {
        let value = '';
        if (typeof formValues !== 'undefined') {
            value = formValues[fieldName] || '';
        }
        return value;
    },
    getValidationMessages: (errors, data) => {
        errors.forEach((item) => {
            if (item.msg) {
                if (data.elements && data.elements[item.msg] && data.elements[item.msg].value) {
                    item.msg = data.elements[item.msg].value;
                }

                if (data.content && data.content[item.msg] && data.content[item.msg].value) {
                    item.msg = data.content[item.msg].value;
                }
            }
        });

        return errors;
    },
    getPrismClassName: (item) => {
        let lang;
        const pairings = {
            rest: 'shell',
            shell: 'shell',
            curl: 'shell',
            _net: 'dotnet',
            c_: 'dotnet',
            javascript: 'js',
            json: 'js',
            typescript: 'ts',
            java: 'java',
            android: 'java',
            javarx: 'java',
            php: 'php',
            swift: 'swift',
            python: 'python',
            ruby: 'ruby'
        }

        if (item && item.codename) {
            lang = pairings[item.codename];
        }

        if (!lang) {
            lang = 'clike';
        }

        return `lang-${lang}`;
    },
    stripTags: (text) => {
        return text.replace(/<\/?[^>]+(>|$)/g, '');
    },
    resolveMacros: (text) => {
        // If macro in format {@ sometext @}, replace it by icon
        let replaced = text.replace(/{@[^@]+@}/g, (match) => {
            const text = match.replace('{@', '').replace('@}', '').split('|');
            const icon = text.length ? text[0] : '';
            const tooltip = text.length > 1 ? text[1] : '';

            return `<i aria-hidden="true" class="icon ${helper.escapeHtml(icon)}">${tooltip ? `<span class="icon__tooltip">${tooltip}</span>` : ''}</i>`;
        });

        // If macro in format {~ sometext ~}, replace it by inline code
        replaced = replaced.replace(/{~[^~]+~}/g, (match) => {
            return `<code>${match.replace('{~', '').replace('~}', '')}</code>`;
        });

        return replaced;
    },
    capitalizeFirstLetter: (text) => {
        return text.charAt(0).toUpperCase() + text.slice(1)
    },
    replaceWhitespaceWithDash: (text) => {
        return text.replace(/\s/g, '-');
    },
    removeUnnecessaryWhitespace: (text) => {
        return text.replace(/\s\s+/g, ' ');
    },
    removeUnderscoreElems: (elems) => {
        for (let i = 0; i < elems.length; i++) {
            if (elems[i].startsWith('_')) {
                const index = elems.indexOf(elems[i]);
                if (index > -1) {
                    elems.splice(index, 1);
                }
            }
        }

        return elems;
    },
    sleep: (ms) => {
        return new Promise(resolve => setTimeout(resolve, ms));
    },
    hasLinkedItemOfType: (field, type) => {
        for (const item of field.linkedItems_custom) {
            if (item.type === type) {
                return true;
            }
        }
        return false;
    },
    getReferenceFiles: async (codename, saveToCache, KCDetails, methodName) => {
        let data;
        const baseURL = process.env.referenceRenderUrl;
        const time = (new Date()).toISOString();

        try {
            data = await axios.get(`${baseURL}/api/ProviderStarter?api=${codename}&isPreview=${KCDetails.isPreview ? 'true' : 'false'}&source=${KCDetails.host}&method=${methodName}&t=${time}`);
            /* data = {};
            data.data = await readFileAsync('./helpers/delivery_api.html', 'utf8'); */
        } catch (err) {
            console.error(err)
            try {
                if (baseURL) {
                    data = await axios.get(`https://${KCDetails.isPreview ? 'kcddev' : 'kcdmaster'}.blob.core.windows.net/api-reference-pages/${codename}${KCDetails.isPreview ? '-preview' : ''}.html`);
                }
            } catch (err) {
                data = {};
                data.data = '';
            }
        }

        if (saveToCache) {
            cache.put(`reDocReference_${codename}_${KCDetails.projectid}`, data);
        }
        return data;
    },
    getDomain: () => {
        let domain;

        if (process.env.aliasURL) {
            domain = process.env.aliasURL;
        } else {
            domain = process.env.baseURL;
        }

        return domain;
    },
    addTitlesToLinks: (content, urlMap, articles) => {
        const $ = cheerio.load(content);
        const $links = $('a:not(.call-to-action)');

        $links.each(function () {
            const $that = $(this);
            let url = $that.attr('href').split('#')[0].replace('https://docs.kontent.ai', '');
            let codename = '';
            let title = '';

            for (let i = 0; i < urlMap.length; i++) {
                if (urlMap[i].url === url) {
                    codename = urlMap[i].codename;
                }
            }

            // Some multiplatform articles do not have represetation of their url with tech query string in urlMap
            if (!codename) {
                url = url.split('?')[0];

                for (let i = 0; i < urlMap.length; i++) {
                    if (urlMap[i].url === url) {
                        codename = urlMap[i].codename;
                    }
                }
            }

            if (codename) {
                for (let i = 0; i < articles.length; i++) {
                    if (articles[i].system.codename === codename) {
                        title = articles[i].title.value;
                    }
                }
                if (title) {
                    $that.attr('title', title);
                }
            }
        });

        const output = $.html();
        return output.replace('<html><head></head><body>', '').replace('</body></html>', '');
    },
    getCodenameByUrl: (originalUrl, urlMap) => {
        let codename = '';
        let url = originalUrl.split('#')[0];

        for (let i = 0; i < urlMap.length; i++) {
            if (urlMap[i].url === url) {
                codename = urlMap[i].codename;
            }

            if (!codename) {
                url = originalUrl.split('?')[0];
                if (urlMap[i].url === url) {
                    codename = urlMap[i].codename;
                }
            }
        }
        return codename;
    },
    getMapItemByUrl: (originalUrl, urlMap) => {
        let item;
        let url = originalUrl.split('#')[0];

        for (let i = 0; i < urlMap.length; i++) {
            if (urlMap[i].url === url) {
                item = urlMap[i];
            }

            if (!item) {
                url = originalUrl.split('?')[0];
                if (urlMap[i].url === url) {
                    item = urlMap[i];
                }
            }
        }
        return item;
    },
    generateAnchor: (text) => {
        return text.toLowerCase().replace(/(<([^>]+)>)/g, '').replace(/(&nbsp;)|(&#xa0;)|(&#160;)/g, '-').replace(/&([a-z0-9]+|#[0-9]{1,6}|#x[0-9a-f]{1,6});/g, '').replace(/\W/g, '-').replace(/[-]+/g, '-');
    },
    getPathWithoutQS: (url) => {
        return url.replace(/\?.*$/, '');
    },
    isNotEmptyRichText: (text) => {
        return text && text !== '<p><br></p>';
    },
    ensureProtocol: (url) => {
        return !/^https?:\/\//i.test(url) ? `https://${url}` : url;
    },
    isCodenameInMultipleChoice: (data, codename) => {
        let isIn = false;

        for (let i = 0; i < data.length; i++) {
            if (data[i].codename === codename) {
                isIn = true;
            }
        }

        return isIn;
    },
    preserveQueryString: (url, query) => {
        if (!url) return null;

        const pathQS = url.split('?');
        const path = pathQS[0];
        let qsAnchor = [];
        let qs = '';
        let anchor = '';

        if (pathQS[1]) {
            qsAnchor = pathQS[1].split('#');
            qs = qsAnchor[0];
        }

        if (qsAnchor[1]) {
            anchor = qsAnchor[1];
        }

        if (qs) {
            qs += '&';
        }

        Object.keys(query).forEach((key) => {
            qs += `${key}${query[key] ? `=${query[key]}` : ''}&`;
        });

        qs = qs.slice(0, -1);

        return `${path}${qs ? `?${qs}` : ''}${anchor ? `#${anchor}` : ''}`;
    },
    getRedirectUrls: (urls) => {
        const redirectUrls = urls?.value ? urls.value.trim().replace(/\n/g, '').replace(/;\s*$/, '').split(';') : [];
        redirectUrls.sort();
        return redirectUrls;
    },
    isAbsoluteUrl: (url) => {
        return /^(?:[a-z]+:)?\/\//.test(url);
    },
    logInCacheKey: (key, log) => {
        const logs = cache.get(key) || [];
        logs.unshift(log);
        if (logs.length > 200) {
            logs.length = 200;
        }
        cache.put(key, logs);
    },
    getUniqueUrls: (urlMap) => {
        const uniqueUrls = [];

        for (let i = 0; i < urlMap.length; i++) {
            const url = urlMap[i].url.split('#')[0]; // Remove anchor
            if (!uniqueUrls.includes(url)) {
                uniqueUrls.push(url);
            }
        }

        return uniqueUrls;
    },
    appendQueryParam: (url, paramName, paramVal) => {
        if (!url) return '';
        let separator = '?';
        let queryhash = '';
        const urlSplit = url.split(separator);
        let finalUrl = urlSplit[0];

        if (urlSplit[1]) {
            queryhash = urlSplit[1].split('#');
            finalUrl += `?${queryhash[0]}`;
            separator = '&';
        }

        finalUrl += `${separator}${encodeURIComponent(paramName)}=${encodeURIComponent(paramVal)}`

        if (queryhash[1]) {
            finalUrl += `#${queryhash[1]}`;
        }

        return finalUrl;
    },
    getReadingTime: (content) => {
        const $ = cheerio.load(content);
        $('[data-platform-code]').remove();
        const text = $.text();
        const pureText = helper.removeUnnecessaryWhitespace(helper.removeNewLines(helper.stripTags(text))).trim();
        const wordsCount = pureText.split(' ').length;
        return Math.round(wordsCount / 125) || 1;
    }
};

module.exports = helper;
