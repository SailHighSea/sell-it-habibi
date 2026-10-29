import { Platform, type ViewStyle } from 'react-native';

import { withAlpha } from './color';

/** A CSS background-image (gradients) as a React Native style: the native property on phones, the CSS one on web. */
export function backgroundImage(css: string): ViewStyle {
  return (Platform.OS === 'web' ? { backgroundImage: css } : { experimental_backgroundImage: css }) as ViewStyle;
}

/**
 * Same glass as the Family Expenses app: a soft light sheen from the top left that fades out, and a thin light edge.
 * Put it on a card whose fill is already a translucent `bg-surface`. Light 0.30, dark 0.10 at the brightest corner.
 */
export function glassSheen(dark: boolean): ViewStyle {
  const white = (a: number) => withAlpha('#ffffff', a);
  return backgroundImage(`linear-gradient(135deg, ${white(dark ? 0.1 : 0.3)}, ${white(0)})`);
}
