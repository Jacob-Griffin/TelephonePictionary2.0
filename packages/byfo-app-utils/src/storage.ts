import { CustomTheme, type Theme } from '@byfo/themes';

export interface RejoinData {
  gameid: string;
  name: string;
}

const customImageSizeLimit = Math.pow(2, 21);

// Represents the store with the new and improved theme work
export class BYFOStore<T extends readonly string[]> {
  constructor(themes: Record<T[number], Theme>, defaultTheme: T[number]) {
    this.readFromWindow();
    this.themes = themes;
    this.defaultTheme = defaultTheme;
    this.theme = (localStorage.getItem('theme') as T[number]) ?? defaultTheme;
    this.customStyle.install();
    this.themeController.install();
    this.themeController.apply();
  }

  defaultTheme: T[number];

  changeEvent = (setting: string, value: string) =>
    new CustomEvent('tp-settings-changed', { detail: { setting, value } });

  themes: Record<T[number], Theme>;
  theme: T[number];
  setTheme = (v: T[number]) => {
    localStorage.setItem('theme', v);
    this.theme = v;
    this.themeController.install();
    this.themeController.apply();
  };
  get themeController() {
    return this.themes[this.theme];
  }

  customStyle: CustomTheme = CustomTheme.fromJsonString(localStorage.getItem('customStyle') ?? undefined);
  saveCustomStyle() {
    // Not really a setter since custom style needs to be accessed for it to be responsive
    localStorage.setItem('customStyle', this.customStyle.toJsonString());
  }

  async readImageData(event: InputEvent): Promise<void> {
    const files = (event.target as HTMLInputElement).files;
    if (!files || files.length === 0 || this.customStyle.backgroundType !== 'image') {
      return;
    }
    if (files[0].size > customImageSizeLimit) {
      throw new Error('Custom Background Images cannot exceed 2MB');
    }
    const reader = new FileReader();
    const { promise, resolve } = Promise.withResolvers<void>();
    reader.addEventListener('loadend', () => {
      if (typeof reader.result === 'string') {
        this.customStyle.customBackground = (reader.result ?? '') as string;
      }
      resolve();
    });
    reader.readAsDataURL(files[0]);
    return promise;
  }
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

  getRejoinData(): RejoinData | null {
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
      customStyle: customStyle.toJsonString(),
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
    this.customStyle = CustomTheme.fromJsonString(customStyle);
    this.saveCustomStyle();
  }

  clearGameData() {
    this.setUsername(null);
    this.setGameid(null);
    this.setHosting(null);
    this.setRejoinNumber(null);
  }
  //#endregion gamedata
}
