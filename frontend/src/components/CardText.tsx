import React, { useMemo } from 'react';
import Parser from 'simple-text-parser';
import { filter } from 'lodash';
import { Box, Circle, Flex, useColorMode } from '@chakra-ui/react';
import { useLocale } from '../lib/TranslationProvider';
import { useTheme } from '../lib/ThemeContext';
import CoreIcon from '../icons/CoreIcon';

export function useIconedText(
  text: string | undefined | null,
  options: {
    aspectId?: string | null;
    noLines?: boolean;
    inverted?: boolean;
  },
  flavor?: string | undefined | null
): string {
  const { aspectId = 'NEUTRAL', noLines, inverted } = options;
  const { aspects } = useLocale();
  const { colorMode } = useColorMode();
  const theme = inverted ? 'dark' : colorMode;
  return useMemo(() => {
    const parser = new Parser().addRule(
      /\[\[(.*?)\]\]/gi,
      (tag, element) => {
        return `<span style="text-shadow: 0 0 2px var(--chakra-colors-${theme}-aspect-${aspectId});">${element}</span>`;
      }
    ).addRule(
      /\[([^\]0-9X]+)\]/g,
      (tag, element) => {
        if (aspects[element]) {
          return `<span style="color: var(--chakra-colors-${theme}-aspect-${element}); font-weight: 900; letter-spacing: -0.5px">${aspects[element]?.short_name}</span>`;
        }
        return `<span class="core-${element}"></span>`;
      }
    ).addRule(/\n/g, () => noLines ? '<br />' : '<hr class="card-line"></hr>');
    const cleanText = text ? text.replace(/<f>/g, `<i class="card-flavor">`).replace(/<\/f>/g, '</i>') : undefined;
    return parser.render(
      filter([cleanText, flavor ? `<i class="card-flavor">${flavor}</i>` : undefined], x => !!x).join('\n'));
  }, [text, aspectId, noLines, flavor, aspects, theme]);
}

export default function CardText({ text, flavor, aspectId, noPadding, inverted }: {
  text: string | undefined | null;
  flavor?: string | undefined | null;
  aspectId?: string | undefined | null;
  noPadding?: boolean;
  inverted?: boolean;
}) {
  const { colorMode } = useColorMode();
  const parsed = useIconedText(text, { aspectId, inverted }, flavor);
  const theme = inverted ? 'dark' : colorMode;
  if (noPadding) {
    return <span className={`card-${theme}-text`} dangerouslySetInnerHTML={{ __html: parsed }} />;
  }
  return (
    <Box padding={2} borderLeftWidth={2} margin={1} borderLeftColor={aspectId ? `${theme}.aspect.${aspectId}` : 'gray.500'}>
      <span className={`card-${theme}-text`} dangerouslySetInnerHTML={{ __html: parsed }} />
    </Box>
  );
}

export function ChallengeText({ text, challenge }: { text: string; challenge: 'mountain' | 'sun' | 'crest' }) {
  const { colors } = useTheme();
  return (
    <Box padding={2} background={`challengeBackground.${challenge}`}>
      <Flex direction="row" justifyContent="flex-start" alignItems="center">
        <Circle background={`challengeIcon.${challenge}`} size={8} marginRight={2}>
          <CoreIcon icon={challenge} color="white" size={24} />
        </Circle>
        <CardText text={text} noPadding inverted />
      </Flex>
    </Box>
  )
}