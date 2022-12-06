import React, { useMemo } from 'react';
import Parser from 'simple-text-parser';
import { Box } from '@chakra-ui/react';
import { useTranslations } from '../lib/TranslationProvider';

export default function CardText({ text, aspectId, noPadding }: { text: string; aspectId: string | undefined | null; noPadding?: boolean }) {
  const { aspects } = useTranslations();
  const parsed = useMemo(() => {
    const parser = new Parser().addRule(
      /\[([^\]0-9]+)\]/gi,
      (tag, element) => {
        if (aspects[element]) {
          return `<span style="color: var(--chakra-colors-aspect-${element}); font-weight: 900; letter-spacing: 1px">${aspects[element]?.short_name}</span>`;
        }
        return `<span class="core-${element}"></span>`;
      }
    ).addRule(/\n/g, () => '<hr class="card-line"></hr>');
    return parser.render(text);
  }, [text, aspects]);
  if (noPadding) {
    return <span className='card-text' dangerouslySetInnerHTML={{ __html: parsed }} />;
  }
  return (
    <Box padding={2} borderLeftWidth={2} margin={1} borderLeftColor={aspectId ? `aspect.${aspectId}` : 'gray.500'}>
      <span className='card-text' dangerouslySetInnerHTML={{ __html: parsed }} />
    </Box>
  );
}