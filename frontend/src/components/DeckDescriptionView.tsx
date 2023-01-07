import React, { useMemo } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

import { useIconedText } from './CardText';

export default function DeckDescriptionView({ description }: { description: string }) {
  const sanitized = useMemo(() => DOMPurify.sanitize(marked(description)), [description]);
  const iconized = useIconedText(sanitized, { noLines: true });
  return (
    <span className='card-text' dangerouslySetInnerHTML={{ __html: iconized }} />
  );
}