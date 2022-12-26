import {
  Box,
  Flex,
  Text,
  IconButton,
  Button,
  Stack,
  Collapse,
  Icon,
  Link,
  Popover,
  PopoverTrigger,
  PopoverContent,
  useColorModeValue,
  useBreakpointValue,
  useDisclosure,
  Spinner,
  useColorMode,
  ButtonGroup,
} from '@chakra-ui/react';
import { FaSun, FaMoon } from 'react-icons/fa';
import { map } from 'lodash';
import { t } from '@lingui/macro';
import {
  HamburgerIcon,
  CloseIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from '@chakra-ui/icons';
import Router, { useRouter } from 'next/router';
import NextLink from 'next/link';
import { useAuth } from '../lib/AuthContext';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useGetCardsQuery, useGetCardsUpdatedAtQuery } from '../generated/graphql/apollo-schema';
import Banner from './Banner';
import { LOCALES } from '../lib/Lingui';
import { AuthUser } from '../lib/useFirebaseAuth';
import { useLocale } from '../lib/TranslationProvider';
import { DesktopLanguageChooser, MobileLanguageChooser } from './LanguageChooser';
import { useTheme } from '../lib/ThemeContext';

const SHOW_CAMPAIGNS = true;
function useNavItems(authUser: AuthUser | undefined): Array<NavItem> {
  return useMemo(() => [
    ...(authUser ? [{ label: t`Profile`, href: '/profile' }] : []),
    {
      label: t`My Decks`,
      href: '/decks',
    },
    ...(SHOW_CAMPAIGNS ? [{
      label: t`My Campaigns`,
      href: '/campaigns',
    }] : []),
    {
      label: t`Cards`,
      href: '/cards',
    },
    {
      label: t`Decks`,
      href: '/decks/search',
    },
  ], [authUser]);
}
function useCardNeedUpdate(): [boolean, () => void] {
  const { locale } = useLocale();
  const { data: cardData, refetch } = useGetCardsQuery({
    variables: {
      locale,
    },
    fetchPolicy: 'cache-only',
  });
  const { data: updatedData} = useGetCardsUpdatedAtQuery({
    variables: {
      locale,
    },
    fetchPolicy: 'network-only',
  });
  const forceRefresh = useCallback(() => {
    refetch({
      locale,
    });
  }, [refetch, locale]);
  return [
    !!(cardData?.updated_at.length && updatedData?.updated_at.length && cardData.updated_at[0].updated_at !== updatedData.updated_at[0].updated_at),
    forceRefresh,
  ];
}

export function LanguageSwitcher() {
  const router = useRouter();
  const [locale, setLocale] = useState<LOCALES>(
    router.locale!.split('-')[0] as LOCALES
  );

  const languages: { [key: string]: string } = {
    en: t`English`,
    de: t`German`,
    it: t`Italian`,
  }

  // enable 'pseudo' locale only for development environment
  if (process.env.NEXT_PUBLIC_NODE_ENV !== 'production') {
    languages['pseudo'] = t`Pseudo`
  }

  useEffect(() => {
    router.push(router.pathname, router.pathname, { locale })
    // eslint-disable-next-line
  }, [locale])

  return (
    <select
      value={locale}
      onChange={(evt) => setLocale(evt.target.value as LOCALES)}
    >
      {Object.keys(languages).map((locale) => {
        return (
          <option value={locale} key={locale}>
            {languages[locale as unknown as LOCALES]}
          </option>
        )
      })}
    </select>
  );
}

