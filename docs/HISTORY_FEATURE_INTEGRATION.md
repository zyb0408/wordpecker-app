# 图片描述历史记录功能 - 集成指南

## 已完成的工作

### 1. 安全性改进
- ✅ 所有存储服务（本地、OSS、Supabase）现在都按 `tenantId` 组织文件
- ✅ 文件路径结构：`wordpecker/images/{tenantId}/{timestamp}-{random}-{filename}`
- ✅ 后端 API 已经有 `tenant_id` 过滤，确保用户只能查看自己的数据

### 2. 后端安全验证
查看 `backend/src/api/image-description/routes.ts` 第 150-169 行：
```typescript
router.get('/history', validate(historyQuerySchema), async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;  // ✅ 从认证中间件获取
    const { limit = 10 } = req.query;

    const result = await query(
      `SELECT id, context, image_url as "imageUrl", image_alt as "imageAlt", 
              user_description as "userDescription", 
              analysis->'feedback' as feedback, created_at as "createdAt"
       FROM image_description_exercises
       WHERE tenant_id = $1  // ✅ 只查询当前用户的数据
       ORDER BY created_at DESC
       LIMIT $2`,
      [tenantId, limit]
    );

    res.json({ exercises: result.rows });
  } catch (error) {
    res.status(400).json({ error: 'Failed to fetch exercise history' });
  }
});
```

**安全保障：**
- ✅ 使用 `tenantHandler` 中间件自动从 JWT 提取 `tenantId`
- ✅ SQL 查询强制过滤 `WHERE tenant_id = $1`
- ✅ 用户无法通过修改请求参数访问其他用户的数据

### 3. 文件组织结构

**本地存储示例：**
```
backend/uploads/
├── a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11/  # 用户 A 的文件夹
│   ├── image-1704729600000.jpg
│   └── image-1704729700000.jpg
└── b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22/  # 用户 B 的文件夹
    ├── image-1704729800000.jpg
    └── image-1704729900000.jpg
```

**OSS/Supabase 路径示例：**
```
wordpecker/images/a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11/1704729600000-abc123-image.jpg
wordpecker/images/b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22/1704729800000-def456-image.jpg
```

### 4. 前端组件

已创建 `frontend/src/components/ImageDescriptionHistory.tsx`：
- ✅ 显示用户的历史练习记录
- ✅ 卡片式布局，显示图片缩略图
- ✅ 点击查看详情（图片、描述、AI 反馈）
- ✅ 响应式设计

## 如何在 ImageDescription 页面中集成

### 方案 1：添加 Tabs 切换（推荐）

在 `frontend/src/pages/ImageDescription.tsx` 中，将整个内容包裹在 Tabs 中：

```tsx
// 在 return 语句中
return (
  <Box minH="100vh" bg={useColorModeValue('gray.50', '#0F172A')}>
    <Container maxW="container.xl" py={8} px={{ base: 4, md: 8 }}>
      <VStack spacing={8} align="stretch">
        {/* 标题部分保持不变 */}
        <Flex justify="space-between" align="center">
          <Heading>Vision Garden</Heading>
        </Flex>

        {/* 添加 Tabs */}
        <Tabs colorScheme="green" variant="enclosed">
          <TabList>
            <Tab>🌱 新练习</Tab>
            <Tab>📚 历史记录</Tab>
          </TabList>

          <TabPanels>
            {/* 第一个 Tab：原有的练习功能 */}
            <TabPanel>
              {/* 将原来的所有 state === 'setup' / 'describing' / 'results' 的内容放这里 */}
              {state === 'setup' && (...)}
              {state === 'describing' && (...)}
              {state === 'results' && (...)}
            </TabPanel>

            {/* 第二个 Tab：历史记录 */}
            <TabPanel>
              <ImageDescriptionHistory />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>
    </Container>
  </Box>
);
```

### 方案 2：添加独立按钮（简单）

在页面顶部添加一个"查看历史"按钮，点击后打开 Modal：

```tsx
const { isOpen: isHistoryOpen, onOpen: onHistoryOpen, onClose: onHistoryClose } = useDisclosure();

// 在标题旁边添加按钮
<HStack>
  <Heading>Vision Garden</Heading>
  <Button 
    leftIcon={<Text>📚</Text>} 
    onClick={onHistoryOpen}
    colorScheme="blue"
    variant="outline"
  >
    查看历史
  </Button>
</HStack>

// 在页面底部添加 Modal
<Modal isOpen={isHistoryOpen} onClose={onHistoryClose} size="full">
  <ModalOverlay />
  <ModalContent>
    <ModalHeader>我的练习历史</ModalHeader>
    <ModalCloseButton />
    <ModalBody>
      <ImageDescriptionHistory />
    </ModalBody>
  </ModalContent>
</Modal>
```

## 测试步骤

1. **生成几张图片**
   - 访问 Vision Garden 页面
   - 生成 2-3 张图片并完成描述

2. **查看历史记录**
   - 切换到"历史记录" Tab（或点击"查看历史"按钮）
   - 应该能看到刚才生成的图片

3. **验证安全性**
   - 使用不同的账号登录
   - 每个用户只能看到自己的历史记录
   - 图片 URL 中包含用户的 ID

4. **检查文件存储**
   - 本地存储：查看 `backend/uploads/{tenantId}/` 目录
   - 应该按用户分别存储

## 注意事项

1. **图片 URL 的公开性**
   - 虽然文件按用户组织，但 URL 仍然是公开的
   - 如果需要更严格的访问控制，需要添加签名 URL 或访问令牌

2. **存储空间管理**
   - 建议定期清理旧图片
   - 可以添加图片过期时间或用户配额限制

3. **性能优化**
   - 历史记录默认只加载最近 20 条
   - 可以添加分页或无限滚动

## 文件清单

### 新增文件
- `frontend/src/components/ImageDescriptionHistory.tsx` - 历史记录组件

### 修改文件
- `backend/src/services/storage/types.ts` - 添加 tenantId 参数
- `backend/src/services/storage/local-storage.ts` - 按用户组织文件
- `backend/src/services/storage/oss-storage.ts` - 按用户组织文件
- `backend/src/services/storage/supabase-storage.ts` - 按用户组织文件
- `backend/src/api/image-description/routes.ts` - 传递 tenantId
- `frontend/src/pages/ImageDescription.tsx` - 需要集成历史记录组件（待完成）

## 下一步

请选择一种集成方案（Tabs 或 Modal），我可以帮你完成 `ImageDescription.tsx` 的修改。
