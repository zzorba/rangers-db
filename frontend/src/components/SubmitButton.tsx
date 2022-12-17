import { ButtonProps, IconButton, IconButtonProps, useToast } from '@chakra-ui/react';
import React, { useState } from 'react';
import SolidButton, { SolidButtonColor } from './SolidButton';

interface Props extends Omit<ButtonProps, 'color' | 'onClick'> {
  onSubmit: () => Promise<string|undefined>;
  color: SolidButtonColor;
}

export default function SubmitButton({ children, onSubmit, ...otherProps}: Omit<ButtonProps, 'color' | 'onClick'> & {
  onSubmit: () => Promise<string|undefined>;
  color: SolidButtonColor;
}) {
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);
  const handleClick = async () => {
    setSubmitting(true);
    try {
      await onSubmit();
    } catch (e) {
      if (e instanceof Error) {
        toast({
          title: 'Error',
          description: e.message,
          status: 'error',
          duration: 4000,
          isClosable: true,
        });
      }
    }
    setSubmitting(false);
  };
  return (
    <SolidButton
      {...otherProps}
      isLoading={submitting}
      onClick={handleClick}
    >
      { children }
    </SolidButton>
  );
}

export function SubmitIconButton({ icon, onSubmit, ...otherProps}: Omit<IconButtonProps, 'children' | 'icon' | 'onClick'> & {
  onSubmit: () => Promise<string|undefined>;
  icon: React.ReactElement;
}) {
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);
  const handleClick = async () => {
    setSubmitting(true);
    try {
      await onSubmit();
    } catch (e) {
      if (e instanceof Error) {
        toast({
          title: 'Error',
          description: e.message,
          status: 'error',
          duration: 4000,
          isClosable: true,
        });
      }
    }
    setSubmitting(false);
  };
  return (
    <IconButton
      {...otherProps}
      isLoading={submitting}
      onClick={handleClick}
      icon={icon}
    />
  );
}