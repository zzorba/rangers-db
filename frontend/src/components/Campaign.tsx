import { Box, Flex, Heading, List, ListItem, Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay, useDisclosure } from '@chakra-ui/react';
import React, { useCallback, useState } from 'react';
import { CampaignFragment, useCreateCampaignMutation } from '../generated/graphql/apollo-schema';
import { useAuth } from '../lib/AuthContext';
import { t } from '@lingui/macro';
import SolidButton from './SolidButton';

export function CampaignList({ }: { campaigns: CampaignFragment[]}) {
  return (
    <List>
      <ListItem>Campaigns go here</ListItem>
    </List>
  )
}


const SHOW_ASPECTS = false;
export function useNewCampaignModal(): [() => void, React.ReactNode] {
  const { authUser } = useAuth();
  const [name, setName] = useState('');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [createDeck] = useCreateCampaignMutation();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const onCreateCampaign = useCallback(async() => {
    if (!authUser) {
      return;
    }
    setSubmitting(true);
    setError(undefined);
    const result = await createDeck({
      variables: {
        name,
      },
    });
    setSubmitting(false);
    if (result.errors?.length) {
      setError(result.errors[0].message);
    } else {
      onClose();
    }
  }, [createDeck, onClose, authUser, name]);
  const showModal = useCallback(() => {
    onOpen();
  }, [onOpen]);
  return [
    showModal,
    <Modal key="modal" isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <Box paddingRight={8}>
            <Heading>{t`New campaign`}</Heading>
          </Box>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
        </ModalBody>
        <ModalFooter>
          <Flex direction="row" flex={1} justifyContent="flex-end">
            <SolidButton
              color="blue"
              isLoading={submitting}
              disabled={!!name}
              onClick={onCreateCampaign}
            >
              {t`Create`}
            </SolidButton>
          </Flex>
        </ModalFooter>
      </ModalContent>
    </Modal>
  ];
}
