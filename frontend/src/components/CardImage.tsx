import React from 'react';
import { AspectRatio, Box, Image } from '@chakra-ui/react';
import { map } from 'lodash';
const CARD_RATIO = 1.42333333333;

const MAX_WIDTH = {
  small: [150, 150, 200, 225],
  large: [100, 200, 300, 400],
}
const MAX_HEIGHT = {
  small: map(MAX_WIDTH.small, x => x * CARD_RATIO),
  large: map(MAX_WIDTH.large, x => x * CARD_RATIO),
}
export default function CardImage({ title, size, url }: { title: string; size: 'small' | 'large'; url: string }) {
  return (
    <Box margin={size === 'large' ? 2 : 1} maxW={MAX_WIDTH[size]} maxH={MAX_HEIGHT[size]} boxSize="xs">
      <AspectRatio maxW={MAX_WIDTH[size]} ratio={1 / CARD_RATIO}>
        <Image
          src={`https://static.rangersdb.com${url}`}
          objectFit="contain"
          alt={title}
        />
      </AspectRatio>
    </Box>
  );
}

const CARD_WIDTH = 140;
export function RoleImage({ name, url }: { name: string | undefined | null; url: string }) {
  return (
    <Box
      width="50px"
      minWidth="50px"
      height="50px"
      marginRight={2}
      position="relative"
      overflow="hidden"
      borderWidth={2}
      borderColor="gray.600"
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
    </Box>
  )
}