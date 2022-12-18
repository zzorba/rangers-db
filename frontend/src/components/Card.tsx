import React, { useCallback, useState } from 'react';
import {
  Box,
  Text,
  Flex,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  SimpleGrid,
  AspectRatio,
} from '@chakra-ui/react';
import { map, range } from 'lodash';
import { t } from '@lingui/macro';

import CardText from './CardText';
import { CardFragment } from '../generated/graphql/apollo-schema';
import { Aspect, DeckCardError, DeckError, Slots } from '../types/types';
import { getPlural } from '../lib/lang';
import CoreIcon from '../icons/CoreIcon';
import CardCount, { CountControls } from './CardCount';
import DeckProblemComponent, { DeckCardProblemTooltip } from './DeckProblemComponent';
import { useLocale } from '../lib/TranslationProvider';
import CardImage, { RoleImage } from './CardImage';

interface Props {
  card: CardFragment;
}

function renderNumber(value: number) {
  if (value === -2) {
    return 'X';
  }
  return value;
}

function AspectLevel({ card, mini }: { card: CardFragment; mini?: boolean }) {
  const { aspects} = useLocale();
  const aspect = card.aspect_id && aspects[card.aspect_id];
  if (!aspect) {
    return null;
  }
  if (mini) {
    return (
      <Box padding={0.5} paddingLeft={1} paddingRight={1} backgroundColor={card.aspect_id ? `aspect.${card.aspect_id}` : undefined}>
        <Text color="#FFFFFF" fontWeight={900} fontSize="xs">
          { !!card.level && card.level }&nbsp;
          { aspect.short_name }
        </Text>
      </Box>
    );
  }
  return (
    <Box padding={1} paddingLeft={2} paddingRight={2} backgroundColor={card.aspect_id ? `aspect.${card.aspect_id}` : undefined}>
      <Text color="#FFFFFF" fontWeight={900} fontSize="m">
        { !!card.level && `${card.level} ` }
        {aspect.short_name}
      </Text>
    </Box>
  );
}
function FooterInfo({ card }: { card: CardFragment }) {
  return (
    <Flex direction="row" justifyContent="flex-start" alignItems="flex-end">
      <Flex direction="row" justifyContent="flex-end" maxH="2em" flex={1}>
        <AspectLevel card={card} />
        <Box padding={1} paddingLeft={2} paddingRight={2} backgroundColor="#888888" flexDirection="column">
          <Text fontSize="s" color="#EEEEEE" fontWeight={400}>
            { card.set_name } - {t`${card.set_position} of ${card.set_size}`}
          </Text>
        </Box>
      </Flex>
    </Flex>
  );
}

function Equip({ equip, aspect }: { equip: number; aspect?: string }) {
  return (
    <Flex
      direction="row"
      padding={1}
    >
      { map(range(0, equip), idx => (
        <div className={`equip ${aspect}`} key={idx} />
      )) }
      { map(range(equip, 5), idx => (
        <div className="equip" key={idx} />
      )) }
    </Flex>
  );
}

function Cost({ cost, aspectId, aspect }: { cost: number | null | undefined; aspectId: string | null | undefined; aspect?: Aspect }) {
  const hasCost = cost !== null && cost !== undefined;
  return (
    <Box
      bg={aspectId ? `aspect.${aspectId}` : `gray.200`}
      paddingTop={1}
      minWidth={12}
      minHeight={12}
      flexDirection="column"
      justifyContent={hasCost ? 'center' : 'flex-end'}
      alignItems="center"
      marginRight={2}
      position="relative"
    >
      { !!aspectId && (
        <Flex direction="column" alignItems="center" justifyContent="center" position="absolute" top="0" left="0" height="100%" width="100%" >
          <AspectRatio width="90%" ratio={1}>
            <CoreIcon icon={`${aspectId.toLowerCase()}_chakra`} size={50} color={hasCost ? '#FFFFFF66' : '#FFFFFF99' } />
          </AspectRatio>
        </Flex>
      ) }
      <Flex direction="column" justifyContent="center" alignItems="center" flex={1} minHeight={12}>
        { !!aspect && cost !== null && cost !== undefined && (
          <Text
            color={aspect ? 'white' : 'black'}
            fontSize="2xl"
            fontWeight={900}
            textAlign="center"
            lineHeight={1.1}
          >
            { renderNumber(cost) }
          </Text>
        ) }
        { !!aspect && (
          <Text textAlign="center" color={aspect ? 'white': 'black'} lineHeight={0.8} fontWeight={600} fontSize="xs">
            {aspect.short_name}
          </Text>
        ) }
      </Flex>
    </Box>
  );
}

