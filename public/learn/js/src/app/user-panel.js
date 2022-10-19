window.initUserProfile = (container) => {
  const DATA_ATTR_PREFIX = 'data-user-profile-';
  const DATA_ATTR_PANEL = `${DATA_ATTR_PREFIX}panel`;
  const DATA_ATTR_TOGGLE = `${DATA_ATTR_PREFIX}toggle`;
  const DATA_ATTR_CONTENT = `${DATA_ATTR_PREFIX}content`;
  const DATA_ATTR_TERMS = `${DATA_ATTR_PREFIX}terms`;
  const DATA_ATTR_UX = `${DATA_ATTR_PREFIX}ux`;

  const registerPanelEvents = (panel, token) => {
    panel.addEventListener('click', async (e) => {
      if (!e.target) return;

      const terms = e.target.closest(`[${DATA_ATTR_TERMS}]`);
      if (terms) {
        window.userProfile = await landingPage.updateUserProfile(token, {
          toc: !!terms.checked
        });
      }

      const ux = e.target.closest(`[${DATA_ATTR_UX}]`);
      if (ux) {
        window.userProfile = await landingPage.updateUserProfile(token, {
          ux: !!ux.checked
        });
      }
    });
  };

  const getPanelContent = async (panel) => {
    if (panel.hasAttribute(DATA_ATTR_CONTENT)) return;

    const token = window.user ? window.user.__raw : null;
    window.userProfile = !window.userProfile || window.userProfile.error ? await landingPage.requestUserProfile(token) : window.userProfile;

    if (!(window.userProfile && window.UIMessages)) return;

    let name = '';
    let email = '';
    if (window.userProfile.firstName && window.userProfile.lastName) {
      name = `${window.userProfile.firstName} ${window.userProfile.lastName}`;
      email = window.userProfile.email;
    }
    if (!name.trim() && window.userProfile.email) {
      name = window.userProfile.email;
      email = '';
    }
    panel.innerHTML = `
      <div class="user-panel__row">
        <div class="user-panel__column">
          <div class="user-panel__name">${name}</div>
          <div class="user-panel__info">
            <span class="user-panel__email">${email}</span>
            <a href="${appUrl || 'https://app.kontent.ai'}/user-profile" target="_blank" class="user-panel__link">${window.UIMessages.edit}</a>
          </div>
        </div>
        <div class="user-panel__column">
          <a href="#" id="logout" class="user-panel__link user-panel__link--signout">${window.UIMessages.signOut}</a>
        </div>
      </div>
      <div class="user-panel__row">
        <div class="user-panel__column">
          <label class="toc" for="toc"><input id="toc" type="checkbox" class="toc__checkbox" ${DATA_ATTR_TERMS}${window.userProfile.toc ? ' checked="checked"' : ''}><div class="toc__label">${window.helper.decodeHTMLEntities(window.UIMessages.toc)}</div></label>
          <label class="toc" for="ux"><input id="ux" type="checkbox" class="toc__checkbox" ${DATA_ATTR_UX}${window.userProfile.ux ? ' checked="checked"' : ''}><div class="toc__label">${window.helper.decodeHTMLEntities(window.UIMessages.contactByUx)}</div></label>
        </div>
      </div>
    `;

    registerPanelEvents(panel, token);

    panel.setAttribute(DATA_ATTR_CONTENT, '')
  };

  const getPanel = (container) => {
    let panel = container.querySelector(`[${DATA_ATTR_PANEL}]`);
    if (!panel) {
      panel = document.createElement('div');
      panel.classList.add('user-panel');
      panel.setAttribute(DATA_ATTR_PANEL, '');
      container.appendChild(panel);
    }
    return panel;
  };  

  const init = (container) => {
    let panel;

    document.querySelector('body').addEventListener('click', (e) => {
      if (!e.target) return;
      
      if (e.target.closest(`[${DATA_ATTR_TOGGLE}]`)) {
        panel = getPanel(container);
        panel.classList.toggle('user-panel--active');
        getPanelContent(panel);
      } else if (e.target.closest(`[${DATA_ATTR_PANEL}]`)) {
        //do nothing
      } else {
        if (panel) panel.classList.remove('user-panel--active');
      }
    }, false);

  };

  return init(container);
};