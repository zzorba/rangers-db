import React, { useCallback, useMemo } from 'react';
import { Box, Flex, Text } from '@chakra-ui/react';
import { Select, OptionBase, SingleValue } from 'chakra-react-select';
import { find, flatMap } from 'lodash';
import { t } from '@lingui/macro';

import { useLocale } from '../lib/TranslationProvider';
import { PathIcon } from '../icons/LocationIcon';

export interface PathOption extends OptionBase {
  value: string;
  name: string;
  label: React.ReactNode;
}
interface Props {
  value: string | undefined | null;
  setValue: (value: string) => void;
}
export default function PathTypeSelect({ value, setValue }: Props) {
  const { paths } = useLocale();
  const options: PathOption[] = useMemo(() => {
    return flatMap(paths, p => {
      if (!p) {
        return [];
      }
      return {
        value: p.icon,
        name: p.name,
        label: (
          <Flex direction="row" alignItems="center">
            <Box marginLeft={1} marginRight={3}>
              <PathIcon path={p} size={48} />
            </Box>
            <Text marginLeft={2}>{p.name}</Text>
          </Flex>
        ),
      }
    });
  }, [paths]);
  const onChange = useCallback((option: SingleValue<PathOption>) => {
    if (option && option.value !== value) {
      setValue(option.value);
    }
  }, [value, setValue]);
  return (
    <>
      { !!value && !paths[value] && <Text>{value}</Text>}
      <Select<PathOption>
        isSearchable={false}
        useBasicStyles
        isRequired={false}
        defaultValue={find(options, o => o.value === value)}
        onChange={onChange}
        options={options}
        size="lg"
        placeholder={t`Select path terrain...`}
        chakraStyles={{
          control: (provided, state) => ({
            ...provided,
            minHeight: '64px',
          }),
        }}
      />
    </>
  );
}
