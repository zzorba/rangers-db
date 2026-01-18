import React, { useCallback, useMemo, useState } from 'react';
import { Select as ChakraSelect, OptionBase, SingleValue } from 'chakra-react-select';
import { t } from '@lingui/macro';
import { Flex, FormControl, FormLabel, Input, Box } from '@chakra-ui/react';
import { useLocale } from '../lib/TranslationProvider';
import { MISSIONS, MissionDefinition, getMissionsByCycle } from '../lib/missions';

interface MissionOption extends OptionBase {
  value: string;
  label: string;
  mission: MissionDefinition;
  searchString: string;
}

interface Props {
  value?: string;
  subtitle?: string;
  cycleId?: string;  // Filtra le missioni per ciclo
  onChange: (missionCode: string | undefined, subtitle: string | undefined) => void;
  placeholder?: string;
}

export default function MissionSelect({ value, subtitle, cycleId, onChange, placeholder }: Props) {
  const { locale } = useLocale();
  const [inputValue, setInputValue] = useState('');
  const [localSubtitle, setLocalSubtitle] = useState(subtitle || '');
  
  // Filtra le missioni per ciclo se specificato
  const availableMissions = useMemo(() => {
    if (cycleId) {
      return getMissionsByCycle(cycleId);
    }
    return MISSIONS;
  }, [cycleId]);
  
  // Tutte le opzioni con searchString per il filtro
  const allOptions: MissionOption[] = useMemo(() => {
    return availableMissions.map(mission => {
      const label = mission.name[locale] || mission.name['en'] || mission.code;
      return {
        value: mission.code,
        label,
        mission,
        searchString: label.toLowerCase(),
      };
    });
  }, [locale, availableMissions]);
  
  // Filtra le opzioni: mostra solo se l'utente ha digitato almeno 2 caratteri
  const filteredOptions = useMemo(() => {
    if (inputValue.length < 2) {
      return [];
    }
    const searchLower = inputValue.toLowerCase();
    return allOptions.filter(opt => 
      opt.searchString.includes(searchLower)
    );
  }, [allOptions, inputValue]);
  
  const selectedOption = useMemo(() => {
    if (!value) return null;
    return allOptions.find(opt => opt.value === value) || null;
  }, [value, allOptions]);
  
  const handleChange = useCallback((newValue: SingleValue<MissionOption>) => {
    onChange(newValue?.value, localSubtitle || undefined);
  }, [onChange, localSubtitle]);
  
  const handleInputChange = useCallback((newValue: string) => {
    setInputValue(newValue);
  }, []);
  
  const handleSubtitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newSubtitle = e.target.value;
    setLocalSubtitle(newSubtitle);
    if (value) {
      onChange(value, newSubtitle || undefined);
    }
  }, [value, onChange]);
  
  return (
    <Flex direction="column" gap={3}>
      <Box>
        <ChakraSelect<MissionOption>
          options={filteredOptions}
          value={selectedOption}
          onChange={handleChange}
          onInputChange={handleInputChange}
          inputValue={inputValue}
          placeholder={placeholder || t`Type at least 2 characters to search...`}
          noOptionsMessage={() => 
            inputValue.length < 2 
              ? t`Type at least 2 characters to search...`
              : t`No missions found`
          }
          isClearable
          useBasicStyles
          chakraStyles={{
            container: (provided) => ({
              ...provided,
              width: '100%',
            }),
            control: (provided) => ({
              ...provided,
              minHeight: '50px',
            }),
          }}
        />
      </Box>
      
      {/* Campo sottotitolo - appare solo quando una missione è selezionata */}
      {value && (
        <FormControl>
          <FormLabel fontSize="sm">{t`Subtitle (optional)`}</FormLabel>
          <Input
            value={localSubtitle}
            onChange={handleSubtitleChange}
            placeholder={t`e.g., Spire, Lone Tree Station...`}
            size="sm"
          />
        </FormControl>
      )}
    </Flex>
  );
}