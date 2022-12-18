import React, { useCallback, useState } from 'react';
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useDisclosure,
  Button,
} from '@chakra-ui/react'
import { t } from '@lingui/macro';

export default function useDeleteDialog<T>(
  title: string,
  getMessage: (obj: T) => string,
  onDelete: (obj: T) => Promise<string | undefined>
): [(obj: T) => void, React.ReactNode] {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [obj, setObj] = useState<T | undefined>();
  const cancelRef = React.useRef(null);
  const onDeleteClick = useCallback(() => {
    if (obj) {
      onDelete(obj);
      onClose();
    }
  }, [obj, onDelete, onClose]);
  const showDialog = useCallback((obj: T) => {
    setObj(obj);
    onOpen();
  }, [setObj, onOpen])
  return [
    showDialog,
    <AlertDialog
      key="delete"
      isOpen={isOpen}
      leastDestructiveRef={cancelRef}
      onClose={onClose}
    >
      <AlertDialogOverlay>
        <AlertDialogContent>
          <AlertDialogHeader fontSize='lg' fontWeight='bold'>
            {title}
          </AlertDialogHeader>
          <AlertDialogBody>
            { !!obj && getMessage(obj) }
          </AlertDialogBody>
          <AlertDialogFooter>
            <Button ref={cancelRef} onClick={onClose}>
              {t`Cancel`}
            </Button>
            <Button colorScheme='red' onClick={onDeleteClick} ml={3}>
              {t`Delete`}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialogOverlay>
    </AlertDialog>
  ];
}