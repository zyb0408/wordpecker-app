import React, { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Heading,
  Text,
  useToast,
  Container,
  Card,
  CardBody,
  Link as ChakraLink,
  Divider,
  InputGroup,
  InputRightElement,
  IconButton,
} from '@chakra-ui/react';
import { useNavigate, Link } from 'react-router-dom';
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons';
import { apiService } from '../services/api';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await apiService.login(email, password);
      localStorage.setItem('wordpecker-auth-token', response.token);
      localStorage.setItem('wordpecker-tenant-id', response.user.id);
      localStorage.setItem('wordpecker-user-name', response.user.name);

      toast({
        title: 'Login successful',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      navigate('/lists');
    } catch (error: any) {
      toast({
        title: 'Login failed',
        description: error.response?.data?.error || 'Invalid email or password',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const useDemo = () => {
    setEmail('demo@example.com');
    setPassword('password123');
  };

  return (
    <Container maxW="md" py={20}>
      <VStack spacing={8} align="stretch">
        <VStack spacing={2} align="center">
          <Heading color="green.500" size="xl">WordPecker</Heading>
          <Text color="gray.400">Welcome back! Please login to your account.</Text>
        </VStack>

        <Card bg="slate.800" borderColor="slate.700" borderWidth={1} boxShadow="xl">
          <CardBody p={8}>
            <form onSubmit={handleLogin}>
              <VStack spacing={6}>
                <FormControl id="email" isRequired>
                  <FormLabel color="gray.300">Email Address</FormLabel>
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    bg="slate.900"
                    borderColor="slate.600"
                    _hover={{ borderColor: 'green.500' }}
                    _focus={{ borderColor: 'green.500', boxShadow: '0 0 0 1px green.500' }}
                  />
                </FormControl>

                <FormControl id="password" isRequired>
                  <FormLabel color="gray.300">Password</FormLabel>
                  <InputGroup>
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      bg="slate.900"
                      borderColor="slate.600"
                      _hover={{ borderColor: 'green.500' }}
                      _focus={{ borderColor: 'green.500', boxShadow: '0 0 0 1px green.500' }}
                    />
                    <InputRightElement>
                      <IconButton
                        variant="ghost"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        icon={showPassword ? <ViewOffIcon /> : <ViewIcon />}
                        onClick={() => setShowPassword(!showPassword)}
                        size="sm"
                        color="gray.400"
                        _hover={{ bg: 'transparent', color: 'white' }}
                      />
                    </InputRightElement>
                  </InputGroup>
                </FormControl>

                <Button
                  type="submit"
                  colorScheme="green"
                  width="full"
                  size="lg"
                  isLoading={isLoading}
                  _hover={{ transform: 'translateY(-2px)', boxShadow: 'lg' }}
                >
                  Login
                </Button>
              </VStack>
            </form>

            <Divider my={6} borderColor="slate.600" />

            <VStack spacing={4}>
              <Text color="gray.400" fontSize="sm">
                Don't have an account?{' '}
                <ChakraLink as={Link} to="/register" color="green.400" fontWeight="bold">
                  Register here
                </ChakraLink>
              </Text>
              <Button
                variant="link"
                color="gray.500"
                fontSize="xs"
                onClick={useDemo}
              >
                Click to use demo account
              </Button>
            </VStack>
          </CardBody>
        </Card>
      </VStack>
    </Container>
  );
};
