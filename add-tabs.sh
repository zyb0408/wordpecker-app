#!/bin/bash

# 在第 323 行后插入 Tabs 开始代码
sed -i '' '323 a\
\
          {/* Tabs for New Exercise and History */}\
          <Tabs colorScheme="green" variant="enclosed" size="lg">\
            <TabList>\
              <Tab _selected={{ color: '\''green.500'\'', borderColor: '\''green.500'\'', borderBottomColor: '\''transparent'\'' }}>\
                <HStack spacing={2}>\
                  <Text fontSize="xl">🌱</Text>\
                  <Text fontWeight="semibold">新练习</Text>\
                </HStack>\
              </Tab>\
              <Tab _selected={{ color: '\''green.500'\'', borderColor: '\''green.500'\'', borderBottomColor: '\''transparent'\'' }}>\
                <HStack spacing={2}>\
                  <Text fontSize="xl">📚</Text>\
                  <Text fontWeight="semibold">历史记录</Text>\
                </HStack>\
              </Tab>\
            </TabList>\
\
            <TabPanels>\
              <TabPanel px={0} py={6}>\
' frontend/src/pages/ImageDescription.tsx

# 在第 1014 行（现在是 1034 行，因为前面插入了 20 行）后插入 Tabs 结束代码
sed -i '' '1034 a\
\
              </TabPanel>\
\
              <TabPanel px={0} py={6}>\
                <ImageDescriptionHistory />\
              </TabPanel>\
            </TabPanels>\
          </Tabs>\
\
        </VStack>\
' frontend/src/pages/ImageDescription.tsx

# 删除原来的 </VStack> 行（现在在 1045 行）
# 不需要删除，因为我们在 Tabs 结束时已经添加了

echo "Tabs integration completed!"
