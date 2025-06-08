/**
 * Used for all solid base colors
 * @prop active
 * @prop backdrop
 * @prop background
 * @prop border
 * @prop brand
 * @prop button
 * @prop disabled
 * @prop important
 * @prop scroll
 * @prop toggle
 */
export interface ThemeColors {
  /**
   * The color for active buttons and toggles, such as a currently selected drawing tool
   */
  active: string;
  /**
   * The color for floating backdrops, like the player list
   */
  backdrop: string;
  /**
   * The plain color for the whole site background. Will be placed behind any background images
   */
  background: string;
  /**
   * The color for borders around elements, where applicable, such as around drawing "cards"
   */
  border: string;
  /**
   * The "main" color, used in things like the header and footer
   */
  brand: string;
  /**
   * Base color for buttons that are not in a more special state
   */
  button: string;
  /**
   * Color for disabled buttons and turned-off toggles, like the join button when you haven't put in a username
   */
  disabled: string;
  /**
   * Color for high-importance buttons that should stick out, like the "clear canvas" button
   */
  important: string;
  /**
   * Color of the scrollbar, if the browser allows styling
   */
  scroll: string;
  /**
   * Color of the **Handle** on a toggle. The color behind a toggle will use "Active" or "Disabled" respectively
   */
  toggle: string;
}

/**
 * Used for text coloration. Separate from base colors so they can be exactly named as the color they go in front of.
 * @prop active
 * @prop backdrop
 * @prop button
 * @prop heading
 * @prop important
 * @prop link
 * @prop main
 */
export interface ThemeTextColors {
  /**
   * The text/icon color that is used for "active" buttons like your selected tool
   */
  active: string;
  /**
   * The text/icon color used for backdrop text, like the player list
   */
  backdrop: string;
  /**
   * The text/icon color used for "brand" text, like in the footer
   */
  brand: string;
  /**
   * The text/icon color used on normal buttons
   */
  button: string;
  /**
   * The text/icon color used for headings specifically. Doesn't usually have to be different.
   */
  heading: string;
  /**
   * The text/icon color used for "important" buttons
   */
  important: string;
  /**
   * Link text color
   */
  link: string;
  /**
   * Text color used in any scenario not listed
   */
  main: string;
}

/**
 * Used as offsets for hover states.
 * Values will be used as a color mix. The mix balance can also be defined here, like "black, 10%"
 * @prop link
 * @prop button
 */
export interface ThemeHoverColors {
  /**
   * The color difference on hovered active buttons
   */
  active: string;
  /**
   * The color difference on hovered buttons
   */
  button: string;
  /**
   * The color difference on hovered important buttons
   */
  important: string;
  /**
   * The color difference on hovered links
   */
  link: string;
}

/**
 * Used in places with background-image
 * @prop background
 * @prop icon
 * @prop 'small-icon'
 */
export interface ThemeImages {
  /**
   * Full-site background image (see classic theme)
   */
  'background': string;
  /**
   * Alternative icon file for the site logo
   */
  'icon': string;
  /**
   * Alternative icon file for the small site logo that is used in the header
   */
  'small-icon': string;
}
