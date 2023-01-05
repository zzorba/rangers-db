import React, { useCallback, useState, useMemo } from 'react';
import { Button, Text, Link, ButtonGroup, Flex, IconButton, List, ListItem, SimpleGrid, useBreakpointValue, useColorMode, useColorModeValue } from '@chakra-ui/react';
import { map } from 'lodash';
import { t } from '@lingui/macro';
import NextLink from 'next/link';

import { DeckFragment, DeckWithCampaignFragment, SearchDeckFragment, useDeleteDeckMutation, useLikeDeckMutation, useUnlikeDeckMutation } from '../generated/graphql/apollo-schema';
import { CardsMap } from '../lib/hooks';
import { useAuth } from '../lib/AuthContext';
import { RoleImage } from './CardImage';
import { DeckDescription, MiniAspect } from './Deck';
import DeckProblemComponent from './DeckProblemComponent';
import CoreIcon from '../icons/CoreIcon';
import { DeckError } from '../types/types';
import useDeleteDialog from './useDeleteDialog';
import { FaEdit, FaHeart, FaHeartBroken, FaTrash } from 'react-icons/fa';
import SubmitButton, { SubmitIconButton } from './SubmitButton';
import { useTheme } from '../lib/ThemeContext';
import LikeButton from './LikeButton';

export function DeckRow({ deck, roleCards, onDelete }: {
  deck: DeckWithCampaignFragment;
  roleCards: CardsMap;
  onDelete: (deck: DeckFragment) => void;
}) {
  const { colorMode } = useColorMode();
  const { authUser } = useAuth();
  const doDelete = useCallback(() => {
    onDelete(deck);
  }, [onDelete, deck]);
  const buttonOrientation = useBreakpointValue<'vertical' | 'horizontal'>(['vertical', 'vertical', 'horizontal']);
  const problem = !!deck.meta.problem && Array.isArray(deck.meta.problem) ? (deck.meta.problem as DeckError[])  : undefined;
  const role = useMemo(() => {
    return typeof deck.meta.role === 'string' && roleCards[deck.meta.role];
  }, [deck.meta, roleCards]);
  const { colors } = useTheme();

  return (
    <ListItem paddingTop={3} paddingBottom={3} borderBottomColor={colors.divider} borderBottomWidth="1px">
      <Flex direction="column">
        <Flex direction="row">
          <Flex flex={[1.2, 1.25, 1.5, 2]} direction="row" alignItems="flex-start" as={NextLink} href={`/decks/view/${deck.id}`}>
            { !!role && !!role.imagesrc && <RoleImage size="large" name={role.name} url={role.imagesrc} /> }
            <Flex direction="column">
              <Text fontSize={['m', 'l', 'xl']}>{deck.name}</Text>
              <Flex direction="column" display={['none', 'block']}>
                { !!deck.campaign && <Flex direction="row" alignItems="center"><CoreIcon icon="guide" size={18} /><Link marginLeft={1} as={NextLink} href={`/campaigns/${deck.campaign.id}`}>{deck.campaign.name}</Link></Flex>}
                <DeckDescription fontSize={['xs', 's', 'm']}deck={deck} roleCards={roleCards} />
                { !!problem && <DeckProblemComponent errors={problem} limit={1} />}
              </Flex>
            </Flex>
          </Flex>
          <Flex marginLeft={1} direction="row" alignItems="flex-start" justifyContent="space-between">
            <SimpleGrid columns={2} marginRight={1}>
              <MiniAspect aspect="AWA" value={deck.awa} />
              <MiniAspect aspect="SPI" value={deck.spi} />
              <MiniAspect aspect="FIT" value={deck.fit} />
              <MiniAspect aspect="FOC" value={deck.foc} />
            </SimpleGrid>
            { authUser?.uid === deck.user_id && (
              <ButtonGroup marginLeft={[1, 2, "2em"]} orientation={buttonOrientation || 'horizontal'}>
                <IconButton aria-label={t`Edit`} color={`${colorMode}.lightText`} icon={<FaEdit />} as={NextLink} href={`/decks/edit/${deck.id}`} />
                <IconButton aria-label={t`Delete`} color="red.400" icon={<FaTrash />} onClick={doDelete} />
              </ButtonGroup>
            )}
          </Flex>
        </Flex>
        <Flex direction="column" display={['block', 'none']}>
          { !!deck.campaign && <Flex direction="row" alignItems="center"><CoreIcon icon="guide" size={18} /><Link marginLeft={1} as={NextLink} href={`/campaigns/${deck.campaign.id}`}>{deck.campaign.name}</Link></Flex>}
          <DeckDescription fontSize={['xs', 's', 'm']}deck={deck} roleCards={roleCards} />
          { !!problem && <DeckProblemComponent errors={problem} limit={1} />}
        </Flex>
      </Flex>
    </ListItem>
  );
}