export default function WithSubnavigation() {
  const { isOpen, onToggle } = useDisclosure();
  const { authUser, loading, signOut } = useAuth();
  const [cardNeedUpdate, forceCardUpdate] = useCardNeedUpdate();
  const onSignOut = useCallback(() => {
    Router.push('/');
    signOut();
  }, [signOut]);
  const navItems = useNavItems(authUser);
  const { colorMode, toggleColorMode } = useColorMode();
  return (
    <Box>
      <Flex
        bg={useColorModeValue('white', 'gray.800')}
        color={useColorModeValue('gray.600', 'white')}
        minH={'60px'}
        py={{ base: 2 }}
        px={{ base: 4 }}
        borderBottom={1}
        borderStyle={'solid'}
        borderColor={useColorModeValue('gray.200', 'gray.600')}
        align={'center'}>
        <Flex
          flex={{ base: 1, md: 'auto' }}
          ml={{ base: -2 }}
          display={{ base: 'flex', md: 'none' }}>
          <IconButton
            onClick={onToggle}
            icon={
              isOpen ? <CloseIcon w={3} h={3} /> : <HamburgerIcon w={5} h={5} />
            }
            variant="ghost"
            aria-label={t`Toggle Navigation`}
          />
        </Flex>
        <Flex flex={{ base: 1 }} justify={{ base: 'center', md: 'start' }}>
          <Link
            textAlign={useBreakpointValue({ base: 'center', md: 'left' })}
            fontFamily="heading"
            color={useColorModeValue('gray.800', 'white')}
            as={NextLink}
            href="/"
          >
            {t`RangersDB`}
          </Link>
          <Flex display={{ base: 'none', md: 'flex' }} ml={10}>
            <DesktopNav navItems={navItems}/>
          </Flex>
        </Flex>

        { loading ? (
          <Spinner size="sm" />
        ) : (
          <Stack
            flex={{ base: 1, md: 0 }}
            justify="flex-end"
            direction="row"
            spacing={6}
          >
            <ButtonGroup>
            { authUser ? (
              <Button
                fontSize={'sm'}
                fontWeight={400}
                variant={'link'}
                onClick={onSignOut}
              >
                {t`Sign Out`}
              </Button>
            ) : (
              <>
                <Button
                  fontSize={'sm'}
                  fontWeight={400}
                  variant={'link'}
                  as={NextLink}
                  href="/login"
                >
                  {t`Sign In`}
                </Button>
                <Button
                  display={{ base: 'none', md: 'inline-flex' }}
                  fontSize={'sm'}
                  fontWeight={600}
                  color={'white'}
                  bg={'blue.400'}
                  as={NextLink}
                  href="/register"
                  _hover={{
                    bg: 'blue.600',
                  }}>
                 {t`Sign Up`}
                </Button>
              </>
            )}
            </ButtonGroup>
            <Flex display={{ base: 'none', md: 'flex' }} ml={10}>
              <DesktopLanguageChooser />
              <IconButton
                marginLeft={1}
                aria-label={colorMode === 'light' ? t`Dark mode` : t`Light mode`}
                onClick={toggleColorMode}
                icon={colorMode === 'light' ? <FaMoon /> : <FaSun />}
                variant="ghost"
              />
            </Flex>
          </Stack>
        ) }
      </Flex>
      <Collapse in={isOpen} animateOpacity>
        <MobileNav navItems={navItems} />
      </Collapse>
      { !!cardNeedUpdate && (
        <Banner
          title={t`New cards are available`}
          action={t`Update now`}
          onClick={forceCardUpdate}
        />
      )}
    </Box>
  );
}

const DesktopNav = ({ navItems }: { navItems: NavItem[] } ) => {
  const linkColor = useColorModeValue('gray.600', 'gray.200');
  const linkHoverColor = useColorModeValue('gray.800', 'white');
  const popoverContentBgColor = useColorModeValue('white', 'gray.800');
  return (
    <Stack direction={'row'} spacing={4}>
      { map(navItems, (navItem) => (
        <Box key={navItem.label}>
          <Popover trigger={'hover'} placement={'bottom-start'}>
            <PopoverTrigger>
              <Link
                p={2}
                as={NextLink}
                href={navItem.href ?? '#'}
                fontSize={'sm'}
                fontWeight={500}
                color={linkColor}
                _hover={{
                  textDecoration: 'none',
                  color: linkHoverColor,
                }}>
                {navItem.label}
              </Link>
            </PopoverTrigger>

            {navItem.children && (
              <PopoverContent
                border={0}
                boxShadow={'xl'}
                bg={popoverContentBgColor}
                p={4}
                rounded={'xl'}
                minW={'sm'}>
                <Stack>
                  {navItem.children.map((child) => (
                    <DesktopSubNav key={child.label} {...child} />
                  ))}
                </Stack>
              </PopoverContent>
            )}
          </Popover>
        </Box>
      ))}
    </Stack>
  );
};

