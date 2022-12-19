import React, { useCallback, useEffect } from 'react';
import { Box, Button, Flex, Text, useColorModeValue, useRadio, useRadioGroup, UseRadioProps } from '@chakra-ui/react';
import { map } from 'lodash';
import { Slots } from '../types/types';
import { CardFragment } from '../generated/graphql/apollo-schema';

export default function CardCount({
  count,
  marginLeft,
  light,
}: { count: number, marginLeft?: number; light?: boolean }) {
  return (
    <Box fontFamily="mono"
      borderRadius="md"
      borderWidth="1px"
      bg={useColorModeValue('gray.100', 'gray.600')}
      borderColor="gray.300"
      color={useColorModeValue('gray.800', 'white')}
      padding={2}
      marginLeft={marginLeft}
      px={2}
      py={3}
    >
      { `×${count}` }
    </Box>
  );
}

export function RadioCardCount(props: UseRadioProps & { children: React.ReactNode }) {
  const { getInputProps, getCheckboxProps } = useRadio(props);
  const input = getInputProps()
  const checkbox = getCheckboxProps()
  return (
    <Box as='label' marginLeft={2}>
      <input {...input} />
      <Box
        {...checkbox}
        cursor='pointer'
        borderWidth='1px'
        borderRadius='md'
        boxShadow='md'
        _checked={{
          bg: 'gray.600',
          color: 'white',
          borderColor: 'gray.600',
        }}
        _focus={{
          boxShadow: 'outline',
        }}
        px={4}
        py={3}
        marginBottom={0}
      >
        {props.children}
      </Box>
    </Box>
  );
}


export function RadioCardToggle(props: UseRadioProps & { children: React.ReactNode }) {
  const { getInputProps, getCheckboxProps } = useRadio(props);
  const input = getInputProps()
  const checkbox = getCheckboxProps()
  return (
    <Box as='label' marginBottom={2} padding={0} margin={0}>
      <input {...input} />
      <Box
        {...checkbox}
        cursor='pointer'
        borderWidth='1px'
        borderRadius='md'
        boxShadow='md'
        _checked={{
          bg: 'gray.600',
          color: 'white',
          borderColor: 'gray.600',
        }}
        _focus={{
          boxShadow: 'outline',
        }}
        px={3}
        py={2}
        marginBottom={0}
      >
        {props.children}
      </Box>
    </Box>
  );
}

export function CountToggle({ code, slots, setSlots }: { code: string; slots: Slots; setSlots: (code: string, count: number) => void }) {
  const selected = !!slots[code];
  const onToggle = useCallback(() => {
    setSlots(code, selected ? 0 : 2);
  }, [code, setSlots, selected]);
  return (
    <Box
      onClick={onToggle}
      cursor='pointer'
      borderWidth='1px'
      borderRadius='md'
      boxShadow='md'
      bg={selected ? 'gray.600' : undefined}
      color={selected ? 'white' : undefined}
      borderColor={selected ? 'gray.600' : undefined}
      px={3}
      py={2}
    >
      <Text fontSize="xl">{selected ? '–' : '+'}</Text>
    </Box>
  );
}

export function CountControls({ card, slots, setSlots, onClose, countMode }: {
  onClose?: () => void;
  card: CardFragment;
  slots: Slots;
  setSlots: (card: CardFragment, count: number) => void;
  countMode?: 'noah';
}) {
  const onChange = useCallback((value: string) => {
    if (value === '+') {
      setSlots(card, 2);
    } else if (value === '-') {
      setSlots(card, 0);
    } else {
      setSlots(card, parseInt(value));
    }
    onClose?.();
  }, [card, setSlots, onClose]);
  const currentCount = `${(card.id && slots[card.id]) || 0}`;
  const { getRadioProps } = useRadioGroup({
    name: 'deck-count',
    value: currentCount,
    onChange: onChange,
  });
  return (
    <Flex direction="row">
      { map(countMode === 'noah' ? ['0', '2'] : ['0', '1', '2'], value => {
        const radio = getRadioProps({ value });
        return (
          <RadioCardCount key={value} {...radio}>
            {value}
          </RadioCardCount>
        );
      }) }
    </Flex>
  );
}


export function IncDecCountControls({ card, slots, setSlots, onClose }: {
  onClose?: () => void;
  card: CardFragment;
  slots: Slots;
  setSlots: (card: CardFragment, count: number) => void;
}) {
  const onInc = useCallback(() => {
    if (card.id) {
      setSlots(card, Math.min((slots[card.id] || 0) + 1, card.quantity || 2));
    }
  }, [card, slots, setSlots]);
  const count = (card.id && slots[card.id]) || 0;
  const onDec = useCallback(() => {
    if (card.id) {
      setSlots(card, Math.max((slots[card.id] || 0) - 1, 0));
    }
  }, [card, slots, setSlots]);
  return (
    <Flex direction="row" alignItems="center" marginLeft={2}>
      <Button variant="ghost" onClick={onDec} disabled={count <= 0}>−</Button>
      <CardCount count={count} marginLeft={1} />
      <Button variant="ghost" onClick={onInc} disabled={count >= (card.quantity || 2)} marginLeft={1}>+</Button>
    </Flex>
  );
}