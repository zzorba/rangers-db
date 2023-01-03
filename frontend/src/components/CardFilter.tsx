import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { find, filter, trim, map, sortBy, flatMap, uniq, uniqBy } from 'lodash';
import { t } from '@lingui/macro';
import { Flex, Text, FormControl, FormLabel, Input, SimpleGrid, Stack } from '@chakra-ui/react';
import { useQueryState, UseQueryStateOptions } from 'next-usequerystate';
import { createFilter, MultiValue, OptionBase, Select } from 'chakra-react-select';

import { CardFragment } from '../generated/graphql/apollo-schema';
import { useLocale } from '../lib/TranslationProvider';
import { AWA, FIT, FOC, SPI } from '../types/types';
import CoreIcon from '../icons/CoreIcon';

function serializeArray(value: string[]): string {
  return value.join(',');
}
function parseArray(value: string): string[] | null {
  const result = flatMap(value.split(','), x => {
    var r = trim(x);
    if (r) {
      return r;
    }
    return [];
  });

  if (!result.length) {
    return null;
  }
  return result;
}

interface StringOption extends OptionBase {
  value: string;
  name: string;
  label: string | React.ReactNode;
}

interface StringGroupOption {
  readonly label: string;
  readonly options: StringOption[];
}


function MultiSelect({ options, value, setValue, placeholder }: {
  options: StringOption[];
  value: string[] | null;
  setValue: (value: string[]) => void;
  placeholder?: string;
}) {
  const selection = useMemo(() => {
    const set = new Set(value);
    return filter(options, o => set.has(o.value));
  }, [options, value]);
  const onChange = useCallback((event: MultiValue<StringOption>) => {
    setValue(map(event, e => e.value));
  }, [setValue]);

  const searchFilter = useMemo(() => createFilter<StringOption>({
    ignoreCase: true,
    ignoreAccents: true,
    matchFrom: 'any',
    stringify: option => option.data.name,
    trim: true,
  }), []);
  return (
    <Select<StringOption, true, StringGroupOption>
      isMulti
      menuPortalTarget={document.body}
      placeholder={placeholder}
      options={options}
      filterOption={searchFilter}
      value={selection}
      onChange={onChange}
    />
  );
}

function MultiGroupSelect({ options, value, setValue, placeholder }: {
  options: StringGroupOption[];
  value: string[] | null;
  setValue: (value: string[]) => void;
  placeholder?: string;
}) {
  const selection = useMemo(() => {
    const set = new Set(value);
    return filter(flatMap(options, o => o.options), o => set.has(o.value));
  }, [options, value]);
  const onChange = useCallback((event: MultiValue<StringOption>) => {
    setValue(map(event, e => e.value));
  }, [setValue]);
  return (
    <Select<StringOption, true, StringGroupOption>
      isMulti
      menuPortalTarget={document.body}
      placeholder={placeholder}
      options={options}
      value={selection}
      onChange={onChange}
    />
  );
}

function cleanTraits(card: CardFragment): string[] {
  if (!card.traits) {
    return [];
  }
  return map(card.traits.split('/'), x => trim(x).replace('¬', ''));
}

type Operand = 'eq' | 'gt' | 'lt' | 'gte' | 'lte';
interface NumberCompare {
  operand: Operand;
  value: number;
}

function serializeNumberCompare(value: NumberCompare): string {
  return `${OPERAND[value.operand]}${value.value}`;
}

function parseOperand(operand: Operand, value: string): NumberCompare | null {
  const num = parseInt(value, 10);
  if (isNaN(num)) {
    return null;
  }
  return {
    operand,
    value: num,
  };
}

function parseNumberCompare(v: string): NumberCompare | null {
  const value = trim(v);
  if (!value) {
    return null;
  }
  switch (value.substring(0, 2)) {
    case '>=':
      return parseOperand('gte', value.substring(2));
    case '<=':
      return parseOperand('lte', value.substring(2));
    default: {
      switch (value.substring(0, 1)) {
        case '=':
          return parseOperand('eq', value.substring(1));
        case '>':
          return parseOperand('gt', value.substring(1));
        case '<':
          return parseOperand('lt', value.substring(1));
        default: {
          return parseOperand('eq', value);
        }
      }
    }
  }
}

