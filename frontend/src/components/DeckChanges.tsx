import React, { useCallback, useMemo } from 'react';
import { List } from '@chakra-ui/react';
import { forEach, keys, sortBy } from 'lodash';
import { t } from '@lingui/macro';

import { CardsMap } from '../lib/hooks';
import { DeckChanges } from '../lib/parseDeck';
import ListHeader from './ListHeader';
import { SimpleCardList } from './CardList';
import { ShowCard } from './Card';
import { CardFragment } from '../generated/graphql/apollo-schema';
import CardCount from './CardCount';

interface Props {
  changes: DeckChanges;
  cards: CardsMap;
  showCard: ShowCard;
  showCollectionCard: ShowCard;
  showDisplacedCard: ShowCard;
}
export default function DeckChangesComponent({ changes, cards, showCard, showCollectionCard, showDisplacedCard }: Props) {
  const [addedCards, removedCards, addedCollectionCards, removedCollectionCards] = useMemo(() => {
    const ac: CardFragment[] = [];
    const rc: CardFragment[] = [];
    const acc: CardFragment[] = [];
    const rcc: CardFragment[] = [];

    forEach(keys(changes.addedCards), (code) => {
      const card = cards[code];
      const delta = changes.addedCards[code] || 0;
      if (card && delta) {
        ac.push(card);
      }
    });

    forEach(keys(changes.removedCards), (code) => {
      const card = cards[code];
      const delta = changes.removedCards[code] || 0;
      if (card && delta) {
        rc.push(card);
      }
    });

    forEach(keys(changes.addedCollectionCards), (code) => {
      const card = cards[code];
      const delta = changes.addedCollectionCards[code] || 0;
      if (card && delta) {
        acc.push(card);
      }
    });

    forEach(keys(changes.returnedCollectionCards), (code) => {
      const card = cards[code];
      const delta = changes.returnedCollectionCards[code] || 0;
      if (card && delta) {
        rcc.push(card);
      }
    });
    return [
      sortBy(ac, c => c.name),
      sortBy(rc, c => c.name),
      sortBy(acc, c => c.name),
      sortBy(rcc, c => c.name),
    ];
  }, [cards, changes]);
  const addedControl = useCallback((card: CardFragment) => {
    if (!card.id) {
      return null;
    }
    return (
      <CardCount delta marginLeft={2} count={changes.addedCards[card.id] || 0} />
    );
  }, [changes.addedCards]);

  const removedControl = useCallback((card: CardFragment) => {
    if (!card.id) {
      return null;
    }
    return (
      <CardCount delta marginLeft={2} count={changes.removedCards[card.id] || 0} />
    );
  }, [changes.removedCards]);
  const addedCollectionControl = useCallback((card: CardFragment) => {
    if (!card.id) {
      return null;
    }
    return (
      <CardCount delta marginLeft={2} count={changes.addedCollectionCards[card.id] || 0} />
    );
  }, [changes.addedCollectionCards]);
  const returnedCollectionControl = useCallback((card: CardFragment) => {
    if (!card.id) {
      return null;
    }
    return (
      <CardCount delta marginLeft={2} count={changes.returnedCollectionCards[card.id] || 0} />
    );
  }, [changes.returnedCollectionCards]);
  return (
    <List>
      { addedCards.length > 0 && (
        <>
          <ListHeader title={t`Added`} />
          <SimpleCardList
            noSearch
            cards={addedCards}
            header="none"
            showCard={showCard}
            renderControl={addedControl}
          />
        </>
      ) }
      { removedCards.length > 0 && (
        <>
          <ListHeader title={t`Removed`} />
          <SimpleCardList
            noSearch
            cards={removedCards}
            header="none"
            showCard={showDisplacedCard}
            renderControl={removedControl}
          />
        </>
      ) }
      { addedCollectionCards.length > 0 && (
        <>
          <ListHeader title={t`Added from collection`} />
          <SimpleCardList
            noSearch
            cards={addedCollectionCards}
            header="none"
            showCard={showCard}
            renderControl={addedCollectionControl}
          />
        </>
      ) }
      { removedCollectionCards.length > 0 && (
        <>
          <ListHeader title={t`Returned to collection`} />
          <SimpleCardList
            noSearch
            cards={removedCollectionCards}
            header="none"
            showCard={showCollectionCard}
            renderControl={returnedCollectionControl}
          />
        </>
      ) }
    </List>
  )
}
