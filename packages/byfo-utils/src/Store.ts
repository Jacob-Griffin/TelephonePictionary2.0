import { themes } from 'byfo-themes';

const customStyleDefaults: Record<string, string> = {
  backgroundBlur: '0',
  backgroundBrightness: '1',
  backgroundSaturation: '1',
};
export class TPStore {
  constructor() {
    this.readFromWindow();
  }

  changeEvent = (setting: string, value: string) =>
    new CustomEvent('tp-settings-changed', { detail: { setting, value } });

  theme: string = localStorage.getItem('theme') ?? 'classic';
  setTheme = (v: string) => {
    this.useTheme(v);
    localStorage.setItem('theme', v);
    this.theme = v;
  };

  useTheme = (theme: string = this.theme) => {
    document.body.setAttribute('class', '');
    const visitedThemes = new Set();
    let currentTheme: string | undefined = theme;
    while (currentTheme && !visitedThemes.has(currentTheme)) {
      visitedThemes.add(currentTheme);
      document.body.classList.add(currentTheme);
      currentTheme = themes[currentTheme].extends;
    }
  };

  customStyle: Record<string, string> = {
    backgroundBlur: localStorage.getItem('backgroundBlur') ?? customStyleDefaults['backgroundBlur'],
    backgroundBrightness:
      localStorage.getItem('backgroundBrightness') ?? customStyleDefaults['backgroundBrightness'],
    backgroundSaturation:
      localStorage.getItem('backgroundSaturation') ?? customStyleDefaults['backgroundSaturation'],
  };
  setCustomStyle = (prop: string, v: string | number) => {
    this.customStyle[prop] = `${v}`;
    localStorage.setItem(prop, `${v}`);
    this.useCustomStyles();
  };
  resetCustomStyles = () => {
    this.customStyle = { ...customStyleDefaults };
    Object.entries(customStyleDefaults).forEach(([prop, value]) => {
      localStorage.setItem(prop, value);
    });
    this.useCustomStyles();
  };

  useCustomStyles = () => {
    let styleTag = document.getElementById('customized-theme');
    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = 'customized-theme';
      document.head.appendChild(styleTag);
    }

    styleTag.innerHTML = '';
    const newStyles = Object.entries(this.customStyle).map(([prop, value]) => {
      const kabobPropName = prop.replace(/[A-Z]/, char => `-${char.toLowerCase()}`);
      return `--customized-${kabobPropName}: ${value};`;
    });
    styleTag.innerText = `:root{${newStyles.join('')}}`;
  };
  //#endregion theme

  alwaysShowAll = !!localStorage.getItem('alwaysShowAll');
  setShowAll = (v: boolean) => {
    localStorage.setItem('alwaysShowAll', !v ? '' : 'true');
    this.alwaysShowAll = !!v;
    const e = this.changeEvent('alwaysShowAll', `${!!v}`);
    document.dispatchEvent(e);
  };

  landscapeDismissed = !!sessionStorage.getItem('landscapeDismissed');
  setLandscapeDismissed = (v: boolean) => {
    sessionStorage.setItem('landscapeDismissed', !v ? '' : 'true');
    this.landscapeDismissed = true;
    const e = this.changeEvent('landscapeDismissed', `${!!v}`);
    document.dispatchEvent(e);
  };

  //#region gamedata
  username = localStorage.getItem('username');
  setUsername = (v: string | null) => {
    if (!v) {
      localStorage.removeItem('username');
      this.username = null;
      return;
    }
    localStorage.setItem('username', v);
    this.username = v;
  };

  gameid = localStorage.getItem('game-playing');
  setGameid = (v: string | null) => {
    if (!v) {
      localStorage.removeItem('game-playing');
      this.gameid = null;
      return;
    }
    localStorage.setItem('game-playing', v);
    this.gameid = v;
  };

  hosting = localStorage.getItem('hosting');
  setHosting = (v: string | null) => {
    if (!v) {
      localStorage.removeItem('hosting');
      this.hosting = null;
      return;
    }
    localStorage.setItem('hosting', v);
    this.hosting = v;
  };

  rejoinNumber = localStorage.getItem('rejoinNumber');
  setRejoinNumber = (v: string | null) => {
    if (!v) {
      localStorage.removeItem('rejoinNumber');
      this.rejoinNumber = null;
      return;
    }
    localStorage.setItem('rejoinNumber', v);
    this.rejoinNumber = v;
  };

  getRejoinData(): RejoinData {
    if (!this.gameid || !this.username) return null;
    return {
      gameid: this.gameid,
      name: this.username,
    };
  }

  getString() {
    const { rejoinNumber, hosting, gameid, username, theme, landscapeDismissed, customStyle } = this;
    const transferrableData = {
      rejoinNumber,
      hosting,
      gameid,
      username,
      theme,
      landscapeDismissed,
      customStyle,
    };
    const strData = encodeURIComponent(JSON.stringify(transferrableData));
    return `branchswitchdata=${strData}`;
  }

  readFromWindow() {
    const branchSwitchRegex = /branchswitchdata=([^&?=]+)/;
    const branchSwitchData = window.location.search.match(branchSwitchRegex)?.[1];
    if (!branchSwitchData) {
      return;
    }
    const { rejoinNumber, hosting, gameid, username, theme, landscapeDismissed, customStyle } = JSON.parse(
      decodeURIComponent(branchSwitchData),
    );
    const newLocation = window.location.href.replace(branchSwitchRegex, '');
    window.location.replace(newLocation);
    if (rejoinNumber) this.setRejoinNumber(rejoinNumber);
    if (hosting) this.setHosting(hosting);
    if (gameid) this.setGameid(gameid);
    if (username) this.setUsername(username);
    if (theme) this.setTheme(theme);
    if (landscapeDismissed) this.setLandscapeDismissed(landscapeDismissed);
    if (!customStyle) return;
    for (const prop in customStyle) {
      this.setCustomStyle(prop, customStyle[prop]);
    }
  }

  clearGameData() {
    this.setUsername(null);
    this.setGameid(null);
    this.setHosting(null);
    this.setRejoinNumber(null);
  }
  //#endregion gamedata
}

export interface RejoinData {
  gameid: string;
  name: string;
}
