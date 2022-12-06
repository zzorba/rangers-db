import React, { useCallback, useMemo } from 'react';
import { forEach, map, sortBy } from 'lodash';
import { CardFragment, useGetCardsQuery } from '../generated/graphql/apollo-schema';
import { CardRow, useCardModal } from './Card';
import { AspectMap } from '../types/types';
import { List, ListItem, Text } from '@chakra-ui/react';
import LoadingPage from './LoadingPage';

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
  const { data } = useGetCardsQuery({
    variables: {
      locale: 'en',
    },
  });
  const [showCard, modal] = useCardModal();
  if (!data?.cards) {
    return <LoadingPage />;
  }
  return (
    <>
      <SimpleCardList cards={data.cards} showCard={showCard} />
      { modal }
    </>
  );
}

export function SimpleCardList({ cards, showCard, header = 'set', renderControl }: { cards?: CardFragment[]; showCard: (card: CardFragment) => void; header?: 'aspect' | 'set' | 'none'; renderControl?: (code: string) => React.ReactNode }) {
  const items = useMemo(() => {
    const sorted = sortBy(cards, card => card.id);
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
    return <LoadingPage />;
  }
  return (
    <List>
      {}
      { map(items, item => item.type === 'card' ?
        <CardButtonRow key={item.card.id} card={item.card} showModal={showCard}>
          { !!renderControl && !!item.card.id && renderControl(item.card.id)}
        </CardButtonRow> :
        <CardHeader key={item.title} title={item.title} />
      ) }
    </List>
  );
}