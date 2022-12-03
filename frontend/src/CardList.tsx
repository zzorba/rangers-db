import React, { useCallback, useMemo } from 'react';
import { forEach, map, sortBy } from 'lodash';
import { CardFragment, useGetCardsQuery } from './generated/graphql/apollo-schema';
import { CardRow, useCardModal } from './components/Card';
import { AspectMap } from './types/types';
import { Container, Box, List, ListItem, Text } from '@chakra-ui/react';

const ASPECT_COLORS: { [key: string]: string | undefined } = {
  AWA: '#306938',
  FOC: '#1e2f64',
  FIT: '#811019',
  SPI: '#da6e17',
};

function CardButtonRow({ card, showModal, aspects }: { card: CardFragment; aspects: AspectMap; showModal: (card: CardFragment) => void }) {
  const onClick = useCallback(() => showModal(card), [card, showModal]);

  return (
    <ListItem onClick={onClick}>
      <CardRow card={card} aspects={aspects} />
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
  const aspects = useMemo(() => {
    const r: AspectMap = {};
    forEach(data?.rangers_aspect_localized, a => {
      if (a.id && a.name && a.short_name) {
        r[a.id] = {
          name: a.name,
          short_name: a.short_name,
          color: ASPECT_COLORS[a.id] || '#000000',
        };
      };
    })
    return r;
  }, [data?.rangers_aspect_localized]);
  const [showCard, modal] = useCardModal(aspects);
  const items = useMemo(() => {
    const sorted = sortBy(data?.rangers_card_localized, card => card.id);
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
          <CardButtonRow key={item.card.id} aspects={aspects} card={item.card} showModal={showCard} /> :
          <CardHeader key={item.title} title={item.title} />
        ) }
      </List>
      { modal }
    </>
  );
}