import React, { useCallback, useState } from 'react';
import { Flex, Button, Text, ButtonGroup } from '@chakra-ui/react';
import { t } from '@lingui/macro';
import { useAuth } from '../lib/AuthContext';
import { FaHeart } from 'react-icons/fa';
import { SlHeart } from 'react-icons/sl';

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
  if (authUser && onClick) {
    return (
      <ButtonGroup>
        <Button
          aria-label={liked ? t`Unlike` : t`Like`}
          color={liked ? 'red.600' : 'gray.500'}
          leftIcon={liked ? <FaHeart /> : <SlHeart />}
          onClick={handleClick}
          isLoading={submitting}
        >
          { likeCount }
        </Button>
      </ButtonGroup>
    );
  }
  return (
    <Flex flexDirection="row" alignItems="center">
      <FaHeart color="red.600" size={18} />
      <Text marginLeft={1}>{likeCount}</Text>
    </Flex>
  );
}