function NumberCompareInput({
  value, setValue
}: { value: NumberCompare | null; setValue: (value: NumberCompare | null) => void }) {
  const [liveValue, setLiveValue] = useState<string | undefined>(value ? serializeNumberCompare(value) : '');
  useEffect(() => {
    setLiveValue(value ? serializeNumberCompare(value) : '');
  }, [value, setLiveValue]);
  const onBlur = useCallback(() => {
    const parsed = liveValue ? parseNumberCompare(liveValue) : null;
    setValue(parsed);
    setLiveValue(parsed ? serializeNumberCompare(parsed): '');
  }, [liveValue, setValue]);
  const ref = useRef<HTMLInputElement>(null);
  return (
    <Input
      ref={ref}
      value={liveValue}
      onChange={(e) => setLiveValue(e.target.value)}
      onBlur={onBlur}
      type="search"
      onKeyPress={e=> {
        if (e.key === 'Enter') {
          ref.current?.blur();
          e.preventDefault();
        }
      }}
    />
  );
}
const OPERAND = {
  eq: '',
  gt: '>',
  lt: '<',
  gte: '>=',
  lte: '<=',
};

function costFilter(cost: NumberCompare | null, card: CardFragment): boolean {
  if (!cost) {
    return true;
  }
  if (card.cost === null || card.cost === undefined) {
    return false;
  }
  if (card.cost === -2) {
    // X is anything, it could even be a boat!
    return true;
  }
  switch (cost.operand) {
    case 'eq': {
      if (card.cost !== cost.value) {
        return false;
      }
      break;
    }
    case 'gt': {
      if (card.cost <= cost.value) {
        return false;
      }
      break;
    }
    case 'gte': {
      if (card.cost < cost.value) {
        return false;
      }
      break;
    }
    case 'lt': {
      if (card.cost >= cost.value) {
        return false;
      }
      break;
    }
    case 'lte': {
      if (card.cost > cost.value) {
        return false;
      }
      break;
    }
  }
  return true;
}

function equipFilter(equip: NumberCompare | null, card: CardFragment): boolean {
  if (!equip) {
    return true;
  }
  switch (equip.operand) {
    case 'eq': {
      if (card.equip === null || card.equip === undefined || card.equip !== equip.value) {
        return false;
      }
      break;
    }
    case 'gt': {
      if (card.equip === null || card.equip === undefined || card.equip <= equip.value) {
        return false;
      }
      break;
    }
    case 'gte': {
      if (card.equip === null || card.equip === undefined || card.equip < equip.value) {
        return false;
      }
      break;
    }
    case 'lt': {
      if (card.equip !== null && card.equip !== undefined && card.equip >= equip.value) {
        return false;
      }
      break;
    }
    case 'lte': {
      if (card.equip !== null && card.equip !== undefined && card.equip > equip.value) {
        return false;
      }
      break;
    }
  }
  return true;
}


function aspectLevelFilter(level: NumberCompare | null, aspectLevel: number | null | undefined): boolean {
  if (!level) {
    return true;
  }
  if (aspectLevel === null || aspectLevel === undefined) {
    return false;
  }
  switch (level.operand) {
    case 'eq': {
      if (aspectLevel !== level.value) {
        return false;
      }
      break;
    }
    case 'gt': {
      if (aspectLevel <= level.value) {
        return false;
      }
      break;
    }
    case 'gte': {
      if (aspectLevel < level.value) {
        return false;
      }
      break;
    }
    case 'lt': {
      if (aspectLevel >= level.value) {
        return false;
      }
      break;
    }
    case 'lte': {
      if (aspectLevel > level.value) {
        return false;
      }
      break;
    }
  }
  return true;
}

function useSearchQueryState<T>(name: string, options: UseQueryStateOptions<T>): [T | null, (value: null | NonNullable<ReturnType<typeof options.parse>>) => Promise<boolean>] {
  const [value, setValue] = useQueryState<T>(name, options);
  const mySetValue = useCallback(async(value: null | NonNullable<T>) => {
    return await setValue(value, { scroll: false, shallow: true });
  }, [setValue]);
  return [
    value,
    mySetValue,
  ];
}

