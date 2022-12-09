import React, { useMemo } from 'react';
import Parser from 'simple-text-parser';
import { filter } from 'lodash';
import { Box } from '@chakra-ui/react';
import { useLocale } from '../lib/TranslationProvider';

export function useIconedText(text: string | undefined | null, flavor?: string | undefined | null) {
  const { aspects } = useLocale();
  return useMemo(() => {
    const parser = new Parser().addRule(
      /\[([^\]0-9]+)\]/gi,
      (tag, element) => {
        if (aspects[element]) {
          return `<span style="color: var(--chakra-colors-aspect-${element}); font-weight: 900; letter-spacing: 1px">${aspects[element]?.short_name}</span>`;
        }
        return `<span class="core-${element}"></span>`;
      }
    ).addRule(/\n/g, () => '<hr class="card-line"></hr>');
    return parser.render(filter([text, flavor ? `<i>${flavor}</i>` : undefined], x => !!x).join('\n'));
  }, [text, flavor, aspects]);
}

export default function CardText({ text, flavor, aspectId, noPadding }: { text: string | undefined | null; flavor?: string | undefined | null, aspectId: string | undefined | null; noPadding?: boolean }) {
  const parsed = useIconedText(text, flavor);
  if (noPadding) {
    return <span className='card-text' dangerouslySetInnerHTML={{ __html: parsed }} />;
  }
  return (
    <Box padding={2} borderLeftWidth={2} margin={1} borderLeftColor={aspectId ? `aspect.${aspectId}` : 'gray.500'}>
      <span className='card-text' dangerouslySetInnerHTML={{ __html: parsed }} />
    </Box>
  );
}