# 如何手动添加 Tabs 功能到 ImageDescription.tsx

由于文件很大（1000+ 行），自动修改容易出错。请按以下步骤手动添加 Tabs 功能：

## 方法：在文件中添加 3 处修改

### 修改 1：在第 323 行后添加 Tabs 开始

找到第 323 行（`</Flex>` 后面），添加以下代码：

```tsx
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
              <TabPanel px={0} py={6}>
```

### 修改 2：在第 1014 行（`</Modal>` 后）添加第一个 Tab 的结束和第二个 Tab

```tsx
              </TabPanel>

              <TabPanel px={0} py={6}>
                <ImageDescriptionHistory />
              </TabPanel>
            </TabPanels>
          </Tabs>
```

### 修改 3：在文件末尾添加 VStack 闭合标签

在第 1015 行 `</Container>` 之前添加：

```tsx
        </VStack>
```

## 完整的结构应该是：

```tsx
return (
  <Box>
    <Container>
      <VStack>  {/* 第 297 行 */}
        <Flex>...</Flex>  {/* 标题 */}
        
        <Tabs>  {/* 新添加 */}
          <TabList>
            <Tab>新练习</Tab>
            <Tab>历史记录</Tab>
          </TabList>
          
          <TabPanels>
            <TabPanel>
              {/* 所有原有的练习内容 */}
              {state === 'setup' && (...)}
              {state === 'describing' && (...)}
              {state === 'results' && (...)}
              <Modal>...</Modal>
            </TabPanel>
            
            <TabPanel>
              <ImageDescriptionHistory />
            </TabPanel>
          </TabPanels>
        </Tabs>
        
      </VStack>  {/* 新添加的闭合标签 */}
    </Container>
  </Box>
);
```

## 或者使用我提供的完整文件

如果手动修改太麻烦，告诉我，我可以为你生成一个完整的新文件。
