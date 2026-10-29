import { Image } from 'expo-image';
import { View } from 'react-native';

/** The app icon (souk awning with a tag), used where the app shows its own mark. */
export function Logo({ size = 36 }: { size?: number }) {
  return (
    <View accessible accessibilityLabel="Sell It Habibi" style={{ width: size, height: size, borderRadius: size * 0.225, overflow: 'hidden' }}>
      <Image source={require('../../assets/images/icon.png')} style={{ width: size, height: size }} contentFit="cover" />
    </View>
  );
}
