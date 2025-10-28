# Browser Automation Examples

This document provides detailed examples of common browser automation tasks using the Stagehand Skill.

## Example 1: Extract Product Information from E-commerce

**User request**: "Go to example.com/product/123 and extract the product details"

**Workflow**:

1. **Navigate** to the product page:
   ```
   Tool: mcp__stagehand__navigate
   URL: https://example.com/product/123
   ```

2. **Extract** product data with schema:
   ```
   Tool: mcp__stagehand__extract
   Instruction: "Extract the product information"
   Schema: {
     "productName": "string",
     "price": "number",
     "currency": "string",
     "inStock": "boolean",
     "rating": "number",
     "reviewCount": "number"
   }
   ```

3. **Close** the browser:
   ```
   Tool: mcp__stagehand__close_browser
   ```

**Expected result**: JSON object with product details that can be analyzed or stored.

---

## Example 2: Fill Out and Submit a Contact Form

**User request**: "Fill out the contact form on example.com with my information"

**Workflow**:

1. **Navigate** to contact page:
   ```
   Tool: mcp__stagehand__navigate
   URL: https://example.com/contact
   ```

2. **Act**: Fill in name field:
   ```
   Tool: mcp__stagehand__act
   Action: "Fill in the name field with 'John Doe'"
   ```

3. **Act**: Fill in email field:
   ```
   Tool: mcp__stagehand__act
   Action: "Fill in the email field with 'john.doe@example.com'"
   ```

4. **Act**: Fill in message field:
   ```
   Tool: mcp__stagehand__act
   Action: "Fill in the message field with 'I would like to inquire about your services'"
   ```

5. **Act**: Submit the form:
   ```
   Tool: mcp__stagehand__act
   Action: "Click the Submit button"
   ```

6. **Screenshot** to capture confirmation:
   ```
   Tool: mcp__stagehand__screenshot
   ```

7. **Close** the browser:
   ```
   Tool: mcp__stagehand__close_browser
   ```

---

## Example 3: Research and Summarize News Articles

**User request**: "Check the latest tech news on techcrunch.com and summarize the top stories"

**Workflow**:

1. **Navigate** to news site:
   ```
   Tool: mcp__stagehand__navigate
   URL: https://techcrunch.com
   ```

2. **Extract** article headlines and summaries:
   ```
   Tool: mcp__stagehand__extract
   Instruction: "Extract the top 5 article headlines and their summaries"
   Schema: {
     "headlines": "string",
     "summary": "string",
     "author": "string",
     "publishedDate": "string"
   }
   ```

3. **Close** the browser:
   ```
   Tool: mcp__stagehand__close_browser
   ```

4. Analyze and summarize the extracted data using Claude's text analysis capabilities.

---

## Example 4: Login and Navigate Authenticated Area

**User request**: "Log into example.com and navigate to my dashboard"

**Workflow**:

1. **Navigate** to login page:
   ```
   Tool: mcp__stagehand__navigate
   URL: https://example.com/login
   ```

2. **Act**: Fill in username:
   ```
   Tool: mcp__stagehand__act
   Action: "Fill in the username field with 'myusername'"
   ```

3. **Act**: Fill in password:
   ```
   Tool: mcp__stagehand__act
   Action: "Fill in the password field with 'mypassword'"
   ```

4. **Act**: Click login button:
   ```
   Tool: mcp__stagehand__act
   Action: "Click the Login button"
   ```

5. **Act**: Wait for page load:
   ```
   Tool: mcp__stagehand__act
   Action: "Wait for the page to fully load"
   ```

6. **Navigate** to dashboard:
   ```
   Tool: mcp__stagehand__navigate
   URL: https://example.com/dashboard
   ```

7. **Screenshot** the dashboard:
   ```
   Tool: mcp__stagehand__screenshot
   ```

8. **Close** the browser:
   ```
   Tool: mcp__stagehand__close_browser
   ```

**Note**: This example uses Chrome's user profile (`.chrome-profile/`) which may preserve session cookies between runs.

---

## Example 5: Search and Collect Results

**User request**: "Search Google for 'best TypeScript practices' and get the top 5 results"

**Workflow**:

1. **Navigate** to Google:
   ```
   Tool: mcp__stagehand__navigate
   URL: https://www.google.com
   ```

