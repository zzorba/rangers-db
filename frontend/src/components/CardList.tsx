import React, { useCallback, useContext, useMemo, useState } from 'react';
import { filter, trim, forEach, map, partition, sortBy } from 'lodash';
import { plural, t } from '@lingui/macro';
import { FaFilter } from 'react-icons/fa';
import { Box, Button, ButtonGroup, Flex, Input, List, ListItem, Text, useDisclosure, Tabs, TabList, Tab, TabPanel, TabPanels, IconButton, Collapse, Select, Wrap, WrapItem, useConst } from '@chakra-ui/react';

import { CardFragment } from '../generated/graphql/apollo-schema';
import Card, { CardRow, RenderCardControl, useCardModal } from './Card';
import LoadingPage from './LoadingPage';
import { useLocale } from '../lib/TranslationProvider';
import ListHeader from './ListHeader';
import { useCardSearchControls } from './CardFilter';
import { useTheme } from '../lib/ThemeContext';
import CardImage, { CardImagePlaceholder } from './CardImage';
import { useAllCards } from '../lib/cards';
import { useAuth } from '../lib/AuthContext';
import { usePackSettings } from '../lib/PackSettingsContext';

type PackCollectionContextType = {
  mode: 'annotate' | 'hide' | 'disabled';
  packs: Set<string>;
  showNonCollection: boolean;
  toggleShowNonCollection?: () => void;
  tabooSet?: string;
}
export const PackCollectionContext = React.createContext<PackCollectionContextType>({
  mode: 'disabled',
  packs: new Set([]),
  showNonCollection: true,
  toggleShowNonCollection: undefined,
  tabooSet: undefined,
});

export const CURRENT_TABOO_SET = 'set_01';
export const PackCollectionContextProvider = ({ children, mode = 'hide' }: { children: React.ReactNode; mode?: 'annotate' | 'hide' }) => {
  const collection = usePackSettings();
  const { authUser } = useAuth();
  const [showNonCollection, setShowNonCollection] = useState(false);
  const context: PackCollectionContextType = useMemo(() => {
    if (!authUser || !collection) {
      // logged out or loading mode.
      return {
        mode: 'disabled',
        packs: new Set(),
        showNonCollection: true,
      };
    }
    return {
      mode,
      packs: new Set(collection.packs),
      tabooSet: collection.taboo ? CURRENT_TABOO_SET : undefined,
      showNonCollection,
      toggleShowNonCollection: () => {
        setShowNonCollection(!showNonCollection);
      },
    };
  }, [mode, authUser, showNonCollection, setShowNonCollection, collection]);
  return (
    <PackCollectionContext.Provider value={context}>
      {children}
    </PackCollectionContext.Provider>
  );
};


function CardButtonRow({ card, showModal, children, tab }: {
  card: CardFragment;
  showModal: (card: CardFragment, tab?: 'displaced' | 'reward') => void;
  children?: React.ReactNode;
  tab?: 'displaced' | 'reward';
}) {
  const onClick = useCallback(() => showModal(card, tab), [card, tab, showModal]);

  return (
    <ListItem>
      <CardRow card={card} onClick={onClick}>
        {children}
      </CardRow>
    </ListItem>
  );
}

function CardHeader({ title, subHeader }: { title: string; subHeader?: boolean }) {
  return (
    <ListItem padding={2} paddingTop={4} paddingBottom={0} borderBottomWidth={subHeader ? 0 : 0.5} borderColor="#888888">
      <Text fontStyle="italic" fontSize={subHeader ? 's' : 'm'}>{title}</Text>
    </ListItem>
  );
}

interface CardItem {
  type: 'card';
  card: CardFragment;
  inCollection: boolean;
}

interface HeaderItem {
  type: 'header',
  title: string;
}

type Item = CardItem | HeaderItem;

type ItemSection = {
  title?: string;
  items: CardItem[];
  nonCollectionItems: CardItem[];
}


export default function CardList() {
  const { tabooSet } = useContext(PackCollectionContext);
  const cards = useAllCards(tabooSet);
  const [showCard, modal] = useCardModal();
  const [standardCards, rewardCards] = useMemo(() => {
    return partition(cards, c => c.set_id !== 'reward' && c.set_id !== 'malady');
  }, [cards]);

  const [controls, hasFilters, filterCard] = useCardSearchControls(standardCards, 'all');
  if (!cards) {
    return <LoadingPage />;
  }
  return (
    <>
      <Tabs width="100%">
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
              hasOptions
            />
          </TabPanel>
        </TabPanels>
      </Tabs>
      { modal }
    </>
  );
}