export function useCardSearchControls(allCards: CardFragment[]): [React.ReactNode, boolean, (card: CardFragment) => boolean] {
  const { approaches, aspects, categories } = useLocale();
  const allTraits = useMemo(() => {
    return map(
      sortBy(uniq(flatMap(allCards, c => cleanTraits(c))), x => x),
      o => ({ value: o, name: o, label: o })
    );
  }, [allCards]);
  const allCardSets = useMemo(() => {
    const background = categories.background;
    const specialty = categories.specialty;
    return [
      ...(background ? [{
        label: background.name,
        options: sortBy(flatMap(background.options, (name, id) => name ? ({ value: id, name, label: name }) : []), o => o.label) || [],
      }] : []),
      ...(specialty ? [{
        label: specialty.name,
        options: sortBy(flatMap(specialty.options, (name, id) => name ? ({ value: id, name, label: name }) : []), o => o.label) || [],
      }] : []),
      {
        label: t`Other`,
        options: [{
          value: 'personality',
          name: t`Personality`,
          label: t`Personality`,
        }]
      }
    ];
  }, [categories]);
  const allTypes = useMemo(() => {
    return sortBy(
      uniqBy(
        flatMap(allCards, c => c.type_id && c.type_name ? { value: c.type_id, name: c.type_name, label: c.type_name } : []),
        o => o.value
      ),
      o => o.label
    );
  }, [allCards]);
  const [traits, setTraits] = useSearchQueryState<string[]>('k', {
    history: 'replace',
    parse: parseArray,
    serialize: serializeArray,
  });
  const [types, setTypes] = useSearchQueryState<string[]>('t', {
    history: 'replace',
    parse: parseArray,
    serialize: serializeArray,
  });
  const [cardSets, setCardSets] = useSearchQueryState<string[]>('set', {
    history: 'replace',
    parse: parseArray,
    serialize: serializeArray,
  });
  const [cost, setCost] = useSearchQueryState<NumberCompare>('c', {
    history: 'replace',
    parse: parseNumberCompare,
    serialize: serializeNumberCompare,
  });
  const [equip, setEquip] = useSearchQueryState<NumberCompare>('e', {
    history: 'replace',
    parse: parseNumberCompare,
    serialize: serializeNumberCompare,
  });
  const [awa, setAwa] = useSearchQueryState<NumberCompare>('awa', {
    history: 'replace',
    parse: parseNumberCompare,
    serialize: serializeNumberCompare,
  });
  const [fit, setFit] = useSearchQueryState<NumberCompare>('fit', {
    history: 'replace',
    parse: parseNumberCompare,
    serialize: serializeNumberCompare,
  });
  const [foc, setFoc] = useSearchQueryState<NumberCompare>('foc', {
    history: 'replace',
    parse: parseNumberCompare,
    serialize: serializeNumberCompare,
  });
  const [spi, setSpi] = useSearchQueryState<NumberCompare>('spi', {
    history: 'replace',
    parse: parseNumberCompare,
    serialize: serializeNumberCompare,
  });

  const [approach, setApproach] = useSearchQueryState<string[]>('a', {
    history: 'replace',
    parse: parseArray,
    serialize: serializeArray,
  });

  const [hasFilters, filterCard] = useMemo(() => {
    const traitSet = traits?.length ? new Set(traits) : undefined;
    const typeSet = types?.length ? new Set(types) : undefined;
    const cardSetsSet = cardSets?.length ? new Set(cardSets) : undefined;
    const aspectSet = (awa || foc || fit || spi) ? new Set([
      ...(awa ? [AWA] : []),
      ...(fit ? [FIT] : []),
      ...(spi ? [SPI] : []),
      ...(foc ? [FOC] : []),
    ]) : undefined;
    return [(
      !!traitSet ||
      !!typeSet ||
      !!cardSetsSet ||
      !!aspectSet ||
      !!cost ||
      !!equip ||
      !!approach?.length
    ),
    (card: CardFragment) => {
      if (traitSet && !find(cleanTraits(card), t => traitSet.has(t))) {
        return false;
      }
      if (typeSet && (!card.type_id || !typeSet.has(card.type_id))) {
        return false;
      }
      if (cardSetsSet && (!card.set_id || !cardSetsSet.has(card.set_id))) {
        return false;
      }
      if (aspectSet) {
        if (!card.aspect_id || !aspectSet.has(card.aspect_id)) {
          return false;
        }
        switch (card.aspect_id) {
          case AWA:
            if (!aspectLevelFilter(awa, card.level)) {
              return false;
            }
            break;
          case SPI:
            if (!aspectLevelFilter(spi, card.level)) {
              return false;
            }
            break;
          case FOC:
            if (!aspectLevelFilter(foc, card.level)) {
              return false;
            }
            break;
          case FIT:
            if (!aspectLevelFilter(fit, card.level)) {
              return false;
            }
            break;
        }
      }
      if (approach?.length) {
        const cardApproaches = new Set([
          ...(!!card.approach_connection ? ['connection'] : []),
          ...(!!card.approach_conflict ? ['conflict'] : []),
          ...(!!card.approach_reason ? ['reason'] : []),
          ...(!!card.approach_exploration ? ['exploration'] : []),
        ]);
        console.log(approach);
        console.log(cardApproaches);
        if (!find(approach, app => cardApproaches.has(app))) {
          return false;
        }
      }
      return costFilter(cost, card) && equipFilter(equip, card);
    }];
  }, [traits, cardSets, types, cost, equip, awa, foc, fit, spi, approach]);
  const allApproaches = useMemo(() => {

    return map(approaches, (name, app) => ({
      value: app,
      name: name,
      label: (
        <Flex direction="row" alignItems="center">
          <CoreIcon icon={app} size="22" />
          <Text marginLeft={2}>{name}</Text>
        </Flex>
      ),
    }));
  }, [approaches]);
  return [(
    <Stack key="controls">
      <FormControl>
        <FormLabel>{t`Types`}</FormLabel>
        <MultiSelect
          value={types}
          placeholder={t`Select card type`}
          setValue={setTypes}
          options={allTypes}
        />
      </FormControl>
      <FormControl>
        <FormLabel>{t`Traits`}</FormLabel>
        <MultiSelect
          placeholder={t`Select trait`}
          value={traits}
          setValue={setTraits}
          options={allTraits}
        />
      </FormControl>
      <FormControl>
        <FormLabel>{t`Card set`}</FormLabel>
        <MultiGroupSelect
          placeholder={t`Select card set`}
          value={cardSets}
          setValue={setCardSets}
          options={allCardSets}
        />
      </FormControl>
      <FormControl>
        <FormLabel>{t`Cost`}</FormLabel>
        <NumberCompareInput
          value={cost}
          setValue={setCost}
        />
      </FormControl>
      <FormControl>
        <FormLabel>{t`Approach icons`}</FormLabel>
        <MultiSelect
          placeholder={t`Select approach icons`}
          value={approach}
          setValue={setApproach}
          options={allApproaches}
        />
      </FormControl>
      <FormControl>
        <FormLabel>{t`Equip`}</FormLabel>
        <NumberCompareInput
          value={equip}
          setValue={setEquip}
        />
      </FormControl>
      <Text fontWeight="600">{t`Aspect requirements`}</Text>
      <SimpleGrid columns={[2, 4]} spacingX={2} spacingY={4}>
        <FormControl>
          <FormLabel>{aspects.AWA?.short_name}</FormLabel>
          <NumberCompareInput
            value={awa}
            setValue={setAwa}
          />
        </FormControl>
        <FormControl>
          <FormLabel>{aspects.SPI?.short_name}</FormLabel>
          <NumberCompareInput
            value={spi}
            setValue={setSpi}
          />
        </FormControl>
        <FormControl>
          <FormLabel>{aspects.FOC?.short_name}</FormLabel>
          <NumberCompareInput
            value={foc}
            setValue={setFoc}
          />
        </FormControl>
        <FormControl>
          <FormLabel>{aspects.FIT?.short_name}</FormLabel>
          <NumberCompareInput
            value={fit}
            setValue={setFit}
          />
        </FormControl>
      </SimpleGrid>
    </Stack>
  ), hasFilters, filterCard];
}