function ApproachIcon({ type, mini }: { type: 'conflict' | 'reason' | 'connection' | 'exploration'; mini?: boolean}) {
  return (
    <Flex borderRadius={4}
      padding={mini ? 0.5 : 1}
      paddingTop={mini ? 0.5 : 2}
      paddingBottom={mini ? 0.5 : 2}
      backgroundColor="#222222"
      direction="column" alignItems="center" justifyContent="center" marginLeft={mini ? 0.5 : 1}>
      <CoreIcon icon={type} size={mini ? 18 : 24} color="#FFFFFF" />
    </Flex>
  )
}
function ApproachIcons({ card, mini }: { card: CardFragment; mini?: boolean }) {
  return (
    <Flex direction="row">
      { map(range(0, card.approach_conflict || 0), idx => <ApproachIcon type="conflict" key={idx} mini={mini} /> ) }
      { map(range(0, card.approach_connection || 0), idx => <ApproachIcon type="connection" key={idx} mini={mini} /> ) }
      { map(range(0, card.approach_exploration || 0), idx => <ApproachIcon type="exploration" key={idx} mini={mini} /> ) }
      { map(range(0, card.approach_reason || 0), idx => <ApproachIcon type="reason" key={idx} mini={mini} /> ) }
    </Flex>
  );
}

function Tokens({ count, name, plurals, aspect, aspectId }: { count: number; name: string; plurals: string; aspect: Aspect | undefined; aspectId: string | undefined | null }) {
  return (
    <Flex
      bg={aspectId ? `aspect.${aspectId}` : undefined}
      padding={2}
      paddingTop={1}
      margin={1}
      marginRight={0}
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
    >
      <Text
        color={aspect ? '#FFFFFF' : '#000000'}
        fontSize="2xl"
        fontWeight={900}
        textAlign="center"
        lineHeight={1.1}
      >
        {count}
      </Text>
      { !!aspect && (
        <Text color={aspect ? '#FFFFFF': '#000000'} lineHeight={0.8} fontWeight={600} fontSize="xs">
          { getPlural('en', plurals, count) }
        </Text>
      ) }
    </Flex>
  );
}

function CardPresenceAndIcons({ card, mini }: { card: CardFragment; mini?: boolean }) {
  return (
    <Flex direction="row" flex={1} alignItems="flex-start" justifyContent="flex-end" backgroundClip="blue">
      { (card.presence !== undefined && card.presence !== null) && (
        <Box padding={mini ? 0.5 : 1} paddingLeft={mini ? 2 : 3} paddingRight={mini ? 2 : 3} maxW={10} maxH={10} marginRight={1} marginLeft={3} backgroundColor="#622c52">
          <Text color="#FFFFFF" fontSize={mini ? 'm' : 'xl'} fontWeight={900}>
            {card.presence}
          </Text>
        </Box>
      ) }
      <ApproachIcons card={card} mini={mini} />
    </Flex>
  );
}

const CardHeader = ({ card, flex, miniLevel, problem, includeSet, includeText }: Props & { flex?: number; miniLevel?: boolean; problem?: DeckCardError[]; includeSet?: boolean; includeText?: boolean }) => {
  const { aspects, locale } = useLocale();
  const aspect = (card.aspect_id && aspects[card.aspect_id]) || undefined;
  const cardTraits = card.traits && locale === 'de'
      ? card.traits.split(' / ').map((item) => '¬' + item).join(' / ')
      : card.traits;
  return (
    <Flex direction="row" flex={flex} alignItems="flex-start">
      <Flex direction="row" flexGrow={1} alignItems="flex-start">
        { card.type_id === 'role' && card.imagesrc ? (
          <RoleImage name={card.name} url={card.imagesrc} />
        ) : (
          <Cost cost={card.cost} aspectId={card.aspect_id} aspect={aspect} />
        ) }
        <Flex direction="column">
          <DeckCardProblemTooltip errors={problem}>
            <Text fontSize="xl" fontWeight={600} textDecorationLine={problem ? 'line-through' : undefined} noOfLines={2}>{card.name}</Text>
          </DeckCardProblemTooltip>
          <Flex direction="row">
            { includeText && card.text ? (
              <CardText noPadding text={card.text} aspectId={card.aspect_id} />
            ) : (
              <>
                <Text fontSize="xs" fontWeight={600} noOfLines={2} paddingRight={2}>
                  { locale === 'de' ? '¬' : ''}{card.type_name}{cardTraits ? <i> / {cardTraits}</i> : ''}
                  { includeSet && card.type_id === 'role' ? ` - ${card.set_name} Specialty` : ''}
                </Text>
                { !!card.equip && <Equip equip={card.equip} aspect={card.aspect_id || undefined} /> }
              </>
            ) }
          </Flex>
        </Flex>
      </Flex>
      { miniLevel ? (
        <Flex direction="column" alignItems="flex-end">
          <CardPresenceAndIcons card={card} mini />
          <Flex direction="row" justifyContent="flex-end" marginTop={1}>
            <AspectLevel card={card} mini />
          </Flex>
        </Flex>
      ) : <CardPresenceAndIcons card={card} /> }
    </Flex>
  );
};

