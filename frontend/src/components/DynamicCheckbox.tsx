import { Checkbox } from '@chakra-ui/react';
import React, { ChangeEvent, useCallback, useEffect, useState } from 'react';

export default function DynamicCheckbox({ children, isChecked, onChange }: { children: string; isChecked: boolean; onChange: (checked: boolean) => Promise<void> }) {
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
      onChange={handleOnChange}
    >
      {children}
    </Checkbox>
  );
}