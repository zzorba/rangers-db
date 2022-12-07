import { Button, ButtonProps } from '@chakra-ui/react';
import React from 'react';

export type SolidButtonColor = 'blue' | 'orange' | 'gray' | 'red';
export default function SolidButton({ color, ...props }: ButtonProps & { color: SolidButtonColor; href?: string }) {
  return (
    <Button
      {...props}
      variant="solid"
      color="white"
      bg={`${color}.400`}
      _hover={{ bg: `${color}.600` }}
    />
  );
}