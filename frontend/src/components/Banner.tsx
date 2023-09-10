import React from 'react';
import {
  Box,
  Button,
  Container,
  Icon,
  Square,
  Stack,
  Text,
  useBreakpointValue,
  useColorModeValue,
} from '@chakra-ui/react';
import { FiInfo } from 'react-icons/fi';

export default function Banner({ title, detail, action, onClick }: { title: string; detail?: string; action: string; onClick: () => void }) {
  const isMobile = useBreakpointValue({ base: true, md: false })
  return (
    <Box bg="bg-surface" boxShadow={useColorModeValue('sm', 'sm-dark')} bgColor="blue.100">
      <Container py={{ base: '4', md: '2.5' }} position="relative">
        <Stack
          direction={{ base: 'column', sm: 'row' }}
          justify="space-between"
          spacing={{ base: '3', md: '2' }}
        >
          <Stack
            spacing="4"
            direction={{ base: 'column', md: 'row' }}
            align={{ base: 'start', md: 'center' }}
          >
            {!isMobile && (
              <Square size="12" bg="bg-subtle" borderRadius="md">
                <Icon as={FiInfo} boxSize="6" />
              </Square>
            )}
            <Stack
              direction={{ base: 'column', md: 'row' }}
              spacing={{ base: '0.5', md: '1.5' }}
              pe={{ base: '4', sm: '0' }}
            >
              <Text fontWeight="medium">{title}</Text>
              { !!detail && <Text color="muted">{detail}</Text> }
            </Stack>
          </Stack>
          <Stack
            direction={{ base: 'column', sm: 'row' }}
            spacing={{ base: '3', sm: '2' }}
            align={{ base: 'stretch', sm: 'center' }}
          >
            <Button variant="primary" width="full" onClick={onClick}>
              {action}
            </Button>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}