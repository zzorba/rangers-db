import { Box, Text, Flex, FormControl, FormLabel, Heading, Input, List, ListItem, Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay, useDisclosure } from '@chakra-ui/react';
import React, { useCallback, useState } from 'react';
import { CampaignFragment, useAddFriendToCampaignMutation, useCreateCampaignMutation, useGetProfileQuery } from '../generated/graphql/apollo-schema';
import { useAuth } from '../lib/AuthContext';
import { select, t } from '@lingui/macro';
import SolidButton from './SolidButton';
import FriendChooser from './FriendChooser';
import { uniq, filter, map } from 'lodash';
import NextLink from 'next/link';
import Router from 'next/router';


function CampaignRow({ campaign }: { campaign: CampaignFragment }) {
  return (
    <ListItem as={NextLink} href={`/campaigns/${campaign.id}`}>
      <Text>{campaign.name}</Text>
    </ListItem>
  );
}
export function CampaignList({ campaigns, }: { campaigns: CampaignFragment[]}) {
  return (
    <List>
      { map(campaigns, c => <CampaignRow key={c.id} campaign={c} />) }
    </List>
  )
}

export default function CampaignDetail({ campaign }: { campaign: CampaignFragment }) {
  return (
    <>
      <Text>{campaign.name}</Text>
    </>
  )
}

export function useEditCampaignAccessModal(campaign: CampaignFragment): [() => void, React.ReactNode] {
  const { authUser } = useAuth();
  const { data, refetch } = useGetProfileQuery({
    variables: {
      id: authUser?.uid || '',
    },
    skip: !authUser,
  });

  const refreshProfile = useCallback(() => {
    if (authUser) {
      refetch({
        id: authUser.uid,
      });
    };
  }, [refetch, authUser]);
  const { isOpen, onOpen, onClose } = useDisclosure();

  return [
    onOpen,
    <Modal key="access" isOpen={isOpen} onClose={onClose}>
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
        </ModalFooter>
      </ModalContent>
    </Modal>
  ];
}

export function useNewCampaignModal(): [() => void, React.ReactNode] {
  const { authUser } = useAuth();
  const [name, setName] = useState('');
  const { data, refetch } = useGetProfileQuery({
    variables: {
      id: authUser?.uid || '',
    },
    skip: !authUser,
  });

  const refreshProfile = useCallback(() => {
    if (authUser) {
      refetch({
        id: authUser.uid,
      });
    };
  }, [refetch, authUser]);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [createCampaign] = useCreateCampaignMutation();
  const [addFriendToCampaign] = useAddFriendToCampaignMutation();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const onAdd = useCallback(async(id: string) => {
    setSelectedFriends(uniq([
      ...selectedFriends,
      id,
    ]));
    return undefined;
  }, [selectedFriends, setSelectedFriends]);
  const onRemove = useCallback(async(id: string) => {
    setSelectedFriends(filter(selectedFriends, f => f !== id));
    return undefined;
  }, [selectedFriends, setSelectedFriends]);
  const onCreateCampaign = useCallback(async() => {
    if (!authUser) {
      return;
    }
    setSubmitting(true);
    setError(undefined);
    const result = await createCampaign({
      variables: {
        name,
      },
    });
    if (result.errors?.length) {
      setError(result.errors[0].message);
      setSubmitting(false);
      return;
    }
    if (!result.data?.campaign) {
      setError(t`Unable to create campaign at this time.`);
      setSubmitting(false);
      return;
    }
    const campaignId = result.data.campaign.id;
    for (let i = 0; i < selectedFriends.length; i++) {
      const userId = selectedFriends[i];
      const fResult = await addFriendToCampaign({
        variables: {
          userId,
          campaignId,
        },
      });
      if (fResult.errors?.length) {
        setError(fResult.errors[0].message);
        setSubmitting(false);
      }
    }
    setSubmitting(false);
    Router.push(`/campaigns/${campaignId}`);
    onClose();
  }, [createCampaign, addFriendToCampaign, selectedFriends, onClose, authUser, name]);
  const showModal = useCallback(() => {
    onOpen();
  }, [onOpen]);
  return [
    showModal,
    <Modal key="campaign" isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <Box paddingRight={8}>
            <Heading>{t`New campaign`}</Heading>
          </Box>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <form onSubmit={e => {
            e.preventDefault();
            onCreateCampaign();
          }}>
            <FormControl marginBottom={4}>
              <FormLabel>{t`Name`}</FormLabel>
              <Input
                type="name"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </FormControl>
            <FriendChooser
              profile={data?.profile || undefined}
              selection={selectedFriends}
              add={onAdd}
              refreshProfile={refreshProfile}
              remove={onRemove}
              title={t`Players`}
            />
          </form>
        </ModalBody>
        <ModalFooter>
          <Flex direction="row" flex={1} justifyContent="flex-end">
            <SolidButton
              color="blue"
              isLoading={submitting}
              disabled={!name}
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