function CardBody({ card, padding, problem, count, detail }: Props & { padding?: number; problem?: DeckError[]; count?: number; detail?: boolean }) {
  const { aspects } = useLocale();
  const aspect = (card.aspect_id && aspects[card.aspect_id]) || undefined;
  return (
    <Flex direction={['column', 'column', 'row']} >
      <Flex direction="column" flex={1}>
        <DeckProblemComponent card errors={problem} limit={1} />
        <Flex direction="row" alignItems="flex-start" padding={padding}>
          <Flex direction="column" flex={1}>
            { !!(card.text || card.flavor) && <CardText text={card.text} flavor={card.flavor} aspectId={card.aspect_id} /> }
          </Flex>
          { card.token_name && card.token_plurals && (
            <Tokens
              count={card.token_count || 0}
              name={card.token_name}
              plurals={card.token_plurals}
              aspect={aspect}
              aspectId={card.aspect_id}
            />
          ) }
          { !!card.harm && (
            <Box padding={1} paddingLeft={3} paddingRight={3} marginLeft={2} marginBottom={2} backgroundColor="#ad1b23">
              <Text color="#FFFFFF" fontSize="xl" fontWeight={900} >
                { card.harm }
              </Text>
            </Box>
          ) }
        </Flex>

        { !!detail && (
          <Flex direction="column" flex={1} alignItems="flex-start" justifyContent="flex-end" margin={2}>
            <FooterInfo card={card} />
          </Flex>
        )}
      </Flex>
      <Flex direction="column" alignItems="flex-start" justifyContent="space-between">
        { !!card.imagesrc && (
          <Box margin={2} marginLeft={detail ? 2 : [0, 0, 2]}>
            <CardImage title={card.name || 'Card'} size={detail ? 'large' : 'small'} url={card.imagesrc} />
          </Box>
        ) }
      </Flex>
  </Flex>
  );
}

export default function Card({ card }: Props) {
  return (
    <Box borderWidth={1} margin={2} borderColor={card.aspect_id ? `aspect.${card.aspect_id}` : '#222222'}>
      <Box padding={2}>
        <CardHeader card={card} />
      </Box>
      <CardBody card={card} padding={2} detail />
    </Box>
  );
}

export function CardRow({ card, problem, children, onClick, includeSet, includeText, last }: Props & { children?: React.ReactNode; problem?: DeckCardError[]; includeSet?: boolean; onClick?: () => void; includeText?: boolean; last?: boolean }) {
  return (
    <Flex direction="row" padding={2} flex={1} alignItems="flex-start" borderBottomWidth={last ? undefined : 0.5} borderColor="#BBBBBB">
      <Flex direction="row" flex={1} onClick={onClick} cursor={onClick ? 'pointer' : undefined}>
        <CardHeader card={card} flex={1} miniLevel problem={problem} includeSet={includeSet} includeText={includeText} />
      </Flex>
      { children }
    </Flex>
  );
}

export type ShowCard = (card: CardFragment, problem?: DeckCardError[]) => void;
export function useCardModal(slots?: Slots, renderControl?: (card: CardFragment) => React.ReactNode): [
  ShowCard,
  React.ReactNode,
] {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [card, setCard] = useState<CardFragment>();
  const [problem, setProblem] = useState<DeckCardError[] | undefined>();
  const showModal = useCallback((card: CardFragment, problem?: DeckCardError[]) => {
    setCard(card);
    setProblem(problem);
    onOpen();
  }, [onOpen, setCard, setProblem]);
  const count = (card?.id && slots?.[card.id]) || 0;
  return [
    showModal,
    <Modal key="modal" isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent maxW={['90%', '90%', '90%', '800px']}>
        <ModalHeader>
          <Box paddingRight={8}>
            { !!card && <CardHeader card={card} problem={problem} /> }
          </Box>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody overflowY="scroll">
          <Box paddingBottom={2}>
            {!!card && <CardBody card={card} problem={problem} count={renderControl ? undefined : 1}/> }
          </Box>
        </ModalBody>
        <ModalFooter justifyContent="space-between">
          { !!card && <FooterInfo card={card} /> }
          { !!card && card.type_id !== 'role' && !!slots && (!!renderControl ? renderControl(card) : <CardCount count={count} />) }
        </ModalFooter>
      </ModalContent>
    </Modal>
  ];
}