import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Text,
  useToast,
  Heading,
  Container,
  Card,
  CardBody,
  Divider,
  HStack,
  Icon
} from '@chakra-ui/react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LockIcon } from '@chakra-ui/icons';

export const Login = () => {
  const [tenantId, setTenantId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a Tenant ID',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);
    // Store tenant ID in localStorage
    localStorage.setItem('wordpecker-tenant-id', tenantId.trim());
    
    toast({
      title: 'Success',
      description: 'Logged in successfully',
      status: 'success',
      duration: 2000,
      isClosable: true,
    });

    setTimeout(() => {
      navigate('/lists');
      setIsLoading(false);
    }, 500);
  };

  return (
    <Container maxW="md" py={20}>
      <VStack spacing={8}>
        <VStack spacing={2} textAlign="center">
          <Heading color="white" size="2xl">WordPecker</Heading>
          <Text color="purple.300">Multi-tenant Language Learning</Text>
        </VStack>

        <Card bg="gray.800" borderColor="purple.500" borderWidth="1px" w="full" shadow="2xl">
          <CardBody p={8}>
            <form onSubmit={handleLogin}>
              <VStack spacing={6}>
                <FormControl id="tenantId" isRequired>
                  <FormLabel color="gray.300">Tenant ID</FormLabel>
                  <Input
                    placeholder="Enter your Tenant ID"
                    value={tenantId}
                    onChange={(e) => setTenantId(e.target.value)}
                    bg="gray.900"
                    borderColor="gray.700"
                    color="white"
                    _hover={{ borderColor: 'purple.400' }}
                    _focus={{ borderColor: 'purple.500', boxShadow: '0 0 0 1px purple.500' }}
                  />
                </FormControl>

                <Button
                  type="submit"
                  colorScheme="purple"
                  w="full"
                  size="lg"
                  isLoading={isLoading}
                  leftIcon={<LockIcon />}
                >
                  Login
                </Button>
              </VStack>
            </form>
          </CardBody>
        </Card>

        <HStack color="gray.500" fontSize="sm">
          <Text>Default Demo Tenant:</Text>
          <Text color="purple.400" cursor="pointer" onClick={() => setTenantId('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11')}>
            Click to use demo
          </Text>
        </HStack>
      </VStack>
    </Container>
  );
};
