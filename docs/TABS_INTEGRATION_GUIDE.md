# ImageDescription.tsx Tabs 集成 - 手动修改指南

由于文件较大（1000+ 行），自动修改容易出错。请按以下步骤手动修改：

## 步骤 1：在第 323 行后添加 Tabs 开始标签

找到这一行（约 323 行）：
```tsx
          </Flex>

          {/* Setup Phase */}
```

替换为：
```tsx
          </Flex>

          {/* Tabs for New Exercise and History */}
          <Tabs colorScheme="green" variant="enclosed" size="lg">
            <TabList>
              <Tab _selected={{ color: 'green.500', borderColor: 'green.500', borderBottomColor: 'transparent' }}>
                <HStack spacing={2}>
                  <Text fontSize="xl">🌱</Text>
                  <Text fontWeight="semibold">新练习</Text>
                </HStack>
              </Tab>
              <Tab _selected={{ color: 'green.500', borderColor: 'green.500', borderBottomColor: 'transparent' }}>
                <HStack spacing={2}>
                  <Text fontSize="xl">📚</Text>
                  <Text fontWeight="semibold">历史记录</Text>
                </HStack>
              </Tab>
            </TabList>

            <TabPanels>
              {/* Tab 1: New Exercise */}
              <TabPanel px={0} py={6}>

          {/* Setup Phase */}
```

## 步骤 2：在文件末尾的 Modal 之前添加闭合标签

找到文件末尾（约 1000 行），在最后一个 `</Modal>` 之后，`</VStack>` 之前添加：

```tsx
              </TabPanel>

              {/* Tab 2: History */}
              <TabPanel px={0} py={6}>
                <ImageDescriptionHistory />
              </TabPanel>
            </TabPanels>
          </Tabs>
```

## 完整的结构应该是：

```tsx
return (
  <Box minH="100vh" bg={...}>
    <Container maxW="container.xl" py={8} px={{ base: 4, md: 8 }}>
      <VStack spacing={8} align="stretch">
        {/* 标题部分 */}
        <Flex>...</Flex>

        {/* Tabs */}
        <Tabs colorScheme="green" variant="enclosed" size="lg">
          <TabList>
            <Tab>🌱 新练习</Tab>
            <Tab>📚 历史记录</Tab>
          </TabList>

          <TabPanels>
            <TabPanel px={0} py={6}>
              {/* 原有的所有内容：setup, describing, results */}
              {state === 'setup' && (...)}
              {state === 'describing' && (...)}
              {state === 'results' && (...)}
              
              {/* Modal for adding words */}
              <Modal>...</Modal>
            </TabPanel>

            <TabPanel px={0} py={6}>
              <ImageDescriptionHistory />
            </TabPanel>
          </TabPanels>
        </Tabs>

      </VStack>
    </Container>
  </Box>
);
```

## 或者使用我提供的完整文件

如果手动修改太复杂，我可以为你生成一个完整的新文件。请告诉我你的选择。
