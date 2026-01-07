import { Box, Container, Flex, Button, Icon, Text, Menu, MenuButton, MenuList, MenuItem, Avatar } from '@chakra-ui/react';
import { Link, useNavigate } from 'react-router-dom';
import { GiTreeBranch, GiBookshelf } from 'react-icons/gi';
import { FaFeatherAlt, FaCog, FaCamera, FaGraduationCap, FaSignOutAlt } from 'react-icons/fa';
import { ChevronDownIcon } from '@chakra-ui/icons';

export const Header = () => {
  const navigate = useNavigate();
  const tenantId = localStorage.getItem('wordpecker-tenant-id');

  const handleLogout = () => {
    localStorage.removeItem('wordpecker-tenant-id');
    localStorage.removeItem('wordpecker-auth-token');
    navigate('/login');
  };

  return (
    <Box as="nav" w="100%" bg="slate.800" boxShadow="lg" position="sticky" top={0} zIndex={10}>
      <Container maxW="container.xl">
        <Flex h="16" alignItems="center" justifyContent="space-between">
          <Flex gap={6} align="center">
            <Link to="/lists">
              <Button 
                variant="ghost"
                leftIcon={<Icon as={GiTreeBranch} color="green.500" />}
                _hover={{
                  transform: 'translateY(-2px)',
                  color: 'green.500'
                }}
                transition="all 0.2s"
              >
                <Flex align="center" gap={1}>
                  <Text>My Trees</Text>
                  <Icon 
                    as={FaFeatherAlt} 
                    color="#FA8C16" 
                    transform="rotate(-45deg)"
                    boxSize={3}
                    ml={-1}
                    mt={-2}
                  />
                </Flex>
              </Button>
            </Link>
            <Link to="/templates">
              <Button 
                variant="ghost"
                leftIcon={<Icon as={GiBookshelf} color="#1890FF" />}
                _hover={{
                  transform: 'translateY(-2px)',
                  color: '#1890FF'
                }}
                transition="all 0.2s"
              >
                Templates
              </Button>
            </Link>
            <Link to="/describe">
              <Button 
                variant="ghost"
                leftIcon={<Icon as={FaCamera} color="#FA8C16" />}
                _hover={{
                  transform: 'translateY(-2px)',
                  color: '#FA8C16'
                }}
                transition="all 0.2s"
              >
                Vision Garden
              </Button>
            </Link>
            <Link to="/learn-new-words">
              <Button 
                variant="ghost"
                leftIcon={<Icon as={FaGraduationCap} color="#FA8C16" />}
                _hover={{
                  transform: 'translateY(-2px)',
                  color: '#FA8C16'
                }}
                transition="all 0.2s"
              >
                Get New Words
              </Button>
            </Link>
            <Link to="/settings">
              <Button 
                variant="ghost"
                leftIcon={<Icon as={FaCog} color="gray.400" />}
                _hover={{
                  transform: 'translateY(-2px)',
                  color: 'gray.300'
                }}
                transition="all 0.2s"
              >
                Settings
              </Button>
            </Link>
          </Flex>
          
          <Flex align="center" gap={4}>
            <Menu>
              <MenuButton 
                as={Button} 
                variant="ghost" 
                rightIcon={<ChevronDownIcon />}
                _hover={{ bg: 'slate.700' }}
              >
                <Flex align="center" gap={2}>
                  <Avatar size="xs" name={tenantId || 'User'} bg="purple.500" />
                  <Text fontSize="sm" color="gray.300" maxW="100px" isTruncated>
                    {tenantId || 'User'}
                  </Text>
                </Flex>
              </MenuButton>
              <MenuList bg="slate.800" borderColor="slate.700">
                <MenuItem 
                  icon={<FaSignOutAlt />} 
                  onClick={handleLogout}
                  _hover={{ bg: 'red.900', color: 'white' }}
                  bg="transparent"
                  color="red.400"
                >
                  Logout
                </MenuItem>
              </MenuList>
            </Menu>
          </Flex>
        </Flex>
      </Container>
    </Box>
  );
};
