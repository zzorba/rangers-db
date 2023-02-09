import React, { useCallback } from 'react';
import { Text, Flex } from '@chakra-ui/react';
import { ChakraStylesConfig, OptionBase, Select as ChakraReactSelect, SingleValue } from 'chakra-react-select';
import { useRouter } from 'next/router';
import { t } from '@lingui/macro';
import { US, DE, IT } from 'country-flag-icons/react/3x2'
import { MdLanguage } from 'react-icons/md';

import { useLocale } from '../lib/TranslationProvider';
import { useTheme } from '../lib/ThemeContext';

interface LanguageOption extends OptionBase {
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
  {
    value: 'it',
    label: <IT />,
  },
  /*
  {
    value: 'fr',
    label: <FR />,
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
  {
    value: 'it',
    label: <Flex direction="row"><IT width="20px" /><Text marginLeft={2}>Italiano</Text></Flex>,
  },
  /*
  {
    value: 'fr',
    label: <Flex direction="row"><FR width="20px" /><Text marginLeft={2}>Français</Text></Flex>,
  },
  */
];
export function DesktopLanguageChooser() {
  const { locale } = useLocale();
  const { colors } = useTheme();
  const router = useRouter();
  const onChange = useCallback((option: SingleValue<LanguageOption>) => {
    if (option && option.value !== locale) {
      const { pathname, asPath, query } = router;
      router.push({ pathname, query }, asPath, { locale: option.value });
    }
  }, [router, locale]);
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
        backgroundColor: colors.hover,
      },
    }),
    placeholder: (provided, state) => ({
      ...provided,
      padding: 0,
      margin: 0,
    }),
  };
  return (
    <ChakraReactSelect<LanguageOption>
      isSearchable={false}
      onChange={onChange}
      chakraStyles={chakraStyles}
      name="language"
      placeholder={<MdLanguage size={20} color={colors.icon} />}
      useBasicStyles
      options={languageOptions}
    />
  );
}


export function MobileLanguageChooser() {
  const { locale } = useLocale();
  const { colors } = useTheme();
  const router = useRouter();
  const onChange = useCallback((option: SingleValue<LanguageOption>) => {
    if (option && option.value !== locale) {
      const { pathname, asPath, query } = router;
      router.push({ pathname, query }, asPath, { locale: option.value });
    }
  }, [router, locale]);
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
          <MdLanguage size={22} color={colors.icon} />
          <Text marginLeft={3}>{t`Language`}</Text>
        </Flex>
      }
    />
  );
}