type CardRenderStyle = 'list' | 'cards' | 'images';

function CardRenderStyleSelect({ value, onChange }: { value: CardRenderStyle; onChange: (value: CardRenderStyle) => void }) {
  const onRenderStyleChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.currentTarget.value;
    if (newValue !== value && (newValue === 'list' || newValue === 'cards' || newValue === 'images')) {
      onChange(newValue);
    }
  }, [value, onChange]);
  return (
    <Select onChange={onRenderStyleChange}>
      <option value="list">{t`View as Checklist`}</option>
      <option value="cards">{t`View as Cards`}</option>
      <option value="images">{t`View as Images`}</option>
    </Select>
  );
}

interface SimpleCardListProps {
  cards?: CardFragment[];
  showCard: (card: CardFragment) => void;
  header?: 'aspect' | 'set' | 'none';
  advancedControls?: React.ReactNode;
  filter?: (card: CardFragment) => boolean;
  renderControl?: RenderCardControl;
  emptyText?: string;
  controls?: React.ReactNode;
  noSearch?: boolean;
  hasFilters?: boolean;
  hasOptions?: boolean;
  renderStyle?: CardRenderStyle;
  context?: 'extra';
  tab?: 'displaced' | 'reward';
}

export function CardListWithFilters({ cards, ...props  }: Omit<SimpleCardListProps, 'hasFilters' | 'filter' | 'controls'>) {
  const [controls, hasFilters, filterCard] = useCardSearchControls(cards, 'local');
  return  (
    <SimpleCardList
      cards={cards}
      filter={filterCard}
      controls={controls}
      hasFilters={hasFilters}
      {...props}
    />
  );
}

export function SimpleCardList({ tab, context, noSearch, hasFilters, cards, controls, showCard, header = 'set', renderControl, emptyText, filter: filterCard, hasOptions, renderStyle: propRenderStyle }: SimpleCardListProps) {
  const collection = useContext(PackCollectionContext);
  const { locale } = useLocale();
  const [search, setSearch] = useState('');
  const visibleCards = useMemo(() => {
    const filtered = filterCard ? filter(cards, c => filterCard(c)) : cards;
    if (!trim(search)) {
      return sortBy(filtered, c => (c.pack_position ?? 0) * 1000 + (c.position ?? 0));
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
      nonCollectionItems: [],
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
              nonCollectionItems: [],
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
              nonCollectionItems: [],
            }
          }
          break;
        case 'none':
          break;
      }

      const inCollection = card.pack_id === 'core' || collection.packs.has(card.pack_id ?? '');
      if (collection.mode === 'hide' && !inCollection) {
        currentSection.nonCollectionItems.push({
          type: 'card',
          card,
          inCollection: false,
        });
        return;
      } else {
        currentSection.items.push({
          type: 'card',
          card,
          inCollection: collection.mode === 'disabled' ? true : inCollection,
        });
      }
    });
    if (currentSection.items.length || currentSection.title) {
      sections.push(currentSection);
    }
    return sections;
  }, [visibleCards, header, collection]);
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
  return (
    <>
      { !noSearch && !!cards?.length && (
        <Flex direction={{ base: 'column', md: 'row' }}>
          <Box flex={1}>
            <Input
              type="search"
              value={search}
              placeholder={t`Search by name`}
              onChange={e => setSearch(e.target.value)}
            />
          </Box>
          { (!!hasOptions || !!controls) && (
            <Flex direction="row" ml={{ base: 0, md: 2 }} mt={{ base: 2, md: 0 }} >
              { !!hasOptions && <CardRenderStyleSelect value={renderStyle} onChange={setRenderStyle} /> }
              { !!controls && <IconButton marginLeft={2} onClick={onToggle} icon={<FaFilter />} aria-label={t`Advanced controls`} />}
            </Flex>
          ) }
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
        map(sections, (section, idx) => (
          <CardListSection
            key={idx}
            section={section}
            renderControl={renderControl}
            showCard={showCard}
            renderStyle={propRenderStyle ?? renderStyle}
            context={context}
            tab={tab}
          />)
        )
        : emptyState }
    </>
  );
}