2. **Act**: Perform search:
   ```
   Tool: mcp__stagehand__act
   Action: "Type 'best TypeScript practices' in the search box and press Enter"
   ```

3. **Act**: Wait for results:
   ```
   Tool: mcp__stagehand__act
   Action: "Wait for search results to load"
   ```

4. **Extract** search results:
   ```
   Tool: mcp__stagehand__extract
   Instruction: "Extract the top 5 search results"
   Schema: {
     "title": "string",
     "url": "string",
     "snippet": "string"
   }
   ```

5. **Close** the browser:
   ```
   Tool: mcp__stagehand__close_browser
   ```

---

## Example 6: Download a File

**User request**: "Download the PDF file from example.com/documents/report.pdf"

**Workflow**:

1. **Navigate** to the file URL:
   ```
   Tool: mcp__stagehand__navigate
   URL: https://example.com/documents/report.pdf
   ```

2. **Act**: Wait for download to start:
   ```
   Tool: mcp__stagehand__act
   Action: "Wait for 5 seconds for the download to complete"
   ```

3. **Close** the browser:
   ```
   Tool: mcp__stagehand__close_browser
   ```

**Note**: Files are automatically downloaded to `./agent/downloads/` directory due to CDP configuration in the Stagehand initialization.

---

## Example 7: Debugging a Page Issue

**User request**: "Check why the submit button isn't working on example.com/form"

**Workflow**:

1. **Navigate** to the form page:
   ```
   Tool: mcp__stagehand__navigate
   URL: https://example.com/form
   ```

2. **Screenshot** initial state:
   ```
   Tool: mcp__stagehand__screenshot
   ```

3. **Observe** available elements:
   ```
   Tool: mcp__stagehand__observe
   Query: "Find all buttons and their states"
   ```

4. **Observe** form fields:
   ```
   Tool: mcp__stagehand__observe
   Query: "Find all form input fields and their required status"
   ```

5. **Act**: Try filling required fields:
   ```
   Tool: mcp__stagehand__act
   Action: "Fill in all required fields with test data"
   ```

6. **Screenshot** after filling:
   ```
   Tool: mcp__stagehand__screenshot
   ```

7. **Observe** button state again:
   ```
   Tool: mcp__stagehand__observe
   Query: "Check if the submit button is now enabled"
   ```

8. **Close** the browser:
   ```
   Tool: mcp__stagehand__close_browser
   ```

Analyze the screenshots and observations to determine the issue.

---

## Example 8: Multi-Page Data Collection

**User request**: "Extract product information from the first 3 pages of results on example.com/products"

**Workflow**:

1. **Navigate** to products page:
   ```
   Tool: mcp__stagehand__navigate
   URL: https://example.com/products
   ```

2. **Extract** products from page 1:
   ```
   Tool: mcp__stagehand__extract
   Instruction: "Extract all products on this page"
   Schema: {
     "name": "string",
     "price": "number",
     "imageUrl": "string"
   }
   ```

3. **Act**: Click next page:
   ```
   Tool: mcp__stagehand__act
   Action: "Click the Next Page button"
   ```

4. **Extract** products from page 2:
   ```
   Tool: mcp__stagehand__extract
   Instruction: "Extract all products on this page"
   Schema: {
     "name": "string",
     "price": "number",
     "imageUrl": "string"
   }
   ```

5. **Act**: Click next page:
   ```
   Tool: mcp__stagehand__act
   Action: "Click the Next Page button"
   ```

6. **Extract** products from page 3:
   ```
   Tool: mcp__stagehand__extract
   Instruction: "Extract all products on this page"
   Schema: {
     "name": "string",
     "price": "number",
     "imageUrl": "string"
   }
   ```

7. **Close** the browser:
   ```
   Tool: mcp__stagehand__close_browser
   ```

Combine and process all extracted data.

---

## Tips for Success

- **Be specific with natural language**: "Click the blue Submit button in the footer" is better than "click submit". This is **extremely important** because there's much ambiguity in many websites. 
- **Wait when needed**: After navigation or actions that trigger page changes, explicitly wait
- **Use observe for discovery**: When unsure what elements exist, use observe first
- **Take screenshots for debugging**: Visual confirmation helps understand what the browser sees
- **Handle errors gracefully**: If an action fails, try breaking it into smaller steps
- **Clean up resources**: Always close the browser when done to free up system resources
