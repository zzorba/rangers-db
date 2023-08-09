import React, { useCallback, useMemo } from 'react';
import { Flex, Text } from '@chakra-ui/react';
import { createFilter, Select, SingleValue } from 'chakra-react-select';
import { find, flatMap, sortBy, map } from 'lodash';
import { t } from '@lingui/macro';

import { useLocale } from '../lib/TranslationProvider';
import { LocationIcon, PathIcon } from '../icons/LocationIcon';
import { MapLocationOption } from './MapLocationSelect';
import { PathOption } from './PathTypeSelect';
import { MapLocation } from '../types/types';

interface CardSetGroupOption {
  readonly label: string;
  readonly options: MapLocationOption[] | PathOption[];
}

interface Props {
  value: string | undefined | null;
  setValue: (value: string) => void;
}
export default function CardSetSelect({ value, setValue }: Props) {
  const { locations, paths } = useLocale();
  const options: CardSetGroupOption[] = useMemo(() => {
    const generalSet: MapLocation = {
      id: 'general',
      name: t`General`,
      type: 'trail',
      background: false,
      cycles: ['core', 'demo'],
      connections: [],
    };
    const valleySet: MapLocation = {
      id: 'the_valley',
      name: t`The Valley`,
      type: 'trail',
      background: false,
      cycles: ['core', 'demo'],
      connections: [],
    };
    return [
      {
        label: t`Terrain`,
        options: sortBy(
          flatMap(paths, p => {
              if (!p) {
                return [];
              }
              return {
                value: p.id,
                name: p.name,
                type: 'location',
                label: (
                  <Flex direction="row" alignItems="center">
                    <PathIcon path={p} size={48} />
                    <Text marginLeft={2}>{p.name}</Text>
                  </Flex>
                ),
              };
            }),
          opt => opt.name
        ),
      },
      {
        label: t`Locations`,
        options: sortBy(
          [
            ...flatMap(locations, loc => {
              if (!loc) {
                return [];
              }
              return {
                value: loc.id,
                name: loc.name,
                type: 'location',
                label: (
                  <Flex direction="row" alignItems="center">
                    <LocationIcon location={loc} size={64} />
                    <Text marginLeft={2}>{loc.name}</Text>
                  </Flex>
                ),
              };
            }),
            ...map([generalSet, valleySet], loc => {
              return {
                value: loc.id,
                name: loc.name,
                type: 'location',
                label: (
                  <Flex direction="row" alignItems="center">
                    <LocationIcon location={loc} size={64} />
                    <Text marginLeft={2}>{loc.name}</Text>
                  </Flex>
                ),
              };
            }),
          ],
          opt => opt.name
        ),
      },
    ];
  }, [paths, locations]);

  const onChange = useCallback((option: SingleValue<MapLocationOption | PathOption>) => {
    if (option && option.value !== value) {
      setValue(option.value);
    }
  }, [value, setValue]);
  const filter = useMemo(() => createFilter<MapLocationOption | PathOption>({
    ignoreCase: true,
    ignoreAccents: true,
    matchFrom: 'any',
    stringify: option => option.data.name,
    trim: true,
  }), []);
  return (
    <>
      <Select<MapLocationOption | PathOption, false, CardSetGroupOption>
        isRequired={false}
        defaultValue={find(flatMap(options, o => o.options), o => o.value === value)}
        onChange={onChange}
        options={options}
        size="lg"
        filterOption={filter}
        useBasicStyles
        placeholder={t`Select card set...`}
        chakraStyles={{
          control: (provided, state) => ({
            ...provided,
            minHeight: '78px',
            padding: 0,
          }),
        }}
      />
    </>
  );
}
