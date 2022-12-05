import React, { useMemo } from 'react';
import Parser from 'simple-text-parser';
import { Aspect, AspectMap, AspectType } from '../types/types';
import { Box } from '@chakra-ui/react';

export default function CardText({ text, aspects, aspectId }: { text: string; aspects: AspectMap; aspectId: string | undefined | null; }) {
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
  return (
    <Box padding={2} borderLeftWidth={2} margin={1} borderLeftColor={aspectId ? `aspect.${aspectId}` : 'gray.500'}>
      <span className='card-text' dangerouslySetInnerHTML={{ __html: parsed }} />
    </Box>
  );
}