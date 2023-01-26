import React from 'react';
import { AspectRatio, Box, Flex, Text, useColorMode } from '@chakra-ui/react';
import IcomoonReact from 'icomoon-react';

import iconSet from './moon.json';

const MoonPhaseIcon: React.FC<{
  color?: string,
  size: string | number,
  icon: string,
  className?: string
}> = props => {
  const { color, size = "100%", icon, className = "" } = props;
  return (
    <IcomoonReact
      className={className}
      iconSet={iconSet}
      color={color}
      size={size}
      icon={icon}
    />
  );
};

interface MoonIconProps {
  day: number;
  size: number;
  currentDay: number;
}

export function MoonIcon({ day, size, currentDay }: MoonIconProps) {
  const { colorMode } = useColorMode();
  const isPast = currentDay > day;
  const position = currentDay === day ? '-3px' : "-1px";
  return (
    <AspectRatio key={day} minWidth={`${size}px`} ratio={1}>
      <Box borderRadius={`${size / 2}px`}
        borderWidth={currentDay === day ? '3px' : '1px'}
        borderColor={isPast ? 'gray.500' : `${colorMode}.text`}
        backgroundColor={currentDay > day ? `${colorMode}.veryLightText` : undefined}
        position="relative"
      >
        <Box position="absolute" width={`${size}px`} height={`${size}px`} top={position} left={position}>
          <MoonPhaseIcon icon={`day_${day}`} size={size} color={
            `var(--chakra-colors-${colorMode}-${isPast ? 'invertedVeryLightText' : 'veryLightText'}`
          } />
        </Box>
        <Flex direction="column" alignItems="center" justifyContent="center" position="absolute" width={`${size}px`} height={`${size}px`} top={position} left={position}>
          <Text
            color={isPast ? 'gray.500' : undefined}
            fontWeight={isPast ? '400' : '600'}
            textDecorationLine={isPast ? 'line-through' : undefined}
          >&nbsp;{day}&nbsp;</Text>
        </Flex>
      </Box>
    </AspectRatio>
  );
}
