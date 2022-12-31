import React, { useCallback, useMemo } from 'react';
import { Flex, Text } from '@chakra-ui/react';
import { createFilter, OptionBase, Select, SingleValue } from 'chakra-react-select';
import { find, flatMap, sortBy } from 'lodash';
import { t } from '@lingui/macro';

import { useLocale } from '../lib/TranslationProvider';
import { LocationIcon } from '../icons/LocationIcon';

export interface MapLocationOption extends OptionBase {
  value: string;
  label: React.ReactNode;

  name: string;
}
interface Props {
  value: string | undefined | null;
  setValue: (value: string) => void;
}
export default function MapLocationSelect({ value, setValue }: Props) {
  const { locations } = useLocale();
  const options: MapLocationOption[] = useMemo(() => {
    return sortBy(
      flatMap(locations, loc => {
        if (!loc) {
          return [];
        }
        return {
          value: loc.id,
          name: loc.name,
          label: (
            <Flex direction="row" alignItems="center">
              <LocationIcon location={loc} size={64} />
              <Text marginLeft={2}>{loc.name}</Text>
            </Flex>
          ),
        };
      }),
      opt => opt.name
    );
  }, [locations]);
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
        defaultValue={find(options, o => o.value === value)}
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
