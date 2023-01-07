import { Box, FormControl, FormLabel } from '@chakra-ui/react';
import React, { useCallback, useMemo, useState } from 'react';
import { t } from '@lingui/macro';
import { MultiValue, Select, SingleValue } from 'chakra-react-select';
import { flatMap, map, values, groupBy } from 'lodash';

import PageHeading from '../../components/PageHeading';
import { CardFragment, SearchDeckFragment, SearchDeckFragmentDoc, SearchDecksQueryVariables, useGetRoleCardsQuery, useSearchDecksQuery } from '../../generated/graphql/apollo-schema';
import { AuthUser } from '../../lib/useFirebaseAuth';
import PaginationWrapper from '../../components/PaginationWrapper';
import { SearchDeckList } from '../../components/DeckList';
import { CardsMap, CategoryTranslation, useCardsMap, useLikeAction } from '../../lib/hooks';
import { useLocale } from '../../lib/TranslationProvider';
import { useApolloClient } from '@apollo/client';

function CategorySelect({ category, onChange }: { category: CategoryTranslation; onChange: (selection: string[]) => void }) {
  const options = useMemo(() => {
    return map(category.options, (label, value) => {
      return {
        value,
        label,
      };
    })
  }, [category.options]);
  return (
    <FormControl marginBottom={4}>
      <FormLabel>{category.name}</FormLabel>
      <Select
        isMulti
        onChange={(e) => onChange(map(e, x => x.value))}
        placeholder={t`Filter by ${category.name}`}
        options={options}
      />
    </FormControl>
  )
}

interface RoleOption {
  value: string;
  label: string;
  card: CardFragment;
}

function RoleSelect({ roleCards, onChange, roles, specialty }: {
  roleCards: CardsMap;
  roles: string[] | undefined;
  specialty: string[] | undefined;
  onChange: (selection: string[]) => void;
}) {
  const options = useMemo(() => {
    const roleSet = roles?.length ? new Set(roles) : undefined;
    const specialtySet = specialty?.length ? new Set(specialty) : undefined;
    return map(
      groupBy(
        flatMap(values(roleCards), (card) => {
          if (!card || !card.set_id || card.type_id !== 'role' || !card.id || !card.name) {
            return [];
          }
          if (specialtySet && !specialtySet.has(card.set_id) && (!roleSet || !roleSet.has(card.id))) {
            return [];
          }
          return {
            value: card?.id,
            label: card.name,
            card: card,
          };
        }),
        c => c.card.set_name
      ),
      (group, set_name) => {
        return {
          label: set_name,
          options: group,
        };
      });
  }, [roleCards, roles, specialty]);
  return (
    <FormControl marginBottom={4}>
      <FormLabel>{t`Role`}</FormLabel>
      <Select<RoleOption, true>
        isMulti
        onChange={(event: MultiValue<RoleOption>) => {
          onChange(map(event, x => x.value));
        }}
        placeholder={t`Filter by Role`}
        options={options}
      />
    </FormControl>
  )
}

export default function Search() {
  const { data, fetchMore } = useSearchDecksQuery({
    variables: {},
    skip: false,
  });

  const [userId, setUserId] = useState<string>();
  const [foc, setFoc] = useState<number>();
  const [fit, setFit] = useState<number>();
  const [awa, setAwa] = useState<number>();
  const [spi, setSpi] = useState<number>();
  const [background, setBackground] = useState<string[]>();
  const [specialty, setSpecialty] = useState<string[]>();
  const [roles, setRole] = useState<string[]>();
  const [total, setTotal] = useState<number>(10);
  const doSearchDecks = useCallback(async(authUser: AuthUser, pageSize: number, offset: number): Promise<SearchDeckFragment[]> => {
    const variables: SearchDecksQueryVariables = {
      limit: pageSize,
      offset,
    };
    if (userId) {
      variables.userId = userId;
    }
    if (awa) {
      variables.awa = awa;
    }
    if (fit) {
      variables.fit = fit;
    }
    if (foc) {
      variables.foc = foc;
    }
    if (spi) {
      variables.spi = spi;
    }
    if (background?.length) {
      variables.background = `{${background.join(',')}}`;
    }
    if (specialty?.length) {
      variables.specialty = `{${specialty.join(',')}}`;
    }
    if (roles?.length) {
      variables.role = `{${roles.join(',')}}`;
    }
    const r = await fetchMore({
      variables,
      updateQuery(_, { fetchMoreResult }) {
        return fetchMoreResult;
      },
    });
    const decks = r.data?.decks || [];
    if (decks?.length === pageSize) {
      setTotal(offset + pageSize + 1);
    } else {
      setTotal(offset + decks.length);
    }
    return decks;
  }, [fetchMore, setTotal, userId, awa, fit, foc, spi, background, specialty, roles]);

  const { locale } = useLocale();
  const { data: role } = useGetRoleCardsQuery({
    variables: {
      locale,
    },
  });
  const roleCards = useCardsMap(role?.cards);
  const { categories } = useLocale();
  const backgroundT = categories.background;
  const specialtyT = categories.specialty;
  const client = useApolloClient();
  const updateLikeCache = useCallback((deck: SearchDeckFragment, liked: boolean) => {
    const id = client.cache.identify(deck);
    client.cache.updateFragment({
      id,
      fragmentName: 'SearchDeck',
      fragment: SearchDeckFragmentDoc,
    }, (data) => ({
      ...data,
      liked_by_user: liked,
      like_count: (data.like_count || 0) + (liked ? 1 : -1),
    }));
  }, [client]);
  const onLike = useLikeAction<SearchDeckFragment>(updateLikeCache);
  return (
    <Box
      maxW="64rem"
      marginX="auto"
      py={{ base: "3rem", lg: "4rem" }}
      px={{ base: "1rem", lg: "0" }}
    >
      <PageHeading title={t`Deck search`} />
      <form onSubmit={e => {
          e.preventDefault();
        }}>
        { !!backgroundT && <CategorySelect category={backgroundT} onChange={setBackground} /> }
        { !!specialtyT && <CategorySelect category={specialtyT} onChange={setSpecialty} /> }
        <RoleSelect roleCards={roleCards} roles={roles} onChange={setRole} specialty={specialty} />
      </form>
      <PaginationWrapper
        total={total}
        fetchData={doSearchDecks}
        data={data?.decks}
      >
        { (decks: SearchDeckFragment[], refetch) => (
          <SearchDeckList
            decks={decks}
            roleCards={roleCards}
            onLike={onLike}
          />
        ) }
      </PaginationWrapper>
    </Box>
  );
}

