import React, { useMemo } from 'react';
import Parser from 'simple-text-parser';
import { Aspect, AspectMap } from '../types/types';
import { Box } from '@chakra-ui/react';

export default function CardText({ text, aspects, aspect }: { text: string; aspects: AspectMap; aspect: Aspect | undefined; }) {
  const parsed = useMemo(() => {
    const parser = new Parser().addRule(
      /\[([^\]0-9]+)\]/gi,
      (tag, element) => {
        if (aspects[element]) {
          return `<span style="color: ${aspects[element]?.color || '#000000'}; font-weight: 900; letter-spacing: 1px">${aspects[element]?.short_name}</span>`;
        }
        return `<span class="core-${element}"></span>`;
      }
    ).addRule(/\n/g, () => '<hr class="card-line"></hr>');
    return parser.render(text);
  }, [text, aspects]);
  return (
    <Box padding={2} borderLeftWidth={2} margin={1} borderLeftColor={aspect?.color || '#888888'}>
      <span className='card-text' dangerouslySetInnerHTML={{ __html: parsed }} />
    </Box>
  );
}