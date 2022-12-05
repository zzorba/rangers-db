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
} from '@chakra-ui/react';
import { map } from 'lodash';
import {
  HamburgerIcon,
  CloseIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from '@chakra-ui/icons';
import Router from 'next/router';
import NextLink from 'next/link';
import { useAuth } from '../lib/AuthContext';
import React, { useCallback, useMemo } from 'react';
import { useGetCardsQuery, useGetCardsUpdatedAtQuery } from '../generated/graphql/apollo-schema';
import Banner from './Banner';

function useCardNeedUpdate(): [boolean, () => void] {
  const { data: cardData, refetch } = useGetCardsQuery({
    variables: {
      locale: 'en',
    },
    fetchPolicy: 'cache-only',
  });
  const { data: updatedData} = useGetCardsUpdatedAtQuery({
    variables: {
      locale: 'en',
    },
    fetchPolicy: 'network-only',
  });
  const forceRefresh = useCallback(() => {
    refetch({
      locale: 'en',
    });
  }, [refetch]);
  return [
    !!(cardData?.updated_at.length && updatedData?.updated_at.length && cardData.updated_at[0].updated_at !== updatedData.updated_at[0].updated_at),
    forceRefresh,
  ];
}

export default function WithSubnavigation() {
  const { isOpen, onToggle } = useDisclosure();
  const { authUser, signOut } = useAuth();
  const [cardNeedUpdate, forceCardUpdate] = useCardNeedUpdate();
  const onSignOut = useCallback(() => {
    Router.push('/');
    signOut();
  }, [signOut]);
  const navItems = useMemo(() => [
    ...(authUser ? [{ label: 'Profile', href: '/profile' }] : []),
    ...NAV_ITEMS,
  ], [authUser]);
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
        borderColor={useColorModeValue('gray.200', 'gray.900')}
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
            aria-label="Toggle Navigation"
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
            RangersDB
          </Link>

          <Flex display={{ base: 'none', md: 'flex' }} ml={10}>
            <DesktopNav navItems={navItems}/>
          </Flex>
        </Flex>

        <Stack
          flex={{ base: 1, md: 0 }}
          justify="flex-end"
          direction="row"
          spacing={6}
        >
          { authUser ? (
            <Button
              fontSize={'sm'}
              fontWeight={400}
              variant={'link'}
              onClick={onSignOut}
            >
              Sign Out
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
                Sign In
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
                Sign Up
              </Button>
            </>
          )}
        </Stack>
      </Flex>

      <Collapse in={isOpen} animateOpacity>
        <MobileNav navItems={navItems} />
      </Collapse>
      { !!cardNeedUpdate && (
        <Banner
          title="New cards are available"
          action="Update now"
          onClick={forceCardUpdate}
        />
      )}
    </Box>
  );
}

const DesktopNav = ({ navItems }: { navItems: NavItem[] } ) => {
  const { authUser } = useAuth();
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
  return (
    <Stack
      bg={useColorModeValue('white', 'gray.800')}
      p={4}
      display={{ md: 'none' }}>
      {map(navItems, (navItem) => (
        <MobileNavItem key={navItem.label} {...navItem} />
      ))}
    </Stack>
  );
};

const MobileNavItem = ({ label, children, href }: NavItem) => {
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
        }}>
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
          borderColor={useColorModeValue('gray.200', 'gray.700')}
          align={'start'}>
          {children &&
            children.map((child) => (
              <Link key={child.label} py={2} href={child.href}>
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

const NAV_ITEMS: Array<NavItem> = [
  {
    label: 'Cards',
    href: '/cards',
  },
  {
    label: 'Decks',
    href: '/decks',
  },
];