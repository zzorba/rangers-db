import React, { useCallback } from 'react';
import { Select } from '@chakra-ui/react';
import { ChakraStylesConfig, Select as ChakraReactSelect } from 'chakra-react-select';
import { useRouter } from 'next/router';
import { find, map } from 'lodash';

import { useLocale } from '../lib/TranslationProvider';

interface LanguageOption {
  value: string;
  label: string;
  fullLabel: string;
}

const languageOptions: LanguageOption[] = [
  {
    value: 'en',
    label: '🇺🇸',
    fullLabel: '🇺🇸 English',
  },
  {
    value: 'de',
    label: '🇩🇪',
    fullLabel: '🇩🇪 Deutsche',
  },
  /*
  {
    value: 'it',
    label: '🇮🇹',
    fullLabel: '🇮🇹 Italiano'
  },
  {
    value: 'fr',
    label: '🇫🇷',
    fullLabel: '🇫🇷 Français'
  },
  */
];
export function DesktopLanguageChooser() {
  const { locale } = useLocale();
  const router = useRouter();
  const onChange = useCallback((option: any) => {
    if (option && option.value !== locale) {
      const { pathname, asPath, query } = router;
      router.push({ pathname, query }, asPath, { locale: option.value });
    }
  }, [router, locale]);
  const chakraStyles: ChakraStylesConfig = {
    dropdownIndicator: (provided, state) => ({
      ...provided,
      color: 'transparent',
      display: 'none',
    }),
    valueContainer: (provided, state) => ({
      ...provided,
      minW: '55px',
    }),
  };

  return (
    <ChakraReactSelect
      isSearchable={false}
      value={find(languageOptions, o => o.value === locale)}
      onChange={onChange}
      chakraStyles={chakraStyles}
      name="language"
      useBasicStyles
      options={languageOptions}
    />
  );
}


export function MobileLanguageChooser() {
  const { locale } = useLocale();
  const router = useRouter();
  const onChange = useCallback((newLocale: string) => {
    if (newLocale !== locale) {
      const { pathname, asPath, query } = router;
      router.push({ pathname, query }, asPath, { locale: newLocale });
    }
  }, [router, locale]);
  return (
    <Select
      value={locale}
      onChange={(event) => onChange(event.target.value)}
      name="language"
    >
      { map(languageOptions, option => (
        <option key={option.value} value={option.value}>{option.fullLabel}</option>
      ))}
    </Select>
  );
}