function deleteDeckMessage(d: DeckFragment) {
  return t`Are you sure you want to delete the "${d.name}" deck?`;
}

export default function DeckList({
  roleCards,
  decks,
  refetch,
}: {
  decks: DeckWithCampaignFragment[] | undefined;
  roleCards: CardsMap;
  refetch: () => void;
}) {
  const [doDelete] = useDeleteDeckMutation();
  const deleteDeck = useCallback(async(d: DeckFragment) => {
    const r = await doDelete({
      variables: {
        id: d.id,
      },
    });
    if (r.errors?.length) {
      return r.errors[0].message;
    }
    refetch();
    return undefined;
  }, [doDelete, refetch]);
  const [onDelete, deleteDialog] = useDeleteDialog(
    t`Delete deck?`,
    deleteDeckMessage,
    deleteDeck
  );
  if (!decks?.length) {
    return <Text>{t`You don't seem to have any decks.`}</Text>
  }
  return (
    <>
      <List>
        { map(decks, deck => (
          <DeckRow
            key={deck.id}
            deck={deck}
            roleCards={roleCards}
            onDelete={onDelete}
          />
        )) }
      </List>
      { deleteDialog }
    </>
  );
}


export function SearchDeckRow({ deck, roleCards, onLike }: {
  deck: SearchDeckFragment;
  roleCards: CardsMap;
  onLike: (deck: SearchDeckFragment) => Promise<string | undefined>;
}) {
  const doLike = useCallback(async() => {
    return await onLike(deck);
  }, [onLike, deck]);
  const role = useMemo(() => {
    return typeof deck.meta.role === 'string' && roleCards[deck.meta.role];
  }, [deck.meta, roleCards]);
  const { colors } = useTheme();
  const likes = deck.rank?.like_count || 0;
  return (
    <ListItem paddingTop={3} paddingBottom={3} borderBottomColor={colors.divider} borderBottomWidth="1px">
      <Flex direction="column">
        <Flex direction="row">
          <Flex flex={[1.2, 1.25, 1.5, 2]} direction="row" alignItems="flex-start" as={NextLink} href={`/decks/view/${deck.id}`}>
            <SimpleGrid columns={2} marginRight={2}>
              <MiniAspect aspect="AWA" value={deck.awa} extraSmall />
              <MiniAspect aspect="SPI" value={deck.spi} extraSmall />
              <MiniAspect aspect="FIT" value={deck.fit} extraSmall />
              <MiniAspect aspect="FOC" value={deck.foc} extraSmall />
            </SimpleGrid>
            { !!role && !!role.imagesrc && <RoleImage name={role.name} url={role.imagesrc} /> }
            <Flex direction="column">
              <Text fontSize={['m', 'l', 'xl']}>{deck.name}</Text>
              <Flex direction="column" display={['none', 'block']}>
                <DeckDescription fontSize={['xs', 's', 'm']} deck={deck} roleCards={roleCards} />
              </Flex>
            </Flex>
          </Flex>
          <Flex marginLeft={1} direction="row" alignItems="center">
            <LikeButton
              liked={deck.liked_by_user}
              likeCount={deck.rank?.like_count}
              onClick={doLike}
            />
          </Flex>
        </Flex>
        <Flex direction="column" display={['block', 'none']}>
          <DeckDescription fontSize={['xs', 's', 'm']}deck={deck} roleCards={roleCards} />
        </Flex>
      </Flex>
    </ListItem>
  );
}

interface SearchDeckListProps {
  decks: SearchDeckFragment[] | undefined;
  roleCards: CardsMap;
  onLike: (deck: SearchDeckFragment) => Promise<string | undefined>;
}
export function SearchDeckList({ roleCards, decks, onLike }: SearchDeckListProps) {
  if (!decks?.length) {
    return <Text>{t`No matching decks.`}</Text>
  }
  return (
    <>
      <List>
        { map(decks, deck => (
          <SearchDeckRow
            key={deck.id}
            deck={deck}
            roleCards={roleCards}
            onLike={onLike}
          />
        )) }
      </List>
    </>
  );
}