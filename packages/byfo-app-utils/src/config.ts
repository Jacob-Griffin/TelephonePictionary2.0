export const config: BYFOConfig = {
  minPlayers: 3,
  maxPlayers: 20,
  /**
   * The minimum round length in seconds
   */
  minRoundLength: 3,
  /**
   * The maximum round length in minutes
   */
  maxRoundLength: 20,
  textboxMaxCharacters: 280,
  usernameMaxCharacters: 32,
  /**
   * The amount of time to add when the host clicks "Add time" (in seconds)
   */
  addTimeIncrement: 30,
};

export interface BYFOConfig {
  minPlayers: number;
  maxPlayers: number;
  minRoundLength: number;
  maxRoundLength: number;
  textboxMaxCharacters: number;
  usernameMaxCharacters: number;
  addTimeIncrement: number;
}
