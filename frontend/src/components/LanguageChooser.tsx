import React, { useCallback } from 'react';
import { Text, Flex, Select, useColorModeValue, IconButton } from '@chakra-ui/react';
import { ChakraStylesConfig, ControlProps, chakraComponents, Select as ChakraReactSelect } from 'chakra-react-select';
import { useRouter } from 'next/router';
import { t } from '@lingui/macro';
import { map } from 'lodash';
import { US, DE } from 'country-flag-icons/react/3x2'
import { MdLanguage } from 'react-icons/md';

import { useLocale } from '../lib/TranslationProvider';

interface LanguageOption {
  value: string;
  label: React.ReactNode;
}

const languageOptions: LanguageOption[] = [
  {
    value: 'en',
    label: <US />,
  },
  {
    value: 'de',
    label: <DE />,
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

const mobileLanguageOptions: LanguageOption[] = [
  {
    value: 'en',
    label: <Flex direction="row"><US width="20px" /><Text marginLeft={2}>English</Text></Flex>,
  },
  {
    value: 'de',
    label: <Flex direction="row"><DE width="20px" /><Text marginLeft={2}>Deutsch</Text></Flex>,
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
  const iconColor = useColorModeValue('#666666', '#DDDDDD');
  const backgroundHoverColor = useColorModeValue('gray.200', 'gray.700')
  const chakraStyles: ChakraStylesConfig<LanguageOption> = {
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
      _hover: {
        backgroundColor: backgroundHoverColor,
      },
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
      placeholder={<MdLanguage size={20} color={iconColor} />}
      useBasicStyles
      options={languageOptions}
    />
  );
}


export function MobileLanguageChooser() {
  const { locale } = useLocale();
  const router = useRouter();
  const onChange = useCallback((data: any) => {
    if (data.value !== locale) {
      const { pathname, asPath, query } = router;
      router.push({ pathname, query }, asPath, { locale: data.value });
    }
  }, [router, locale]);
  const iconColor = useColorModeValue('#444444', '#DDDDDD');

  return (
    <ChakraReactSelect<LanguageOption>
      isSearchable={false}
      onChange={onChange}
      useBasicStyles
      options={mobileLanguageOptions}
      name="language"
      menuPortalTarget={document.body}
      styles={{
        menuPortal: (provided) => ({ ...provided, zIndex: 100 })
      }}
      placeholder={
        <Flex direction="row">
          <MdLanguage size={22} color={iconColor} />
          <Text marginLeft={3}>{t`Language`}</Text>
        </Flex>
      }
    />
  );
}