const DesktopSubNav = ({ label, href, subLabel }: NavItem) => {
  return (
    <Link
      href={href}
      role={'group'}
      display={'block'}
      as={NextLink}
      p={2}
      rounded={'md'}
      _hover={{ bg: useColorModeValue('pink.50', 'gray.900') }}>
      <Stack direction={'row'} align={'center'}>
        <Box>
          <Text
            transition={'all .3s ease'}
            _groupHover={{ color: 'pink.400' }}
            fontWeight={500}>
            {label}
          </Text>
          <Text fontSize={'sm'}>{subLabel}</Text>
        </Box>
        <Flex
          transition={'all .3s ease'}
          transform={'translateX(-10px)'}
          opacity={0}
          _groupHover={{ opacity: '100%', transform: 'translateX(0)' }}
          justify={'flex-end'}
          align={'center'}
          flex={1}>
          <Icon color={'pink.400'} w={5} h={5} as={ChevronRightIcon} />
        </Flex>
      </Stack>
    </Link>
  );
};

const MobileNav = ({ navItems }: { navItems: NavItem[] }) => {
  const { colorMode, toggleColorMode } = useColorMode();
  return (
    <Stack
      bg={useColorModeValue('white', 'gray.800')}
      p={4}
      display={{ md: 'none' }}
    >
      {map(navItems, (navItem) => (
        <MobileNavItem key={navItem.label} {...navItem} />
      ))}
      <MobileLanguageChooser />
      <Button
        marginLeft={1}
        aria-label={colorMode === 'light' ? t`Dark mode` : t`Light mode`}
        onClick={toggleColorMode}
        leftIcon={colorMode === 'light' ? <FaMoon /> : <FaSun />}
        variant="ghost"
      >
        { colorMode === 'light' ? t`Dark mode` : t`Light mode`}
      </Button>
    </Stack>
  );
};

const MobileNavItem = ({ label, children, href }: NavItem) => {
  const { colors } = useTheme();
  const { isOpen, onToggle } = useDisclosure();
  return (
    <Stack spacing={4} onClick={children && onToggle}>
      <Flex
        py={2}
        as={Link}
        href={href ?? '#'}
        justify={'space-between'}
        align={'center'}
        _hover={{
          textDecoration: 'none',
        }}
      >
        <Text
          fontWeight={600}
          color={useColorModeValue('gray.600', 'gray.200')}>
          {label}
        </Text>
        {children && (
          <Icon
            as={ChevronDownIcon}
            transition={'all .25s ease-in-out'}
            transform={isOpen ? 'rotate(180deg)' : ''}
            w={6}
            h={6}
          />
        )}
      </Flex>
      <Collapse in={isOpen} animateOpacity style={{ marginTop: '0!important' }}>
        <Stack
          mt={2}
          pl={4}
          borderLeft={1}
          borderStyle={'solid'}
          borderColor={colors.divider}
          align={'start'}
        >
          { children && children.map((child) => (
            <Link key={child.label} py={2} href={child.href} as={NextLink}>
              {child.label}
            </Link>
          ))}
        </Stack>
      </Collapse>
    </Stack>
  );
};

interface NavItem {
  label: string;
  subLabel?: string;
  children?: Array<NavItem>;
  href?: string;
}
