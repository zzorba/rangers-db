import React, { useCallback, useMemo, useState } from 'react';
import { filter, trim, forEach, map, partition, sortBy } from 'lodash';
import { t } from '@lingui/macro';
import { FaFilter } from 'react-icons/fa';
import { Box, Button, ButtonGroup, Flex, Input, List, ListItem, Text, useDisclosure, Tabs, TabList, Tab, TabPanel, TabPanels, IconButton, Collapse } from '@chakra-ui/react';

import { CardFragment, useGetAllCardsQuery } from '../generated/graphql/apollo-schema';
import { CardRow, useCardModal } from './Card';
import LoadingPage from './LoadingPage';
import { useLocale } from '../lib/TranslationProvider';
import ListHeader from './ListHeader';
import { useCardSearchControls } from './CardFilter';
import { useTheme } from '../lib/ThemeContext';

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
  const { data } = useGetAllCardsQuery({
    variables: {
      locale,
    },
  });
  const [showCard, modal] = useCardModal();
  const [standardCards, rewardCards] = useMemo(() => {
    return partition(data?.cards, c => c.set_id !== 'reward' && c.set_id !== 'malady');
  }, [data]);

  const [controls, hasFilters, filterCard] = useCardSearchControls(standardCards);
  if (!data?.cards) {
    return <LoadingPage />;
  }
  return (
    <>
      <Tabs>
        <TabList>
          <Tab>{t`Ranger`}</Tab>
          <Tab>{t`Rewards and Maladies`}</Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            <SimpleCardList
              cards={standardCards}
              controls={controls}
              showCard={showCard}
              filter={filterCard}
              hasFilters={hasFilters}
            />
          </TabPanel>
          <TabPanel>
            <SpoilerCardList
              cards={rewardCards}
              showCard={showCard}
              header="set"
            />
          </TabPanel>
        </TabPanels>
      </Tabs>
      { modal }
    </>
  );
}

interface SimpleCardListProps {
  cards?: CardFragment[];
  showCard: (card: CardFragment) => void;
  header?: 'aspect' | 'set' | 'none';
  advancedControls?: React.ReactNode;
  filter?: (card: CardFragment) => boolean;
  renderControl?: (card: CardFragment) => React.ReactNode;
  emptyText?: string;
  controls?: React.ReactNode;
  noSearch?: boolean;
  hasFilters?: boolean;
}
export function SimpleCardList({ noSearch, hasFilters, cards, controls, showCard, header = 'set', renderControl, emptyText, filter: filterCard }: SimpleCardListProps) {
  const { locale } = useLocale();
  const [search, setSearch] = useState('');
  const visibleCards = useMemo(() => {
    const filtered = filterCard ? filter(cards, c => filterCard(c)) : cards;
    if (!trim(search)) {
      return sortBy(filtered, c => c.position);
    }
    const lowerSearch = search.toLocaleLowerCase(locale);
    return sortBy(filter(filtered, c =>
      !!(c.name && c.name.toLocaleLowerCase(locale).indexOf(lowerSearch) !== -1) ||
      !!(c.type_name && c.type_name.toLocaleLowerCase(locale).indexOf(lowerSearch) !== -1) ||
      !!(c.traits && c.traits.toLocaleLowerCase(locale).indexOf(lowerSearch) !== -1)
    ), card => card.position);
  }, [cards, search, locale, filterCard]);

  const items = useMemo(() => {
    const items: Item[] = [];

    let currentHeader: string | undefined = undefined;
    forEach(visibleCards, card => {
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
  }, [visibleCards, header]);
  const emptyState = useMemo(() => {
    if ((trim(search) || hasFilters) && (cards?.length || 0) > 0) {
      return (
        <List>
          <ListItem padding={2}>
            <Text>{t`No matching cards`}</Text>
          </ListItem>
        </List>
      );
    }
    if (emptyText) {
      <List>
        <ListItem padding={2}>
          <Text>{emptyText}</Text>
        </ListItem>
      </List>
    }
    if (!cards) {
      return (
        <LoadingPage />
      );
    }
    return null;
  }, [emptyText, search, hasFilters, cards]);
  const { isOpen, onToggle } = useDisclosure({ defaultIsOpen: hasFilters });
  const { colors } = useTheme();
  return (
    <>
      { !noSearch && <Flex direction="row">
        <Input
          type="search"
          value={search}
          placeholder={t`Search by name`}
          onChange={e => setSearch(e.target.value)}
        />
        { !!controls && <IconButton marginLeft={2} onClick={onToggle} icon={<FaFilter />} aria-label={t`Advanced controls`} />}
      </Flex> }
      { !!controls && (
        <Collapse in={isOpen}>
          <Box marginLeft={4} padding={4} marginRight={8} borderLeftWidth="1px" borderLeftColor={colors.divider}>
            { controls }
          </Box>
        </Collapse>
      )}
      { items.length ? (
        <List>
          { map(items, item => item.type === 'card' ?
            <CardButtonRow key={item.card.id} card={item.card} showModal={showCard}>
              { !!renderControl && !!item.card.id && renderControl(item.card)}
            </CardButtonRow> :
            <CardHeader key={item.title} title={item.title} />
          ) }
        </List>
      ) : emptyState }
    </>
  );
}

export function SpoilerCardList({
  cards,
  unlocked,
  showCard,
  renderControl,
  upsellText,
  header = 'none',
}: {
  unlocked?: string[];
  cards: CardFragment[] | undefined;
  showCard: (card: CardFragment) => void;
  renderControl?: (card: CardFragment) => React.ReactNode;
  upsellText?: string;
  header?: 'aspect' | 'set' | 'none';
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
      { header !== 'set' && (
        <>
          <ListHeader title={t`Available`} />
          { !upsellText && (
            <ListItem padding={2}>
              <Text>{upsellText}</Text>
            </ListItem>
          ) }
        </>
      ) }
      { map(unlockedCards, c => (
        <CardButtonRow key={c.id} card={c} showModal={showCard}>
          { renderControl && renderControl(c) }
        </CardButtonRow>
      )) }
      { header !== 'set' && <ListHeader title={t`All`} /> }
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
      <SimpleCardList
        noSearch
        emptyText={!search ? t`Note: These cards might contain campaign spoilers.` : t`No matching cards found.`}
        cards={visibleCards} showCard={showCard} renderControl={renderControl} header={header} />
    </List>
  );
}