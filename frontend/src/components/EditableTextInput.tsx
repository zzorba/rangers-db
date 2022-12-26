import React, { useEffect, useState } from 'react';
import { t } from '@lingui/macro';
import { EditableInput, ButtonGroup, Editable, EditablePreview, Flex, IconButton, Input, useEditableControls, Tooltip, ResponsiveValue, EditableProps, useStatStyles, InputGroup, InputRightAddon, useColorMode } from '@chakra-ui/react'
import { CheckIcon, CloseIcon, EditIcon } from '@chakra-ui/icons';
import { FaEdit } from 'react-icons/fa';
import { useTheme } from '../lib/ThemeContext';

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
      { !isEditing && !hideEditButton && <IconButton marginLeft="2em" aria-label={t`Edit`} icon={<FaEdit />} {...getEditButtonProps()} /> }
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
  const { colorMode } = useColorMode();
  const { colors } = useTheme();
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
      _placeholder={{
        color: colors.lightText,
      }}
      selectAllOnFocus={false}
      _focus={{
        backgroundColor: colorMode === 'light' ? 'white' : 'black',
      }}
      onSubmit={(updated) => onChange(updated)}
      {...otherProps}
    >
      <EditablePreviewWithEditButton
        hideEditButton={hideEditButton}
      />
      <Flex direction="row">
        <Input
          backgroundColor={colorMode === 'light' ? 'white' : 'black'}
          _placeholder={{
            color: `${colorMode}.lightText`
          }}
          as={EditableInput}
        />
        <EditableControls />
      </Flex>
    </Editable>
  );
}