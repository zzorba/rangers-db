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

export function useDeleteDialog<T>(
  title: string,
  getMessage: (t: T) => string,
  onDelete: (t: T) => void
): [(t: T) => void, React.ReactNode] {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [obj, setObj] = useState<T | undefined>();
  const cancelRef = React.useRef(null);
  const onDeleteClick = useCallback(() => {
    if (obj) {
      onDelete(obj);
      onClose();
    }
  }, [obj, onDelete, onClose]);
  const showDialog = useCallback((t: T) => {
    setObj(t);
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
              Cancel
            </Button>
            <Button colorScheme='red' onClick={onDeleteClick} ml={3}>
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialogOverlay>
    </AlertDialog>
  ];
}