import { Button, ButtonProps } from '@chakra-ui/react';
import React from 'react';

export type SolidButtonColor = 'green' | 'blue' | 'yellow' | 'orange' | 'gray' | 'red';
interface Props extends ButtonProps {
  color: SolidButtonColor;
  href?: string;
}

const SolidButton = React.forwardRef<HTMLButtonElement, Props>(
  ({ color, ...props }: Props, ref) => {
    return (
      <Button
        ref={ref}
        {...props}
        variant="solid"
        color="white"
        bg={`${color}.400`}
        _hover={{ bg: `${color}.600` }}
      />
    );
  }
);
export default SolidButton;
