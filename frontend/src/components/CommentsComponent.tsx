import React, { useCallback, useState } from 'react';
import { Button, Box, Flex, Text, useDisclosure, Modal, ModalOverlay, ModalContent, ModalHeader, Heading, ModalCloseButton, ModalBody, Textarea, ModalFooter } from '@chakra-ui/react';
import { map, trim } from 'lodash';
import { t } from '@lingui/macro';
import { FaComment } from 'react-icons/fa';

import { BasicDeckCommentFragment, usePostCommentMutation } from '../generated/graphql/apollo-schema';
import CoreIcon from '../icons/CoreIcon';
import { useAuth } from '../lib/AuthContext';
import SubmitButton from './SubmitButton';

interface Props {
  comments: BasicDeckCommentFragment[];
  deckId: number;
}

function CommentComponent({ comment, onReply }: { comment: BasicDeckCommentFragment; onReply: (comment: BasicDeckCommentFragment) => void }) {
  return (
    <Box borderRadius="4px" marginTop={1} borderWidth="1px" padding={2}>
      <Flex direction="column">
        { comment.text }
        { !!comment.user.handle && (
          <Flex direction="row" alignItems="center">
            <CoreIcon icon="ranger" size={18} />
            <Text marginLeft={1}>{comment.user.handle}</Text>
          </Flex>
        )}
      </Flex>
    </Box>
  );
}

function useCommentModal(deckId: number): [React.ReactNode, (comment?: BasicDeckCommentFragment) => void] {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [comment, setComment] = useState<BasicDeckCommentFragment>();
  const [text, setText] = useState<string>();
  const [postComment] = usePostCommentMutation();
  const handleOpen = useCallback((comment?: BasicDeckCommentFragment) => {
    setComment(comment);
    onOpen();
  }, [onOpen, setComment]);

  const submitComment = useCallback(async() => {
    const trimmed = trim(text);
    if (!trimmed) {
      return;
    }
    console.log({
      deckId,
      commentId: comment?.id,
      text: trimmed,
    })
    const r = await postComment({
      variables: {
        deckId,
        commentId: comment?.id || null,
        text: trimmed,
      },
    });
    if (r.errors?.length) {
      return r.errors[0].message;
    }
    return undefined;
  }, [postComment, deckId, comment, text]);

  return [
    <Modal key="mission" isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <Box paddingRight={8}>
            <Heading>{t`Comment`}</Heading>
          </Box>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Flex direction="column">
            <Textarea
              value={text}
              onChange={(event) => setText(event.target.value)}
              autoFocus
            />
          </Flex>
        </ModalBody>
        <ModalFooter>
          <SubmitButton
            color="blue"
            disabled={!trim(text)}
            onSubmit={submitComment}
          >
            {t`Post`}
          </SubmitButton>
        </ModalFooter>
      </ModalContent>
    </Modal>,
    handleOpen,
  ];
}
export default function CommentsComponent({ comments, deckId }: Props) {
  const { authUser } = useAuth();
  const [commentModal, openModal] = useCommentModal(deckId);
  const onClick = useCallback(() => openModal(), [openModal]);
  return (
    <Box marginTop={4}>
      <Heading size="md">{t`Comments`}</Heading>
      { map(comments, (comment, idx) => <CommentComponent key={idx} comment={comment} onReply={openModal} />)}
      { !!authUser && <Button leftIcon={<FaComment />} onClick={onClick}>{t`Reply`}</Button> }
      { commentModal }
    </Box>
  )
}