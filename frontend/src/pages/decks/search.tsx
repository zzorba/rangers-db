import { Box, FormControl, FormLabel } from '@chakra-ui/react';
import React, { useMemo, useState } from 'react';
import { t } from '@lingui/macro';
import { MultiValue, Select } from 'chakra-react-select';
import { flatMap, map, values, groupBy } from 'lodash';

import PageHeading from '../../components/PageHeading';
import { CardFragment } from '../../generated/graphql/apollo-schema';
import { CardsMap, CategoryTranslation, useRoleCards } from '../../lib/hooks';
import { useLocale } from '../../lib/TranslationProvider';
import SearchDecks from '../../components/SearchDecks';

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
  const [userId, setUserId] = useState<string>();
  const [foc, setFoc] = useState<number>();
  const [fit, setFit] = useState<number>();
  const [awa, setAwa] = useState<number>();
  const [spi, setSpi] = useState<number>();
  const [background, setBackground] = useState<string[]>();
  const [specialty, setSpecialty] = useState<string[]>();
  const [roles, setRole] = useState<string[]>();
  const roleCards = useRoleCards();
  const { categories } = useLocale();
  const backgroundT = categories.background;
  const specialtyT = categories.specialty;
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
      <SearchDecks
        roleCards={roleCards}
        background={background}
        specialty={specialty}
        roles={roles}
        awa={awa}
        spi={spi}
        foc={foc}
        fit={fit}
        userId={userId}
        pageSize={5}
        emptyMessage={t`No matching decks.`}
      />
    </Box>
  );
}

