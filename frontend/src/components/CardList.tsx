import React, { useCallback, useMemo, useState } from 'react';
import { filter, find, trim, forEach, map, partition, sortBy } from 'lodash';
import { t } from '@lingui/macro';
import { FaFilter } from 'react-icons/fa';
import { Box, Button, ButtonGroup, Flex, Input, List, ListItem, Text, useDisclosure, Tabs, TabList, Tab, TabPanel, TabPanels, IconButton, Collapse, Select, Wrap, WrapItem } from '@chakra-ui/react';

import { CardFragment, useGetAllCardsQuery } from '../generated/graphql/apollo-schema';
import Card, { CardRow, useCardModal } from './Card';
import LoadingPage from './LoadingPage';
import { useLocale } from '../lib/TranslationProvider';
import ListHeader from './ListHeader';
import { useCardSearchControls } from './CardFilter';
import { useTheme } from '../lib/ThemeContext';
import { BaseOptions } from 'vm';
import CardImage, { CardImagePlaceholder } from './CardImage';

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

type ItemSection = {
  title?: string;
  items: CardItem[];
}


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

  const [controls, hasFilters, filterCard] = useCardSearchControls(standardCards, 'all');
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
              hasOptions
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

type CardRenderStyle = 'list' | 'cards' | 'images';

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
  hasOptions?: boolean;
}
export function SimpleCardList({ noSearch, hasFilters, cards, controls, showCard, header = 'set', renderControl, emptyText, filter: filterCard, hasOptions }: SimpleCardListProps) {
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

  const sections = useMemo(() => {
    const sections: ItemSection[] = [];

    let currentSection: ItemSection = {
      items: [],
    };
    let currentHeader: string | undefined = undefined;
    forEach(visibleCards, card => {
      switch (header) {
        case 'set':
          if (card.set_name && card.set_name !== currentHeader) {
            if (currentSection.items.length || currentSection.title) {
              sections.push(currentSection);
            }
            currentHeader = card.set_name;
            currentSection = {
              title: currentHeader,
              items: [],
            }
          }
          break;
        case 'aspect':
          if (card.aspect_name && card.aspect_name !== currentHeader) {
            if (currentSection.items.length || currentSection.title) {
              sections.push(currentSection);
            }

            currentHeader = card.aspect_name;
            currentSection = {
              title: currentHeader,
              items: [],
            }
          }
          break;
        case 'none':
          break;
      }

      currentSection.items.push({
        type: 'card',
        card,
      });
    });
    if (currentSection.items.length || currentSection.title) {
      sections.push(currentSection);
    }
    return sections;
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
  const [renderStyle, setRenderStyle] = useState<CardRenderStyle>('list');
  const onRenderStyleChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.currentTarget.value;
    if (value !== renderStyle && (value === 'list' || value === 'cards' || value === 'images')) {
      setRenderStyle(value);
    }
  }, [renderStyle, setRenderStyle]);
  return (
    <>
      { !noSearch && (
        <Flex direction="row">
          <Input
            flex={2}
            type="search"
            value={search}
            placeholder={t`Search by name`}
            onChange={e => setSearch(e.target.value)}
          />
          { !!hasOptions && (
            <Select ml={2} flex={1} onChange={onRenderStyleChange}>
              <option value="list">{t`View as Checklist`}</option>
              <option value="cards">{t`View as Cards`}</option>
              <option value="images">{t`View as Images`}</option>
            </Select>
          ) }
          { !!controls && <IconButton marginLeft={2} onClick={onToggle} icon={<FaFilter />} aria-label={t`Advanced controls`} />}
        </Flex>
      ) }
      { !!controls && (
        <Collapse in={isOpen}>
          <Box marginLeft={4} padding={4} marginRight={8} borderLeftWidth="1px" borderLeftColor={colors.divider}>
            { controls }
          </Box>
        </Collapse>
      )}
      { sections.length ?
        map(sections, section => <CardListSection section={section} renderControl={renderControl} showCard={showCard} renderStyle={renderStyle} />)
        : emptyState }
    </>
  );
}

function CardListSection({ section, renderControl, renderStyle, showCard }: {
  section: ItemSection;
  renderControl?: (card: CardFragment) => React.ReactNode;
  renderStyle: CardRenderStyle;
  showCard: (card: CardFragment) => void;
}) {
  switch (renderStyle) {
    case 'list':
      return (
        <List>
          { !!section.title &&  <CardHeader key={section.title} title={section.title} /> }
          { map(section.items, item => (
            <CardButtonRow key={item.card.id} card={item.card} showModal={showCard}>
              { !!renderControl && !!item.card.id && renderControl(item.card)}
            </CardButtonRow>
          )) }
        </List>
      );
    case 'cards':
      return (
        <List>
          { !!section.title && <CardHeader key={section.title} title={section.title} /> }
          <Wrap>
            { map(section.items, item => (
              <WrapItem key={item.card.id}>
                <Box maxWidth={300}>
                  <Card card={item.card} noImage />
                </Box>
              </WrapItem>)
            ) }
          </Wrap>
        </List>
      );
    case 'images':
      return (
        <List>
          { !!section.title && <CardHeader key={section.title} title={section.title} /> }
          <Wrap>
            { map(section.items, item => (
              <WrapItem padding={2} key={item.card.id}>
                {item.card.imagesrc ?
                  <CardImage title={item.card.name ?? ''} url={item.card.imagesrc} size="large" /> :
                  <CardImagePlaceholder title={item.card.name ?? ''} size="large" />
                }
              </WrapItem>
            )) }
          </Wrap>
        </List>
      );
    }
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