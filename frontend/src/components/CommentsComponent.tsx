import React, { useCallback, useMemo, useState } from 'react';
import { Button, Box, Flex, Text, useDisclosure, Modal, ModalOverlay, ModalContent, ModalHeader, Heading, ModalCloseButton, ModalBody, Textarea, ModalFooter, ButtonGroup, IconButton, Tooltip } from '@chakra-ui/react';
import { filter, map, trim, sortBy } from 'lodash';
import { t } from '@lingui/macro';
import { FaComment, FaEdit } from 'react-icons/fa';

import { BasicDeckCommentFragment, useEditCommentMutation, useGetResponseCommentsQuery, usePostCommentMutation } from '../generated/graphql/apollo-schema';
import CoreIcon from '../icons/CoreIcon';
import { useAuth } from '../lib/AuthContext';
import SubmitButton from './SubmitButton';
import { SlCalender } from 'react-icons/sl';
import { useLocale } from '../lib/TranslationProvider';
import DeckDescriptionView from './DeckDescriptionView';

interface CommentProps {
  comment: BasicDeckCommentFragment;
  onEdit: (comment: BasicDeckCommentFragment) => void;
  onReply: (comment: BasicDeckCommentFragment) => void;
  level: number;
}
function CommentComponent({ comment, onEdit, onReply, level }: CommentProps) {
  const { authUser } = useAuth();
  const { i18n } = useLocale();
  const handleReply = useCallback(() => {
    onReply(comment);
  }, [comment, onReply])
  const handleEdit = useCallback(() => {
    onEdit(comment);
  }, [comment, onEdit]);
  const updatedTime = i18n?.date(comment.updated_at, { dateStyle: 'short' });
  return (
    <Box marginTop={1} padding={2}>
      <Flex direction="column">
        <Flex direction="row" justifyContent="space-between" >
          <Flex direction="column" flex="1">
            { !!comment.user.handle && (
              <Flex direction="row" alignItems="center" minWidth="200px">
                <CoreIcon icon="ranger" size={18} />
                <Text fontSize="lg" marginLeft={1}>{comment.user.handle}</Text>
              </Flex>
            ) }
            { !!comment.text && (
              <Box paddingTop={2} paddingLeft={2} paddingRight={2}>
                <DeckDescriptionView description={comment.text} />
              </Box>
            ) }
          </Flex>
          <Flex direction="row" justifyContent="flex-end">
            <Flex direction="column" alignItems="flex-end">
              <Flex direction="row" alignItems="center">
                <SlCalender />
                <Text fontSize="lg" marginLeft={2}>
                  {i18n?.date(comment.created_at, { dateStyle: 'long' })}
                </Text>
              </Flex>
              { (comment.updated_at !== comment.created_at) && (
                <Tooltip label={t`This comment was edited on ${updatedTime}.`}>
                  <Text fontSize="xs" marginBottom={1}>
                    { t`(edited)`}
                  </Text>
                </Tooltip>
              )}
              <ButtonGroup orientation="vertical">
                {comment.user.id === authUser?.uid ? (
                  <IconButton
                    aria-label={t`Edit comment`}
                    icon={<FaEdit />}
                    onClick={handleEdit}
                  />
                ) : (
                  <IconButton
                    aria-label={t`Reply comment`}
                    icon={<FaComment />}
                    onClick={handleReply}
                  />
                )}
              </ButtonGroup>
            </Flex>
          </Flex>
        </Flex>
      </Flex>
    </Box>
  );
}

function CommentResponses({ comment, level, allComments, onReply, onEdit, total }: CommentProps & {
  total: number;
  allComments: BasicDeckCommentFragment[];
}) {
  const { authUser } = useAuth();
  const [show, setShow] = useState(total > 0 && level < 2);
  const [preLoaded, preLoadedComments] = useMemo(() => {
    if (total <= 0) {
      return [true, []];
    }
    const matchingComments = filter(allComments, c => c.comment_id === comment.id);
    if (matchingComments.length === total) {
      return [true, sortBy(matchingComments, c => c.created_at)];
    }
    return [false, matchingComments];
  }, [allComments, comment, total]);
  const { data, fetchMore } = useGetResponseCommentsQuery({
    variables: {
      commentId: comment.id,
      limit: 5,
      offset: 0,
    },
    skip: preLoaded && !show,
  });
  if (!total) {
    return null;
  }
  return null;
}
function useAddCommentModal(deckId: number): [React.ReactNode, (comment?: BasicDeckCommentFragment) => void] {
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
    setText(undefined);
    return undefined;
  }, [postComment, setText, deckId, comment, text]);

  return [
    <Modal key="mission" isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <Box paddingRight={8}>
            <Heading>{comment ? t`Reply to comment` : t`Comment`}</Heading>
          </Box>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          { !!comment?.text && (
            <DeckDescriptionView description={comment.text} />
          ) }
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

function useEditCommentModal(): [
  React.ReactNode,
  (comment: BasicDeckCommentFragment) => void,
] {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [commentId, setCommentId] = useState<string>();
  const [text, setText] = useState<string>();
  const [editComment] = useEditCommentMutation();
  const handleOpen = useCallback((comment: BasicDeckCommentFragment) => {
    setCommentId(comment.id);
    setText(comment.text || '');
    onOpen();
  }, [onOpen, setCommentId, setText]);

  const submitComment = useCallback(async() => {
    const trimmed = trim(text);
    if (!trimmed || !commentId) {
      return;
    }
    const r = await editComment({
      variables: {
        id: commentId,
        text: trimmed,
      },
    });
    if (r.errors?.length) {
      return r.errors[0].message;
    }
    setCommentId(undefined);
    setText(undefined);
    onClose();
    return undefined;
  }, [editComment, setText, setCommentId, onClose, commentId, text]);

  return [
    <Modal key="mission" isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <Box paddingRight={8}>
            <Heading>{t`Edit comment`}</Heading>
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
            {t`Save`}
          </SubmitButton>
        </ModalFooter>
      </ModalContent>
    </Modal>,
    handleOpen,
  ];
}


interface Props {
  comments: BasicDeckCommentFragment[];
  deckId: number;
}

export default function CommentsComponent({ comments, deckId }: Props) {
  const { authUser } = useAuth();
  const [commentModal, postComment] = useAddCommentModal(deckId);
  const [editCommentModal, editComment] = useEditCommentModal();
  const onClick = useCallback(() => postComment(), [postComment]);
  return (
    <>
      <a id="comments" />
      <Box marginTop={4}>
        <Flex direction="row" alignItems="center" justifyContent="space-between">
          <Heading size="md">{t`Comments`}</Heading>
          { !!authUser && <Button marginBottom={2} leftIcon={<FaComment />} onClick={onClick}>{t`Comment`}</Button> }
        </Flex>
        { map(comments, (comment, idx) => (
          <CommentComponent
            key={idx}
            comment={comment}
            onReply={postComment}
            onEdit={editComment}
            level={0}
          />)
        )}
      </Box>
      { commentModal }
      { editCommentModal }
    </>
  )
}