import React from 'react';
import { AspectRatio, Box, Image, Text } from '@chakra-ui/react';
import { CardFragment } from '../generated/graphql/apollo-schema';
import CoreIcon from '../icons/CoreIcon';
const CARD_RATIO = 1.42333333333;

const MAX_WIDTH = {
  small: [250, 200, 200, 225],
  large: [250, 250, 300],
}
export default function CardImage({ title, size, url }: { title: string; size: 'small' | 'large'; url: string }) {
  return (
    <Box flex={1}>
      <AspectRatio width={MAX_WIDTH[size]} ratio={1 / CARD_RATIO}>
        <Image
          src={`https://static.rangersdb.com${url}`}
          objectFit="contain"
          alt={title}
        />
      </AspectRatio>
    </Box>
  );
}

export function CardImagePlaceholder({ card, children, size }: { card: CardFragment; children: React.ReactNode; size: 'small' | 'large' }) {
  return (
    <Box flex={1}>
      <AspectRatio width={MAX_WIDTH[size]} ratio={1 / CARD_RATIO}>
        <Box>
          { children }
        </Box>
      </AspectRatio>
    </Box>
  );
}

const CARD_WIDTH = 140;

const sizes = {
  large: '80px',
  medium: '64px',
  small: '50px',
};

export function RoleImage({ name, url, size = 'medium', includeTaboo }: {
  name: string | undefined | null;
  url: string;
  size?: 'large' | 'medium' | 'small';
  includeTaboo?: boolean;
}) {
  const theSize = sizes[size];
  return (
    <Box
      width={theSize}
      minWidth={theSize}
      height={theSize}
      marginRight={2}
      position="relative"
      overflow="hidden"
      borderWidth={2}
      borderColor="gray.500"
    >
      <img
        alt={name || 'Role'}
        src={`https://static.rangersdb.com${url}`}
        style={{
          width: CARD_WIDTH,
          height: CARD_WIDTH * CARD_RATIO,
          position: 'absolute',
          objectFit: 'cover',
          top: -28
        }}
      />
      { !!includeTaboo && (
        <Box position="absolute" bottom={-1} right={0} zIndex={1}>
          <CoreIcon icon="uncommon_wisdom" size={18} color="#FFFFFF" />
        </Box>
      ) }
    </Box>
  )
}