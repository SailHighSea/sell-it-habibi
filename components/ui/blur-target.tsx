import { BlurTargetView } from 'expo-blur';
import { createContext, useContext, useRef, type ReactNode, type RefObject } from 'react';
import { View } from 'react-native';

const Ctx = createContext<RefObject<View | null> | null>(null);

/**
 * Android can only blur what is inside a "blur target". Wrap the screens in this, and put the floating bar (the one thing
 * that blurs) beside it, not inside it. iOS and web blur whatever is behind without any of this.
 */
export function BlurTargetProvider({ children }: { children: ReactNode }) {
  const ref = useRef<View | null>(null);
  return (
    <Ctx.Provider value={ref}>
      <BlurTargetView ref={ref} style={{ flex: 1 }}>
        {children}
      </BlurTargetView>
    </Ctx.Provider>
  );
}

export const useBlurTarget = () => useContext(Ctx);
