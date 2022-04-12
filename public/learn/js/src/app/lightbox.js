/**
 * Initializes lightbox and caption if available
 */
(() => {
  const showCloseButtonOnElemLoaded = (elemSelector, instance) => {
    const close = document.querySelector('.basicLightbox__close-container--hidden');
    const elem = document.querySelector(`.basicLightbox__close-container + ${elemSelector}`);
    const interval = setInterval(function () {
      if (close && elem) {
        if (elem.clientWidth > 0) {
          close.classList.remove('basicLightbox__close-container--hidden');
          close.querySelector('.basicLightbox__close').addEventListener('click', function () {
            if (instance && instance.close) {
              instance.close();
            }
          });
          clearInterval(interval);
        }
      }
    }, 250);
  };

  const registerCloseOnElemClick = (instance, elemSelector) => {
    document.querySelector(elemSelector).addEventListener('click', () => {
      if (instance && instance.close) {
        instance.close();
      }
    });
  };

  const registerCloseOnEsc = (instance) => {
    document.onkeydown = function(e) {
      e = e || window.event;
      if (e.key === 'Escape' && instance && instance.close) {
        instance.close();
      }
    };
  };

  const initLightboxOnElemsAvailable = (selector, callback) => {
    const interval = setInterval(() => {
      const elems = document.querySelectorAll(selector);

      if (elems.length) {
        callback();
        clearInterval(interval);
      }
    }, 100);
  };

  const registerCloseOnPlaceholder = (instance) => {
    document.querySelector('body').addEventListener('click', (e) => {
      const shouldClose = e.target.closest('.basicLightbox__placeholder') && !e.target.closest('.basicLightbox__content-container');
      if (instance && instance.close && e.target.closest && shouldClose) {
        instance.close();
      }
    });
  };

  const zoomItem = (elemSelector, basicLightboxInstance, content, figcaption, callback, link) => {
    const closeMarkup = '<div class="basicLightbox__close-container basicLightbox__close-container--hidden"><div class="basicLightbox__close"></div></div>';
    basicLightboxInstance = window.basicLightbox.create(`<div class="basicLightbox__content-container">${closeMarkup}${content}${figcaption}</div>`, {
      onShow: () => {
        if (callback && link) callback(link);
      },
      onClose: () => {
        if (callback) callback();
      }
    });
    basicLightboxInstance.show();

    if (elemSelector === 'video') {
      const video = document.querySelector('.basicLightbox video');
      videoHelper.init({
        elem: video,
        loop: 3,
        customControls: ['play/pause', 'replay']
      });
      elemSelector = '.video-controls';
    }

    showCloseButtonOnElemLoaded(elemSelector, basicLightboxInstance);
    registerCloseOnEsc(basicLightboxInstance);
    registerCloseOnPlaceholder(basicLightboxInstance);

    return basicLightboxInstance;
  };

  const initLightboxOnImages = () => {
    setTimeout(() => {
      const initLightbox = () => {
        document.querySelectorAll('[data-lightbox-image]').forEach((item) => {
          // Find caption in DOM generated by Kentico Kontent
          const nextSibling = item.nextSibling;
          const nextNextSibling = nextSibling.nextSibling;
          let captionElem = null;
          let figcaption = '';
          if (nextSibling && nextSibling.tagName === 'FIGCAPTION') {
            captionElem = nextSibling;
          } else if (nextNextSibling && nextNextSibling.tagName === 'FIGCAPTION') {
            captionElem = nextNextSibling;
          }
          if (captionElem !== null) {
            figcaption = `<div class="basicLightbox__description">${captionElem.innerHTML}</div>`;
          }

          const width = item.getAttribute('width');
          const height = item.getAttribute('height');
          const url = item.getAttribute('src').split('?');
          const qs = url[1].includes('&rect=') ? url[1] : 'w=1600&fm=pjpg&auto=format';

          const content = `<img src="${url[0]}?${qs}"${width ? ` width=${width}` : ''}${height ? ` height=${height}` : ''}>`;

          // Init lighbox with caption
          let instance;
          item.addEventListener('click', () => {
            if (!window.kontentSmartLinkEnabled) {
              instance = zoomItem('img', instance, content, figcaption);
            }
          });
        });
      }

      initLightboxOnElemsAvailable('[data-lightbox-image]', initLightbox);
    }, 0);
  };

  const initLightboxOnEmbeds = () => {
    setTimeout(() => {
      const initLightbox = () => {
        document.querySelectorAll('[data-lightbox-embed]').forEach((item) => {
          // Find caption in DOM generated by Kentico Kontent
          const figcaptionElem = item.parentNode.nextSibling;
          let captionElem = null;
          let figcaption = '';
          if (figcaptionElem && figcaptionElem.classList.contains('figcaption')) {
            captionElem = figcaptionElem;
          }
          if (captionElem !== null) {
            figcaption = `<div class="basicLightbox__description">${captionElem.innerHTML}</div>`;
          }

          // Init lighbox
          let instance;
          item.addEventListener('click', (e) => {
            e.preventDefault();
            if (!window.kontentSmartLinkEnabled) {
              const itemToZoom = document.querySelector(`#${item.getAttribute('data-lightbox-embed')} iframe`);
              const wrap = document.createElement('div');
              wrap.appendChild(itemToZoom.cloneNode(true));

              if (itemToZoom) {
                instance = zoomItem('iframe', instance, wrap.innerHTML, figcaption);
              }
            }
          });
        });
      }

      initLightboxOnElemsAvailable('[data-lightbox-embed]', initLightbox);
    }, 0);
  };

  const initLightboxOnChangelog = () => {
    setTimeout(() => {
      const initLightbox = () => {
        document.querySelectorAll('[href="#subscribe-breaking-changes-email"]').forEach((item) => {
          // Init lighbox with caption
          let instance;
          item.addEventListener('click', (e) => {
            e.preventDefault();
            if (!window.kontentSmartLinkEnabled) {
              const itemToZoom = '<div class="iframe-box"><div class="iframe-box__close"></div><iframe width="240" height="145" src="https://tracker.kontent.ai/l/849473/2020-04-21/4qsx" /></div>';

              if (itemToZoom) {
                instance = window.basicLightbox.create(itemToZoom);
                instance.show();
                registerCloseOnEsc(instance);
                registerCloseOnElemClick(instance, '.iframe-box__close');
              }
            }
          });
        });
      }

      initLightboxOnElemsAvailable('[href="#subscribe-breaking-changes-email"]', initLightbox);
    }, 0);
  };

  const initLightboxOnVideos = () => {
    setTimeout(() => {
      const initLightbox = () => {
        document.querySelector('body').addEventListener('click', (e) => {
          if (!e.target.matches('.video-controls__lightbox')) return;
          e.preventDefault();
          const item = e.target.parentNode.parentNode;
          let figcaptionElem = item.nextSibling;
          let captionElem = null;
          let figcaption = '';
          if (!figcaptionElem) {
            figcaptionElem = item.parentNode.nextSibling;
          }
          if (figcaptionElem && figcaptionElem.tagName === 'FIGCAPTION') {
            captionElem = figcaptionElem;
          }
          if (captionElem !== null) {
            figcaption = `<div class="basicLightbox__description">${captionElem.innerHTML}</div>`;
          }

          const itemToZoom = item.querySelector('video');
          const wrap = document.createElement('div');
          wrap.appendChild(itemToZoom.cloneNode(true)); 

          if (itemToZoom) {
            let instance;
            instance = zoomItem('video', instance, `<div class="video-controls">${wrap.innerHTML}</div>`, figcaption);
          }
        })
      }

      initLightboxOnElemsAvailable('[data-lightbox-video]', initLightbox);
    }, 0);
  };

  const initLightboxOnLandingPage = () => {

    const handleUrl = (path) => {
      const url = path || pathRoot || '';
      window.history.pushState('', '', url);

      if (ga) {
        //ga('create', 'UA-134087903-1', 'auto');
        ga('send', 'pageview', url);
      }
    };  

    const handleLightBox = (e) => {
      let item;
      let link;
      let linkUrl;
      let callback;
      let target;
      if (e) {
        target = e.target;
        if (target.closest('[data-lp-certificate]')) return;
        item = target.closest('[data-lp-lightbox-invoke]');
        if (item) {
          const id = item.getAttribute('data-lp-lightbox-invoke');
          target = document.querySelector(`[data-lp-lightbox][data-lp-item="${id}"]`);
        }
        item = target.closest('[data-lp-lightbox]');
        if (item && e.preventDefault) {
          link = target.closest('[data-lp-link]');
          callback = handleUrl;
          e.preventDefault();
        }
      } else {
        item = document.querySelector(`[data-lp-lightbox-autoinvoke]`);
        callback = handleUrl;
      }
      if (!item) return;

      if (link) linkUrl = link.getAttribute('href');

      const image = item.querySelector('[data-lp-lightbox-data="image"]');
      const title = item.querySelector('[data-lp-lightbox-data="title"]');
      const description = item.querySelector('[data-lp-lightbox-data="description"]');
      const personas = item.querySelectorAll('[data-lp-persona]');
      const duration = item.querySelector('[data-lp-lightbox-data="duration"]');
      const isFree = item.querySelector('[data-lp-lightbox-data="free"]');
      const id = item.getAttribute('data-lp-item');
      const isComingSoon = item.hasAttribute('data-lp-comingsoon');
      

      const markup = `
      <div class="card card--lightbox" data-lp-active-lightbox="${id}">
        <div class="card__img">
          <img src="${image.getAttribute('src')}">
          <div class="card__content">
            <div class="card__row card__row--space-between card__row--align-items-center">
              <ul class="card__tag-list">
                ${Array.from(personas).map((tag) => `<li class="card__tag">${tag.innerHTML}</li>`).join('')}
              </ul>
              <div class="card__duration">${duration.innerHTML}</div>
            </div>
            <h3 class="card__title">${title.innerHTML}</h3>
            <div class="card__description">${description.innerHTML}</div>  
            ${isComingSoon ? `
              <strong class="card__message">${window.UIMessages.comingSoon}</strong>
            ` : `
              <div class="card__row card__row--space-between card__row--actions" data-lp-active-lightbox-actions>
                ${landingPage.renderLigthboxActions(id, isFree)}
              </div>
            `}
          </div>
        </div>
      </div>`
      
      const wrap = document.createElement('div');
      wrap.innerHTML = markup;

      let instance;
      instance = zoomItem('.card', instance, wrap.innerHTML, '', callback, linkUrl);
      return instance;
    };

    setTimeout(() => {
      const initLightbox = () => {
        let instance = handleLightBox();
        document.querySelector('body').addEventListener('click', (e) => {
          instance = handleLightBox(e);
        });
        window.onpopstate = window.onpushstate = function(e) {
          if (instance && instance.visible()) {
            instance.onClose = null;
            instance.close();
          } else {
            const item = document.querySelector(`[data-lp-link][href="${window.location.pathname}"]:not([data-lp-lighbox-invoke])`);
            if (!item) return;
            instance = handleLightBox({ target: item });
          }
        };
      }

      initLightboxOnElemsAvailable('[data-lp-lightbox]', initLightbox);
    }, 0);
  };

  initLightboxOnImages();
  initLightboxOnEmbeds();
  initLightboxOnChangelog();
  initLightboxOnVideos();
  initLightboxOnLandingPage();
})();
