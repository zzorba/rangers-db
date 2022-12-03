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
} from '@chakra-ui/react';
import { map, range } from 'lodash';
import { t } from 'ttag';

import CardText from '../CardText';
import { CardFragment } from '../generated/graphql/apollo-schema';
import { Aspect, AspectMap } from '../types/types';
import { getPlural } from '../lib/lang';

import './Card.css';
import CoreIcon from '../icons/CoreIcon';

interface Props {
  card: CardFragment;
  aspects: AspectMap;
}

function AspectLevel({ card, aspects }: { card: CardFragment; aspects: AspectMap }) {
  const aspect = card.aspect_id && aspects[card.aspect_id];
  if (!aspect) {
    return null;
  }
  return (
    <Box padding={1} paddingLeft={2} paddingRight={2} backgroundColor={aspect?.color}>
      <Text color="#FFFFFF" fontWeight={900}>
        { !!card.level && `${card.level} ` }
        {aspect.short_name}
      </Text>
    </Box>
  );
}
function FooterInfo({ card, aspects }: { card: CardFragment; aspects: AspectMap }) {
  return (
    <Flex direction="row" justifyContent="flex-end">
      <AspectLevel aspects={aspects} card={card} />
      <Box padding={1} paddingLeft={2} paddingRight={2} backgroundColor="#888888" flexDirection="column">
        <Text fontSize="s" color="#EEEEEE" fontWeight={400}>
          { card.set_name } - {t`${card.set_position} of ${card.set_size}`}
        </Text>
      </Box>
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
      { map(range(equip, 6), idx => (
        <div className="equip" key={idx} />
      )) }
    </Flex>
  );
}

function Cost({ cost, aspect }: { cost: number; aspect?: Aspect }) {
  return (
    <Box
      bg={aspect?.color}
      padding={1}
      paddingLeft={3}
      paddingRight={3}
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      marginRight={2}
    >
      <Text
        color={aspect ? '#FFFFFF' : '#000000'}
        fontSize="2xl"
        fontWeight={900}
        textAlign="center"
        lineHeight={1.1}
      >
        {cost}
      </Text>
      { !!aspect && (
        <Text color={aspect ? '#FFFFFF': '#000000'} lineHeight={0.8} fontWeight={600} fontSize="xs">
          {aspect.short_name}
        </Text>
      ) }
    </Box>
  );
}

function ApproachIcon({ type }: { type: 'conflict' | 'reason' | 'connection' | 'exploration'}) {
  return (
    <Flex borderRadius={4} padding={1} backgroundColor="#222222" direction="column" alignItems="center" justifyContent="center" marginLeft={1}>
      <CoreIcon icon={type} size={24} color="#FFFFFF" />
    </Flex>
  )
}
function ApproachIcons({ card }: { card: CardFragment }) {
  return (
    <Flex direction="row">
      { map(range(0, card.approach_conflict || 0), idx => <ApproachIcon type="conflict" key={idx} /> ) }
      { map(range(0, card.approach_connection || 0), idx => <ApproachIcon type="connection" key={idx} /> ) }
      { map(range(0, card.approach_exploration || 0), idx => <ApproachIcon type="exploration" key={idx} /> ) }
      { map(range(0, card.approach_reason || 0), idx => <ApproachIcon type="reason" key={idx} /> ) }
    </Flex>
  );
}

function Tokens({ count, name, plurals, aspect }: { count: number; name: string; plurals: string; aspect: Aspect | undefined; }) {
  return (
    <Box
      bg={aspect?.color}
      padding={2}
      paddingTop={1}
      margin={1}
      marginRight={0}
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      maxH="4xl"
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
    </Box>
  );
}

function CardHeader({ card, aspects, flex }: Props & { flex?: number }) {
  const aspect = (card.aspect_id && aspects[card.aspect_id]) || undefined;
  return (
    <Flex direction="row" flex={flex}>
      { card.cost !== undefined && card.cost !== null && <Cost cost={card.cost} aspect={aspect} /> }
      <Flex direction="column" flexGrow={1}>
        <Text fontSize="xl" fontWeight={600}>{card.name}</Text>
        <Flex direction="row">
          <Text fontSize="xs" fontWeight={600}>
            {card.type_name}&nbsp;
          </Text>
          { card.traits && <Text fontSize="xs" fontStyle="italic" fontWeight={600}>/ {card.traits}</Text> }
          { !!card.equip && <Equip equip={card.equip} aspect={card.aspect_id || undefined} /> }
        </Flex>
      </Flex>
      <ApproachIcons card={card} />
    </Flex>
  );
}

function CardBody({ card, aspects, padding }: Props & { padding?: number }) {
  const aspect = (card.aspect_id && aspects[card.aspect_id]) || undefined;
  return (
    <>
      <Flex direction="row" alignItems="flex-end" padding={padding}>
        <Flex direction="column" flex={1}>
          { !!card.text && <CardText text={card.text} aspects={aspects} aspect={aspect} /> }
        </Flex>
        { card.token_name && card.token_plurals && <Tokens count={card.token_count || 0} name={card.token_name} plurals={card.token_plurals} aspect={aspect} /> }
      </Flex>
      <FooterInfo card={card} aspects={aspects} />
    </>
  );
}

export default function Card({ card, aspects }: Props) {
  const aspect = (card.aspect_id && aspects[card.aspect_id]) || undefined;
  return (
    <Box borderWidth={1} margin={2} borderColor={aspect?.color || '#222222'}>
      <Box padding={2}>
        <CardHeader card={card} aspects={aspects} />
      </Box>
      <CardBody card={card} aspects={aspects} padding={2} />
    </Box>
  );
}

export function CardRow({ card, aspects }: Props) {
  return (
    <Flex direction="row" padding={2} flex={1} borderBottomWidth={0.5} borderColor="#BBBBBB">
      <CardHeader card={card} aspects={aspects} flex={1} />
      <Flex direction="column" justifyContent="flex-end" alignItems="flex-end" marginLeft={2}>
        <AspectLevel card={card} aspects={aspects} />
      </Flex>
    </Flex>
  );
}

export function useCardModal(aspects: AspectMap): [(card: CardFragment) => void, React.ReactNode] {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [card, setCard] = useState<CardFragment>();
  const showModal = useCallback((card: CardFragment) => {
    setCard(card);
    onOpen();
  }, [onOpen, setCard]);
  return [
    showModal,
    <Modal key="modal" isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <Box paddingRight={8}>
            { !!card && <CardHeader card={card} aspects={aspects} /> }
          </Box>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Box paddingBottom={2}>
            {!!card && <CardBody card={card} aspects={aspects} /> }
          </Box>
        </ModalBody>
      </ModalContent>
    </Modal>
  ];
}