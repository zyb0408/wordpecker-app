#!/usr/bin/env python3
"""
Add Tabs integration to ImageDescription.tsx - Final correct version
"""

# Read the original file
with open('frontend/src/pages/ImageDescription.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Split into lines
lines = content.split('\n')

# Find the line numbers
flex_end_line = None
modal_end_line = None
container_end_line = None

for i, line in enumerate(lines):
    # Find </Flex> around line 323
    if i > 320 and i < 330 and '</Flex>' in line and flex_end_line is None:
        flex_end_line = i
    # Find </Modal> around line 1014
    if i > 1010 and '</Modal>' in line and 'ModalContent' not in line:
        modal_end_line = i
    # Find </Container> after modal
    if modal_end_line and i > modal_end_line and '</Container>' in line:
        container_end_line = i
        break

print(f"Found flex_end at line {flex_end_line + 1}")
print(f"Found modal_end at line {modal_end_line + 1}")
print(f"Found container_end at line {container_end_line + 1}")

if not all([flex_end_line, modal_end_line, container_end_line]):
    print("Error: Could not find all required lines")
    exit(1)

# Tabs start code
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

# Tabs end code (to insert before </Container>)
tabs_end = """
              </TabPanel>

              <TabPanel px={0} py={6}>
                <ImageDescriptionHistory />
              </TabPanel>
            </TabPanels>
          </Tabs>

        </VStack>"""

# Build new content
new_lines = []

for i, line in enumerate(lines):
    # Insert Tabs start after </Flex>
    if i == flex_end_line:
        new_lines.append(line)
        new_lines.extend(tabs_start.split('\n'))
    # Insert Tabs end and </VStack> before </Container>
    elif i == container_end_line:
        new_lines.extend(tabs_end.split('\n'))
        new_lines.append(line)
    else:
        new_lines.append(line)

# Write the new file
with open('frontend/src/pages/ImageDescription.tsx', 'w', encoding='utf-8') as f:
    f.write('\n'.join(new_lines))

print(f"\n✅ Tabs integration completed!")
print(f"   Total lines: {len(new_lines)}")
print(f"\n🎉 Done! The file should now have Tabs integration.")
