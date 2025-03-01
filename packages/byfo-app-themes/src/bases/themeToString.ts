import type { Theme } from './Theme';
/**
 * Outputs the css *rules* for a given theme. No selector is generated
 * @param context the Theme object
 * @returns string of css rules
 */
export function themeToString(context: Theme) {
  let result = ``;
  let { colors, textColors, hoverColors, images } = context.styles;
  const extensions = [context, ...(context.themeExtends ?? [])].toReversed();
  for (const source of extensions) {
    colors = Object.assign({}, colors, source.styles.colors);
    textColors = Object.assign({}, textColors, source.styles.textColors);
    hoverColors = Object.assign({}, hoverColors, source.styles.hoverColors);
    images = Object.assign({}, images, source.styles.images);
  }
  if (colors) {
    for (const key in colors) {
      result += `--byfo-color-${key}:${colors[key as keyof ThemeColors]};`;
    }
  }
  if (textColors) {
    for (const key in textColors) {
      result += `--byfo-text-${key}:${textColors[key as keyof ThemeTextColors]};`;
    }
  }
  if (hoverColors) {
    for (const key in hoverColors) {
      const value = hoverColors[key as keyof ThemeHoverColors];
      const source = `--byfo-${colors && key in colors ? 'color' : 'text'}-${key}`;
      result += `--byfo-hover-${key}:color-mix(in srgb, var(${source}), ${value});`;
    }
  }
  if (images) {
    for (const key in images) {
      result += `--byfo-image-${key}:${images[key as keyof ThemeImages]};`;
    }
  }
  return result;
}
