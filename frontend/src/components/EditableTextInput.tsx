import React from 'react';
import { EditableInput, ButtonGroup, Editable, EditablePreview, Flex, IconButton, Input, useEditableControls, Tooltip } from '@chakra-ui/react'
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
      <IconButton aria-label="Submit" icon={<CheckIcon />} {...getSubmitButtonProps()} />
      <IconButton aria-label="Cancel" icon={<CloseIcon />} {...getCancelButtonProps()} />
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
      { !isEditing && <IconButton marginLeft="2em" aria-label="Edit" icon={<EditIcon />} {...getEditButtonProps()} /> }
    </Flex>
  )
}
export default function EditableTextInput({ value, onChange }: { value: string; onChange: (value: string) => void;}) {
  return (
    <Editable
      textAlign='left'
      defaultValue={value}
      fontSize='2xl'
      isPreviewFocusable
      selectAllOnFocus={false}
      onSubmit={(updated) => onChange(updated)}
    >
      <EditablePreviewWithEditButton />
      <Flex direction="row">
        <Input as={EditableInput} />
        <EditableControls />
      </Flex>
    </Editable>
  );
}