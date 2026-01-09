#!/usr/bin/env python3
"""
Add Tabs integration to ImageDescription.tsx
"""

# Read the original file
with open('frontend/src/pages/ImageDescription.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Tabs start code to insert after line 323
tabs_start = """
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
"""

# Tabs end code to insert after line 1014 (which will be 1034 after first insertion)
tabs_end = """
              </TabPanel>

              <TabPanel px={0} py={6}>
                <ImageDescriptionHistory />
              </TabPanel>
            </TabPanels>
          </Tabs>

        </VStack>
"""

# Insert tabs_start after line 323 (index 322)
new_lines = lines[:323] + [tabs_start] + lines[323:]

# Now insert tabs_end after line 1014 + 1 (because we added tabs_start)
# Line 1014 is now at index 1014 (0-indexed: 1013)
# We need to insert after the </Modal> line
# Find the line with </Modal> after line 1000
modal_end_index = None
for i in range(1000, len(new_lines)):
    if '</Modal>' in new_lines[i] and 'ModalContent' not in new_lines[i]:
        modal_end_index = i
        break

if modal_end_index:
    # Insert after </Modal>
    final_lines = new_lines[:modal_end_index+1] + [tabs_end] + new_lines[modal_end_index+1:]
    
    # Remove the old </VStack> line if it exists after our insertion
    # It should be around line 1015-1020
    for i in range(modal_end_index+2, min(modal_end_index+10, len(final_lines))):
        if final_lines[i].strip() == '</VStack>':
            final_lines.pop(i)
            break
    
    # Write the new file
    with open('frontend/src/pages/ImageDescription.tsx', 'w', encoding='utf-8') as f:
        f.writelines(final_lines)
    
    print("✅ Tabs integration completed successfully!")
    print(f"   - Inserted Tabs start after line 323")
    print(f"   - Inserted Tabs end after line {modal_end_index+1}")
    print(f"   - Total lines: {len(final_lines)}")
else:
    print("❌ Could not find </Modal> line")
