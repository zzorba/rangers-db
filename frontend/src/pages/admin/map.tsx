import React, { useMemo, useState } from 'react';
import { Flex, Box, List, ListItem, Select, FormControl, FormLabel, Text } from '@chakra-ui/react';
import { filter, find, map } from 'lodash';
import { t } from '@lingui/macro'

import { useLocale } from '../../lib/TranslationProvider';
import { MapLocation } from '../../types/types';
import { ConnectionRestrictionIcon, LocationIcon, PathIcon } from '../../icons/LocationIcon';
import { useMapLocations } from '../../lib/hooks';

function LocationRow({ location, cycle, expansions }: { location: MapLocation; cycle: string; expansions: string[] }) {
  const { paths, restrictions } = useLocale();
  const locations = useMapLocations(cycle, expansions);

  return (
    <ListItem key={location?.id}>
      <Flex direction="column">
        <Flex direction="row" alignItems="center">
          <LocationIcon location={location} size={48} />
          <Text marginLeft={2} style={{ fontVariantCaps: 'small-caps' }}>{location.name}</Text>
        </Flex>
        <Flex direction="column" marginLeft={2} paddingLeft={2} borderLeftWidth="1px">
          { map(location.connections, connection => {
            const loc = locations[connection.id];
            if (!loc) {
              return <Text key="connection.id">{connection.id}</Text>;
            }
            if (loc?.cycles && !find(loc.cycles, c => c === cycle)) {
              return null;
            }
            const path = paths[connection.path];
            const restriction = connection.restriction && restrictions[connection.restriction];
            return (
              <Flex key={connection.id} direction="row" alignItems="center" padding={2}>
                <LocationIcon location={loc} size={32} />
                <Text marginLeft={2} marginRight={2} style={{ fontVariantCaps: 'small-caps' }}>{loc.name}</Text>
                { !!restriction && <ConnectionRestrictionIcon restriction={restriction} size={32} />}
                { !!path && <PathIcon path={path} size={32} /> }
              </Flex>
            );
          }) }
        </Flex>
      </Flex>
    </ListItem>
  );
}

export default function MapPage() {
  const [cycle, setCycle] = useState('core');
  const [expansions, setExpansions] = useState<string[]>([]);
  const locations = useMapLocations(cycle, expansions);
  const selectedLocations = useMemo(() => {
    return filter(locations, loc => {
      if (loc?.cycles && !find(loc.cycles, c => c === cycle)) {
        return false;
      }
      return true;
    })
  }, [cycle, locations]);
  return (
    <Box
        maxW="64rem"
        marginX="auto"
        py={{ base: "3rem", lg: "4rem" }}
        px={{ base: "1rem", lg: "0" }}
    >
      <FormControl marginBottom={4} isRequired>
        <FormLabel>{t`Campaign`}</FormLabel>
        <Select
          onChange={(event) => setCycle(event.target.value)}
          placeholder={t`Select campaign`}
          value={cycle}
        >
          <option value="demo">{t`Demo`}</option>
          <option value="core">{t`Core`}</option>
          <option value="loa">{t`Legacy of the Ancestors`}</option>
        </Select>
      </FormControl>
      <List>
        { map(selectedLocations, loc => !!loc && (
          <LocationRow key={loc.id} location={loc} cycle={cycle} expansions={expansions} />
        ))}
      </List>
    </Box>
  );
}
