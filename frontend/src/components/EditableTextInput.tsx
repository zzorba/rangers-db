import React, { useEffect, useState } from 'react';
import { t } from '@lingui/macro';
import { EditableInput, ButtonGroup, Editable, EditablePreview, Flex, IconButton, Input, useEditableControls, Tooltip, ResponsiveValue, EditableProps, useStatStyles, InputGroup, InputRightAddon } from '@chakra-ui/react'
import { CheckIcon, CloseIcon, EditIcon } from '@chakra-ui/icons';

function EditableControls() {
  const {
    isEditing,
    getSubmitButtonProps,
    getCancelButtonProps,
  } = useEditableControls()
  if (!isEditing) {
    return null;
  }
  return (
    <ButtonGroup justifyContent='center' size='sm' marginLeft={2}>
      <IconButton
        aria-label={t`Submit`}
        icon={<CheckIcon />}
        {...getSubmitButtonProps()}
      />
      <IconButton
        aria-label={t`Cancel`}
        icon={<CloseIcon />}
        {...getCancelButtonProps()}
      />
    </ButtonGroup>
  );
}
function EditablePreviewWithEditButton({ hideEditButton }: { hideEditButton: boolean | undefined }) {
  const {
    isEditing,
    getEditButtonProps,
  } = useEditableControls();

  return (
    <Flex direction="row">
      <EditablePreview backgroundColor={isEditing ? 'white' : undefined} />
      { !isEditing && !hideEditButton && <IconButton marginLeft="2em" aria-label={t`Edit`} icon={<EditIcon />} {...getEditButtonProps()} /> }
    </Flex>
  );
}

export default function EditableTextInput({
  value,
  placeholder,
  onChange,
  hideEditButton,
  disabled,
  ...otherProps
}: Omit<EditableProps, 'textAlign' | 'defaultValue' | 'isPreviewFocusable' | 'color' | 'placeholder' | 'selectAllOnFocus' | 'onSubmit'> & {
  value: string;
  disabled?: boolean;
  hideEditButton?: boolean;
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  const [liveValue, setLiveValue] = useState(value);
  useEffect(() => {
    setLiveValue(value);
  }, [value]);
  return (
    <Editable
      textAlign='left'
      value={liveValue}
      placeholder={placeholder}
      disabled={disabled}
      onChange={setLiveValue}
      isPreviewFocusable
      color={!value ? 'gray.500' : undefined}
      selectAllOnFocus={false}
      _focus={{
        backgroundColor: 'white',
      }}
      onSubmit={(updated) => onChange(updated)}
      {...otherProps}
    >
      <EditablePreviewWithEditButton
        hideEditButton={hideEditButton}
      />
      <Flex direction="row">
        <Input
          backgroundColor="white"
          as={EditableInput}
        />
        <EditableControls />
      </Flex>
    </Editable>
  );
}