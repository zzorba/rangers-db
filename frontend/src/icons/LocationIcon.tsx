import React from 'react';
import { AspectRatio, Box } from '@chakra-ui/react';
import IcomoonReact from 'icomoon-react';

import iconSet from './locations.json';
import { ConnectionRestrictionType, MapLocation, PathType } from '../types/types';


const MapIcon: React.FC<{
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

interface PathIconProps {
  path: PathType;
  size: number;
}

export function PathIcon({ path, size }: PathIconProps) {
  return (
    <AspectRatio width={`${size}px`} ratio={1}>
      <Box borderRadius="50%" backgroundColor="#e4c9a2" width="100%" borderWidth="1px" borderColor="#451c15">
        <MapIcon icon={path.id} color={path.color} size={size - 4} />
      </Box>
    </AspectRatio>
  );
}

interface ConnectionRestrictionIconProps {
  restriction: ConnectionRestrictionType;
  size: number;
}

export function ConnectionRestrictionIcon({ restriction, size }: ConnectionRestrictionIconProps) {
  return (
    <AspectRatio width={`${size}px`} height={`${size}px`} ratio={1}>
      <Box position="relative">
        <Box position="absolute" top={0} left={0}>
          <MapIcon icon="hazard_bg" color="#e4c9a2" size={size} />
        </Box>
        <Box position="absolute" top={0} left={0}>
          <MapIcon icon={restriction.id} color={restriction.color} size={size} />
        </Box>
      </Box>
    </AspectRatio>
  );
}

interface LocationIconProps {
  location: MapLocation;
  size: number;
}

export function LocationIcon({ location, size }: LocationIconProps) {
  return (
    <Box>
      <AspectRatio width={`${size}px`} ratio={1}>
        <Box width="100%" position="relative">
          <Box position="absolute" top={0} left={0}>
            <MapIcon
              icon={`${location.background ? location.id : location.type}_bg`}
              color={location.type === 'location' ? '#F7BC3F' : '#E8CB9E'}
              size={size - 4}
            />
          </Box>
          <Box position="absolute" top={0} left={0}>
            <MapIcon icon={location.id} color="#451C15" size={size - 4} />
          </Box>
        </Box>
      </AspectRatio>
    </Box>
  );
}
