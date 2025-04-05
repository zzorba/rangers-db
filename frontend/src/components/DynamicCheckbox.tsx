import { Checkbox } from '@chakra-ui/react';
import React, { ChangeEvent, useCallback, useEffect, useState } from 'react';

type Props =  {
  children: string;
  isChecked: boolean;
  isDisabled?: boolean;
  onChange: (checked: boolean) => Promise<void>;
};

export default function DynamicCheckbox({ children, isChecked, isDisabled, onChange }: Props) {
  const [checked, setChecked] = useState(isChecked);
  useEffect(() => {
    setChecked(isChecked);
  }, [isChecked]);
  const handleOnChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const c = event.target.checked;
    setChecked(c);
    onChange(c);
  }, [onChange]);
  return (
    <Checkbox
      isChecked={checked}
      isDisabled={isDisabled}
      onChange={handleOnChange}
    >
      {children}
    </Checkbox>
  );
}