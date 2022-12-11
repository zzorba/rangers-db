import React, { useCallback } from 'react';
import { AspectRatio, Box, Flex, Text } from '@chakra-ui/react';
import {
  ChevronUpIcon,
  ChevronDownIcon,
} from '@chakra-ui/icons';
import { t } from '@lingui/macro'
import { AspectType, AWA, FIT, FOC, SPI } from '../types/types';
import CoreIcon from '../icons/CoreIcon';

export default function AspectCounter({ aspect, onChange, count }: { aspect: AspectType; onChange?: (value: number) => void; count: number }) {
  const trans = {
    [AWA]: t`AWA`,
    [FIT]: t`FIT`,
    [FOC]: t`FOC`,
    [SPI]: t`SPI`,
  };
  const onInc = useCallback(() => {
    if (count < 3) {
      onChange?.(count + 1);
    }
  }, [count, onChange]);
  const onDec = useCallback(() => {
    if (count > 1) {
      onChange?.(count - 1);
    }
  }, [count, onChange]);
  const decEnabled = !!onChange && count > 1;
  const incEnabled = !!onChange && count < 4;
  return (
    <Flex background={`aspect.${aspect}`} flex={0.25} direction="column" alignItems="center" position="relative">
      <Flex pointerEvents="none" direction="column" alignItems="center" justifyContent="center" position="absolute" top="0" left="0" height="100%" width="100%" >
        <AspectRatio width={onChange ? '75%' : '70%'} ratio={1}>
          <CoreIcon icon={`${aspect.toLowerCase()}_chakra`} size={50} color="#FFFFFF33" />
        </AspectRatio>
      </Flex>
      <Box onClick={onInc} cursor={incEnabled ? 'pointer' : undefined} paddingLeft={6} paddingRight={6} paddingTop={1}>
        <ChevronUpIcon color={incEnabled ? 'white' : 'transparent'} />
      </Box>
      <Text textAlign="center" fontSize="3xl" fontWeight={900} color="white" lineHeight={0.95}>{count}</Text>
      <Text fontWeight={900} color="white" lineHeight={0.95}>{trans[aspect]}</Text>
      <Box onClick={onDec} cursor={decEnabled ? 'pointer' : undefined} paddingLeft={6} paddingRight={6} paddingBottom={1}>
        <ChevronDownIcon color={decEnabled ? 'white' : 'transparent'} />
      </Box>
    </Flex>
  );
}