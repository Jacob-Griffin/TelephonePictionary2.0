export declare class TPStore {
    changeEvent: (setting: string, value: string) => CustomEvent<{
        setting: string;
        value: string;
    }>;
    theme: string;
    setTheme: (v: string) => void;
    useTheme: (theme?: string) => void;
    alwaysShowAll: boolean;
    setShowAll: (v: boolean) => void;
    landscapeDismissed: boolean;
    setLandscapeDismissed: (v: boolean) => void;
    username: string;
    setUsername: (v: string) => void;
    gameid: string;
    setGameid: (v: string) => void;
    hosting: string;
    setHosting: (v: string) => void;
    rejoinNumber: string;
    setRejoinNumber: (v: string) => void;
    getRejoinData(): {
        gameid: string;
        name: string;
    };
    clearGameData(): void;
}
