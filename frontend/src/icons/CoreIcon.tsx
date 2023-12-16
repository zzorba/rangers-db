import React from 'react';
import { useColorMode } from '@chakra-ui/react';
import IcomoonReact from 'icomoon-react';

import iconSet from './core.json';

const CoreIcon: React.FC<{
  color?: string,
  size: string | number,
  icon: string,
  className?: string
}> = props => {
  const { colorMode } = useColorMode();
  const { color, size = "100%", icon, className = "" } = props;
  return (
    <IcomoonReact
      className={className}
      iconSet={iconSet}
      color={color || `var(--chakra-colors-${colorMode}-text)`}
      size={size}
      icon={icon}
    />
  );
};

export default CoreIcon;
