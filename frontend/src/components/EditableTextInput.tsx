import React, { useEffect, useState } from 'react';
import { t } from '@lingui/macro';
import { EditableInput, ButtonGroup, Editable, EditablePreview, Flex, IconButton, Input, useEditableControls, Tooltip, ResponsiveValue, EditableProps, useStatStyles } from '@chakra-ui/react'
import { CheckIcon, CloseIcon, EditIcon } from '@chakra-ui/icons';

function EditableControls() {
  const {
    isEditing,
    getSubmitButtonProps,
    getEditButtonProps,
    getCancelButtonProps,
  } = useEditableControls()

  return isEditing ? (
    <ButtonGroup justifyContent='center' size='sm' marginLeft={2}>
      <IconButton aria-label={t`Submit`} icon={<CheckIcon />} {...getSubmitButtonProps()} />
      <IconButton aria-label={t`Cancel`} icon={<CloseIcon />} {...getCancelButtonProps()} />
    </ButtonGroup>
  ) : null;
}
function EditablePreviewWithEditButton() {
  const {
    isEditing,
    getEditButtonProps,
  } = useEditableControls()

  return (
    <Flex direction="row">
      <EditablePreview />
      { !isEditing && <IconButton marginLeft="2em" aria-label={t`Edit`} icon={<EditIcon />} {...getEditButtonProps()} /> }
    </Flex>
  )
}
export default function EditableTextInput({
  value,
  placeholder,
  onChange,
  ...otherProps
}: Omit<EditableProps, 'textAlign' | 'defaultValue' | 'isPreviewFocusable' | 'color' | 'placeholder' | 'selectAllOnFocus' | 'onSubmit'> & {
  value: string;
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
      onChange={setLiveValue}
      isPreviewFocusable
      color={!value ? 'gray.500' : undefined}
      selectAllOnFocus={false}
      onSubmit={(updated) => onChange(updated)}
      {...otherProps}
    >
      <EditablePreviewWithEditButton />
      <Flex direction="row">
        <Input as={EditableInput} />
        <EditableControls />
      </Flex>
    </Editable>
  );
}