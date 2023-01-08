import React, { useCallback, useState } from 'react';
import { Button, ButtonGroup, Icon } from '@chakra-ui/react';
import { t } from '@lingui/macro';
import { useAuth } from '../lib/AuthContext';
import { FaHeart } from 'react-icons/fa';

export default function LikeButton({ liked = false, likeCount = 0, onClick }: { liked: boolean | undefined | null; likeCount: number | undefined | null; onClick?: () => Promise<string | undefined>}) {
  const { authUser } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const handleClick = useCallback(() => {
    setSubmitting(true);
    try {
      onClick?.();
    } finally {
      setSubmitting(false);
    }
  }, [setSubmitting, onClick]);
  const disabled = !authUser || !onClick;
  return (
    <ButtonGroup>
      <Button
        aria-label={liked ? t`Unlike` : t`Like`}
        leftIcon={liked || disabled ? <Icon as={FaHeart} color="red.600" /> : <FaHeart />}
        onClick={handleClick}
        isLoading={submitting}
        disabled={disabled}
        cursor={disabled ? 'default' : 'pointer'}
        _disabled={{
          _hover: {}
        }}
        variant={disabled ? 'ghost' : undefined}
      >
        { likeCount }
      </Button>
    </ButtonGroup>
  );
}