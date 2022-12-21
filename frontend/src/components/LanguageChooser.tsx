import React, { useCallback } from 'react';
import { Select, useColorModeValue } from '@chakra-ui/react';
import { ChakraStylesConfig, Select as ChakraReactSelect } from 'chakra-react-select';
import { useRouter } from 'next/router';
import { map } from 'lodash';
import { US, DE } from 'country-flag-icons/react/3x2'
import { MdLanguage } from 'react-icons/md';

import { useLocale } from '../lib/TranslationProvider';

interface LanguageOption {
  value: string;
  label: React.ReactNode;
  fullLabel: string;
}

const languageOptions: LanguageOption[] = [
  {
    value: 'en',
    label: <US />,
    fullLabel: '🇺🇸 English',
  },
  {
    value: 'de',
    label: <DE />,
    fullLabel: '🇩🇪 Deutsch',
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
    control: (provided, state) => ({
      ...provided,
      padding: 0,
      borderWidth: 0,
    }),
    placeholder: (provided, state) => ({
      ...provided,
      padding: 0,
      margin: 0,
    }),
  };

  return (
    <ChakraReactSelect
      isSearchable={false}
      onChange={onChange}
      chakraStyles={chakraStyles}
      name="language"
      placeholder={<MdLanguage size={24} color={useColorModeValue('black', 'white')} />}
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