function CardListSection({ section, renderControl, renderStyle, showCard, context, tab}: {
  section: ItemSection;
  renderControl?: RenderCardControl;
  renderStyle: CardRenderStyle;
  showCard: (card: CardFragment) => void;
  context?: 'extra';
  tab?: 'reward' | 'displaced';
}) {
  const { mode, showNonCollection, toggleShowNonCollection } = useContext(PackCollectionContext);
  const nonCollectionCardCount = section.nonCollectionItems.length;
  switch (renderStyle) {
    case 'list':
      return (
        <List>
          { !!section.title && <CardHeader key={section.title} title={section.title} /> }
          { map(section.items, item => (
            <CardButtonRow key={item.card.code} card={item.card} showModal={showCard} tab={tab}>
              { !!renderControl && !!item.card.code && renderControl(item.card, { context, tab })}
            </CardButtonRow>
          )) }
          { mode === 'hide' && !!section.nonCollectionItems.length && (
            <>
              <Flex direction="row" alignItems="center">
                <Flex flex={1}>
                  {showNonCollection && <CardHeader key={section.title} title={`Non-collection`} subHeader />}
                </Flex>
                <Button
                  marginTop={2}
                  marginRight={2}
                  size="xs"
                  onClick={toggleShowNonCollection}
                >{showNonCollection ? t`Hide` :
                  plural(nonCollectionCardCount, { one: `Show ${nonCollectionCardCount} non-collection`, other: `Show ${nonCollectionCardCount} non-collection` })}
                </Button>
              </Flex>
               { showNonCollection && map(section.nonCollectionItems, item => (
                <CardButtonRow key={item.card.code} card={item.card} showModal={showCard} tab={tab}>
                  { !!renderControl && !!item.card.code && renderControl(item.card, { context, tab })}
                </CardButtonRow>
              )) }
            </>
          )}
        </List>
      );
    case 'cards':
      return (
        <List>
          { !!section.title && <CardHeader key={section.title} title={section.title} /> }
          <Wrap>
            { map(section.items, item => (
              <WrapItem key={item.card.code}>
                <Box maxWidth={{ base: undefined, md: 300 }}>
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
              <WrapItem padding={2} key={item.card.code}>
                {item.card.imagesrc ?
                  <CardImage title={item.card.name ?? ''} url={item.card.imagesrc} size="large" /> : (
                  <CardImagePlaceholder card={item.card} size="large">
                    <Card card={item.card} noImage />
                  </CardImagePlaceholder>
                )}
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
  hasOptions,
  tab,
}: {
  unlocked?: string[];
  cards: CardFragment[] | undefined;
  showCard: (card: CardFragment, tab?: 'reward' | 'displaced') => void;
  renderControl?: RenderCardControl;
  upsellText?: string;
  header?: 'aspect' | 'set' | 'none';
  hasOptions?: boolean,
  tab?: 'displaced' | 'reward';
}) {
  const { locale } = useLocale();
  const [search, setSearch] = useState('');
  const { isOpen: showAll, onOpen: onShow, onClose: onHide } = useDisclosure();
  const unlockedCards = useMemo(() => {
    const unlockedSet = new Set(unlocked);
    return filter(cards, c => !!c.code && unlockedSet.has(c.code));
  }, [unlocked, cards]);
  const visibleCards = useMemo(() => {
    const lowerSearch = search.toLocaleLowerCase(locale);
    return filter(cards, c => !!showAll || !!(
      c.name && search.length >= 2 && c.name.toLocaleLowerCase(locale).indexOf(lowerSearch) !== -1)
    );
  }, [cards, search, showAll, locale]);
  const [renderStyle, setRenderStyle] = useState<CardRenderStyle>('list');
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
        <CardButtonRow key={c.code} card={c} showModal={showCard} tab={tab}>
          { renderControl && renderControl(c) }
        </CardButtonRow>
      )) }
      { header !== 'set' && <ListHeader title={t`All`} /> }
      <ListItem padding={2}>
        <form onSubmit={e => {
          e.preventDefault();
        }}>
          <Flex direction={{ base: 'column', md: 'row' }}>
            <Box flex={2}>
              <Input
                type="search"
                value={search}
                placeholder={t`Search by name`}
                onChange={e => setSearch(e.target.value)}
              />
            </Box>
            <Flex direction="row" flex={1} ml={{ base: 0, md: 2 }} mt={{ base: 2, md: 0 }} >
              { !!hasOptions && <CardRenderStyleSelect value={renderStyle} onChange={setRenderStyle} /> }
              <ButtonGroup marginLeft={2}>
                <Button onClick={showAll ? onHide : onShow}>{showAll ? t`Hide spoilers` : t`Show all` }</Button>
              </ButtonGroup>
            </Flex>
          </Flex>
        </form>
      </ListItem>
      <SimpleCardList
        noSearch
        emptyText={!search ? t`Note: These cards might contain campaign spoilers.` : t`No matching cards found.`}
        cards={visibleCards}
        showCard={showCard}
        renderControl={renderControl}
        header={header}
        renderStyle={renderStyle}
        tab={tab}
      />
    </List>
  );
}