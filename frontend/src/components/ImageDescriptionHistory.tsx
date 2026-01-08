import React, { useState, useEffect } from 'react';
import {
    Box,
    VStack,
    HStack,
    Text,
    Image,
    Card,
    CardBody,
    Heading,
    Badge,
    SimpleGrid,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalCloseButton,
    useDisclosure,
    Spinner,
    Alert,
    AlertIcon,
    useColorModeValue,
} from '@chakra-ui/react';
import { apiService } from '../services/api';

interface HistoryExercise {
    id: string;
    context: string;
    imageUrl: string;
    imageAlt: string;
    userDescription: string;
    feedback: any; // 后端返回的是 JSONB 字段
    createdAt: string;
}

export const ImageDescriptionHistory: React.FC = () => {
    const [exercises, setExercises] = useState<HistoryExercise[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedExercise, setSelectedExercise] = useState<HistoryExercise | null>(null);
    const { isOpen, onOpen, onClose } = useDisclosure();

    const cardBg = useColorModeValue('white', '#1E293B');
    const borderColor = useColorModeValue('gray.200', '#334155');

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        setLoading(true);
        try {
            const data = await apiService.getDescriptionHistory(20);
            setExercises(data.exercises);
        } catch (error) {
            console.error('Failed to load history:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetails = (exercise: HistoryExercise) => {
        setSelectedExercise(exercise);
        onOpen();
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (loading) {
        return (
            <Box textAlign="center" py={10}>
                <Spinner size="xl" color="green.500" thickness="4px" />
                <Text mt={4} color="gray.500">加载历史记录中...</Text>
            </Box>
        );
    }

    if (exercises.length === 0) {
        return (
            <Alert status="info" borderRadius="lg">
                <AlertIcon />
                <VStack align="start" spacing={1}>
                    <Text fontWeight="bold">还没有历史记录</Text>
                    <Text fontSize="sm">开始你的第一次图片描述练习吧！</Text>
                </VStack>
            </Alert>
        );
    }

    return (
        <>
            <VStack spacing={6} align="stretch">
                <HStack justify="space-between">
                    <Heading size="md" color="green.500">
                        📚 我的练习历史
                    </Heading>
                    <Badge colorScheme="green" fontSize="md" px={3} py={1} borderRadius="full">
                        共 {exercises.length} 条记录
                    </Badge>
                </HStack>

                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                    {exercises.map((exercise) => (
                        <Card
                            key={exercise.id}
                            bg={cardBg}
                            borderColor={borderColor}
                            borderWidth="2px"
                            borderRadius="xl"
                            overflow="hidden"
                            cursor="pointer"
                            onClick={() => handleViewDetails(exercise)}
                            _hover={{
                                transform: 'translateY(-4px)',
                                shadow: 'xl',
                                borderColor: 'green.400',
                            }}
                            transition="all 0.2s"
                        >
                            <Box position="relative" h="200px" overflow="hidden">
                                <Image
                                    src={exercise.imageUrl}
                                    alt={exercise.imageAlt}
                                    objectFit="cover"
                                    w="100%"
                                    h="100%"
                                />
                                <Badge
                                    position="absolute"
                                    top={2}
                                    right={2}
                                    colorScheme="green"
                                    variant="solid"
                                    borderRadius="full"
                                    px={3}
                                >
                                    {exercise.context}
                                </Badge>
                            </Box>
                            <CardBody>
                                <VStack align="start" spacing={2}>
                                    <Text
                                        fontSize="sm"
                                        color="gray.500"
                                        noOfLines={3}
                                        lineHeight="tall"
                                    >
                                        {exercise.userDescription}
                                    </Text>
                                    <Text fontSize="xs" color="gray.400">
                                        🕒 {formatDate(exercise.createdAt)}
                                    </Text>
                                </VStack>
                            </CardBody>
                        </Card>
                    ))}
                </SimpleGrid>
            </VStack>

            {/* Detail Modal */}
            <Modal isOpen={isOpen} onClose={onClose} size="4xl" scrollBehavior="inside">
                <ModalOverlay />
                <ModalContent bg={cardBg}>
                    <ModalHeader>
                        <HStack spacing={2}>
                            <Text fontSize="xl">📖</Text>
                            <Text>练习详情</Text>
                        </HStack>
                    </ModalHeader>
                    <ModalCloseButton />
                    <ModalBody pb={6}>
                        {selectedExercise && (
                            <VStack spacing={6} align="stretch">
                                <Box>
                                    <Badge colorScheme="green" mb={3} fontSize="md" px={3} py={1} borderRadius="full">
                                        🌿 {selectedExercise.context}
                                    </Badge>
                                    <Image
                                        src={selectedExercise.imageUrl}
                                        alt={selectedExercise.imageAlt}
                                        borderRadius="xl"
                                        w="100%"
                                        maxH="400px"
                                        objectFit="contain"
                                        border="2px solid"
                                        borderColor="green.200"
                                    />
                                </Box>

                                <Box>
                                    <Heading size="sm" mb={2} color="green.600">
                                        📝 你的描述
                                    </Heading>
                                    <Box
                                        p={4}
                                        bg={useColorModeValue('gray.50', '#0F172A')}
                                        borderRadius="lg"
                                        border="1px solid"
                                        borderColor={borderColor}
                                    >
                                        <Text lineHeight="tall">{selectedExercise.userDescription}</Text>
                                    </Box>
                                </Box>

                                <Box>
                                    <Heading size="sm" mb={2} color="blue.600">
                                        🐦 AI 反馈
                                    </Heading>
                                    <Box
                                        p={4}
                                        bg={useColorModeValue('blue.50', '#0F172A')}
                                        borderRadius="lg"
                                        border="1px solid"
                                        borderColor="blue.200"
                                    >
                                        <Text lineHeight="tall">
                                            {typeof selectedExercise.feedback === 'string'
                                                ? selectedExercise.feedback
                                                : selectedExercise.feedback?.feedback || '暂无反馈'}
                                        </Text>
                                    </Box>
                                </Box>

                                <Text fontSize="sm" color="gray.500" textAlign="center">
                                    🕒 {formatDate(selectedExercise.createdAt)}
                                </Text>
                            </VStack>
                        )}
                    </ModalBody>
                </ModalContent>
            </Modal>
        </>
    );
};
