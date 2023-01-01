import React, { useCallback, useMemo } from 'react';
import { Flex, Text } from '@chakra-ui/react';
import { createFilter, OptionBase, Select, SingleValue } from 'chakra-react-select';
import { find, flatMap, sortBy } from 'lodash';
import { t } from '@lingui/macro';

import { useLocale } from '../lib/TranslationProvider';
import { LocationIcon } from '../icons/LocationIcon';
import { MapLocation } from '../types/types';

export interface MapLocationOption extends OptionBase {
  value: string;
  label: React.ReactNode;

  name: string;
}
interface Props {
  value: string | undefined | null;
  filter?: (location: MapLocation) => boolean;
  decoration?: (location: MapLocation) => React.ReactNode | null;
  setValue: (value: string) => void;
}
export default function MapLocationSelect({ value, setValue, decoration, filter: filterLocation }: Props) {
  const { locations } = useLocale();
  const options: MapLocationOption[] = useMemo(() => {
    return sortBy(
      flatMap(locations, loc => {
        if (!loc) {
          return [];
        }

        if (filterLocation && !filterLocation(loc)) {
          return [];
        }
        return {
          value: loc.id,
          name: loc.name,
          label: (
            <Flex direction="row" alignItems="center">
              <LocationIcon location={loc} size={64} />
              <Flex direction="column" marginLeft={2} justifyContent="center" alignItems="flex-start">
                <Text>{loc.name}</Text>
                { !!decoration && decoration(loc) }
              </Flex>
            </Flex>
          ),
        };
      }),
      opt => opt.name
    );
  }, [locations, value, decoration, filterLocation]);
  const onChange = useCallback((option: SingleValue<MapLocationOption>) => {
    if (option && option.value !== value) {
      setValue(option.value);
    }
  }, [value, setValue]);
  const filter = useMemo(() => createFilter<MapLocationOption>({
    ignoreCase: true,
    ignoreAccents: true,
    matchFrom: 'any',
    stringify: option => option.data.name,
    trim: true,
  }), []);
  return (
    <>
      { !!value && !locations[value] && <Text>{value}</Text>}
      <Select<MapLocationOption>
        isRequired={false}
        value={find(options, o => o.value === value)}
        onChange={onChange}
        options={options}
        size="lg"
        filterOption={filter}
        useBasicStyles
        placeholder={t`Select location...`}
        chakraStyles={{
          control: (provided, state) => ({
            ...provided,
            minHeight: '84px',
          }),
        }}
      />
    </>
  );
}
