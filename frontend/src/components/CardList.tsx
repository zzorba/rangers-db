import React, { useCallback, useMemo, useState } from 'react';
import { filter, flatMap, forEach, map, sortBy } from 'lodash';
import { t } from '@lingui/macro';
import { CardFragment, useGetCardsQuery } from '../generated/graphql/apollo-schema';
import { CardRow, useCardModal } from './Card';
import { Button, ButtonGroup, Flex, Input, List, ListItem, Text, useDisclosure } from '@chakra-ui/react';
import LoadingPage from './LoadingPage';
import { useLocale } from '../lib/TranslationProvider';
import ListHeader from './ListHeader';

function CardButtonRow({ card, showModal, children }: { card: CardFragment; showModal: (card: CardFragment) => void; children?: React.ReactNode }) {
  const onClick = useCallback(() => showModal(card), [card, showModal]);

  return (
    <ListItem>
      <CardRow card={card} onClick={onClick}>
        {children}
      </CardRow>
    </ListItem>
  );
}

function CardHeader({ title }: { title: string }) {
  return (
    <ListItem padding={2} paddingTop={4} paddingBottom={0} borderBottomWidth={0.5} borderColor="#888888">
      <Text fontStyle="italic" fontSize="m">{title}</Text>
    </ListItem>
  );
}

interface CardItem {
  type: 'card';
  card: CardFragment;
}

interface HeaderItem {
  type: 'header',
  title: string;
}

type Item = CardItem | HeaderItem;

export default function CardList() {
  const { locale } = useLocale();
  const { data } = useGetCardsQuery({
    variables: {
      locale,
    },
  });
  const [showCard, modal] = useCardModal();
  if (!data?.cards) {
    return <LoadingPage />;
  }
  return (
    <>
      <SimpleCardList cards={data?.cards} showCard={showCard} />
      { modal }
    </>
  );
}

interface SimpleCardListProps {
  cards?: CardFragment[];
  showCard: (card: CardFragment) => void;
  header?: 'aspect' | 'set' | 'none';
  renderControl?: (card: CardFragment) => React.ReactNode;
  emptyText?: string;
}
export function SimpleCardList({ cards, showCard, header = 'set', renderControl, emptyText }: SimpleCardListProps) {
  const items = useMemo(() => {
    const sorted = sortBy(cards, card => card.position);
    const items: Item[] = [];
    let currentHeader: string | undefined = undefined;
    forEach(sorted, card => {
      switch (header) {
        case 'set':
          if (card.set_name && card.set_name !== currentHeader) {
            currentHeader = card.set_name;
            items.push({
              type: 'header',
              title: currentHeader,
            });
          }
          break;
        case 'aspect':
          if (card.aspect_name && card.aspect_name !== currentHeader) {
            currentHeader = card.aspect_name;
            items.push({
              type: 'header',
              title: currentHeader,
            });
          }
          break;
        case 'none':
          break;
      }

      items.push({
        type: 'card',
        card,
      });
    });
    return items;
  }, [cards, header]);
  if (!items.length) {
    if (emptyText) {
      return (
        <List>
          <ListItem padding={2}>
            <Text>{emptyText}</Text>
          </ListItem>
        </List>
      )
    }
    return <LoadingPage />;
  }
  return (
    <List>
      { map(items, item => item.type === 'card' ?
        <CardButtonRow key={item.card.id} card={item.card} showModal={showCard}>
          { !!renderControl && !!item.card.id && renderControl(item.card)}
        </CardButtonRow> :
        <CardHeader key={item.title} title={item.title} />
      ) }
    </List>
  );
}



export function SpoilerCardList({
  cards,
  unlocked,
  showCard,
  renderControl,
  upsellText,
}: {
  unlocked?: string[];
  cards: CardFragment[] | undefined;
  showCard: (card: CardFragment) => void;
  renderControl?: (card: CardFragment) => React.ReactNode;
  upsellText?: string;
}) {
  const { locale } = useLocale();
  const [search, setSearch] = useState('');
  const { isOpen: showAll, onOpen: onShow, onClose: onHide } = useDisclosure();
  const unlockedCards = useMemo(() => {
    const unlockedSet = new Set(unlocked);
    return filter(cards, c => !!c.id && unlockedSet.has(c.id));
  }, [unlocked, cards]);
  const visibleCards = useMemo(() => {
    const lowerSearch = search.toLocaleLowerCase(locale);
    return filter(cards, c => !!showAll || !!(
      c.name && search.length >= 2 && c.name.toLocaleLowerCase(locale).indexOf(lowerSearch) !== -1)
    );
  }, [cards, search, showAll, locale]);
  return (
    <List>
      <ListHeader title={t`Available`} />
      { !upsellText && (
        <ListItem padding={2}>
          <Text>{upsellText}</Text>
        </ListItem>
      ) }
      { map(unlockedCards, c => (
        <CardButtonRow key={c.id} card={c} showModal={showCard}>
          { renderControl && renderControl(c) }
        </CardButtonRow>
      )) }
      <ListHeader title={t`All`} />
      <ListItem padding={2}>
        <form onSubmit={e => {
          e.preventDefault();
        }}>
          <Flex direction="row">
            <Input
              type="search"
              value={search}
              placeholder={t`Search by name`}
              onChange={e => setSearch(e.target.value)}
            />
            <ButtonGroup marginLeft={2}>
              <Button onClick={showAll ? onHide : onShow}>{showAll ? t`Hide spoilers` : t`Show all` }</Button>
            </ButtonGroup>
          </Flex>
        </form>
      </ListItem>
      { map(visibleCards, c => (
        <CardButtonRow key={c.id} card={c} showModal={showCard}>
          { renderControl && renderControl(c) }
        </CardButtonRow>
      )) }
    </List>
  );
}