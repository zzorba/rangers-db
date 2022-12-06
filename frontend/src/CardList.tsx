import React, { useCallback, useMemo } from 'react';
import { forEach, map, sortBy } from 'lodash';
import { CardFragment, useGetCardsQuery } from './generated/graphql/apollo-schema';
import { CardRow, useCardModal } from './components/Card';
import { List, ListItem } from '@chakra-ui/react';
import ListHeader from './components/ListHeader';

function CardButtonRow({ card, showModal }: { card: CardFragment; showModal: (card: CardFragment) => void }) {
  const onClick = useCallback(() => showModal(card), [card, showModal]);
  return (
    <ListItem>
      <CardRow card={card} onClick={onClick} />
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
  const { data, loading } = useGetCardsQuery({
    variables: {
      locale: 'en',
    },
    initialFetchPolicy: 'network-only',
  });
  const [showCard, modal] = useCardModal();
  const items = useMemo(() => {
    const sorted = sortBy(data?.cards, card => card.id);
    const items: Item[] = [];
    let header: string | undefined = undefined;
    forEach(sorted, card => {
      if (card.set_name && card.set_name !== header) {
        header = card.set_name;
        items.push({
          type: 'header',
          title: header,
        });
      }
      items.push({
        type: 'card',
        card,
      });
    });
    return items;
  }, [data]);
  return (
    <>
      <List>
        { map(items, item => item.type === 'card' ?
          <CardButtonRow key={item.card.id} card={item.card} showModal={showCard} /> :
          <ListHeader key={item.title} title={item.title} />
        ) }
      </List>
      { modal }
    </>
  );
}