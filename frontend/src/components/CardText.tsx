import React, { useMemo } from 'react';
import Parser from 'simple-text-parser';
import { filter } from 'lodash';
import { Box, useColorMode } from '@chakra-ui/react';
import { useLocale } from '../lib/TranslationProvider';

export function useIconedText(
  text: string | undefined | null,
  options: {
    aspectId?: string | null;
    noLines?: boolean;
  },
  flavor?: string | undefined | null
): string {
  const { aspectId = 'NEUTRAL', noLines } = options;
  const { aspects } = useLocale();
  const { colorMode } = useColorMode();
  return useMemo(() => {
    const parser = new Parser().addRule(
      /\[\[(.*?)\]\]/gi,
      (tag, element) => {
        return `<span style="text-shadow: 0 0 2px var(--chakra-colors-${colorMode}-aspect-${aspectId});">${element}</span>`;
      }
    ).addRule(
      /\[([^\]0-9X]+)\]/g,
      (tag, element) => {
        if (aspects[element]) {
          return `<span style="color: var(--chakra-colors-${colorMode}-aspect-${element}); font-weight: 900; letter-spacing: -0.5px">${aspects[element]?.short_name}</span>`;
        }
        return `<span class="core-${element}"></span>`;
      }
    ).addRule(/\n/g, () => noLines ? '<br />' : '<hr class="card-line"></hr>');
    const cleanText = text ? text.replace(/<f>/g, `<i class="card-${colorMode}-flavor">`).replace(/<\/f>/g, '</i>') : undefined;
    return parser.render(
      filter([cleanText, flavor ? `<i class="card-${colorMode}-flavor">${flavor}</i>` : undefined], x => !!x).join('\n'));
  }, [text, aspectId, noLines, flavor, aspects, colorMode]);
}

export default function CardText({ text, flavor, aspectId, noPadding }: { text: string | undefined | null; flavor?: string | undefined | null, aspectId?: string | undefined | null; noPadding?: boolean }) {
  const { colorMode } = useColorMode();
  const parsed = useIconedText(text, { aspectId }, flavor);
  if (noPadding) {
    return <span className='card-text' dangerouslySetInnerHTML={{ __html: parsed }} />;
  }
  return (
    <Box padding={2} borderLeftWidth={2} margin={1} borderLeftColor={aspectId ? `${colorMode}.aspect.${aspectId}` : 'gray.500'}>
      <span className='card-text' dangerouslySetInnerHTML={{ __html: parsed }} />
    </Box>
  );
}