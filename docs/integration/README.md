# Documentation Integration Guide

This folder contains ready-to-use documentation pages for integrating the Vara MCP Server into your documentation website.

## Files

| File | Platform | Description |
|------|----------|-------------|
| `docusaurus-page.mdx` | Docusaurus | MDX page with Tabs component and styled button |
| `mintlify-page.mdx` | Mintlify | MDX page using Mintlify components (Cards, Steps, etc.) |
| `cursor-button.css` | Any | CSS styles for the "Connect to Cursor" button |
| `cursor-deeplink.md` | Reference | Documentation on how the Cursor deep link works |

## Quick Setup

### For Docusaurus

1. Copy `docusaurus-page.mdx` to your `docs/tools/` folder
2. Add the CSS from `cursor-button.css` to your custom CSS
3. Add the page to your `sidebars.js`:

```js
module.exports = {
  docs: [
    // ... other items
    {
      type: 'category',
      label: 'Tools',
      items: ['tools/vara-mcp-server'],
    },
  ],
};
```

### For Mintlify

1. Copy `mintlify-page.mdx` to your docs folder (e.g., `tools/vara-mcp.mdx`)
2. Add to your `mint.json` navigation:

```json
{
  "navigation": [
    {
      "group": "Tools",
      "pages": ["tools/vara-mcp"]
    }
  ]
}
```

## Cursor Deep Link Format

The "Connect to Cursor" button uses a deep link to auto-install the MCP server:

```
cursor://anysphere.cursor-deeplink/mcp/install?name=vara-mcp&config=<base64-config>
```

The config is a base64-encoded JSON object:

```json
{
  "command": "npx",
  "args": ["vara-mcp-server"]
}
```

Base64 encoded: `eyJjb21tYW5kIjoibnB4IiwiYXJncyI6WyJ2YXJhLW1jcC1zZXJ2ZXIiXX0=`

### Generating Custom Deep Links

```javascript
const config = {
  command: "npx",
  args: ["vara-mcp-server"],
  env: {
    VARA_RPC_URL: "wss://testnet.vara.network"
  }
};

const base64Config = btoa(JSON.stringify(config));
const deepLink = `cursor://anysphere.cursor-deeplink/mcp/install?name=vara-mcp&config=${base64Config}`;
```

## Button Styles

The "Connect to Cursor" button should match Cursor's branding:

- Background: `#1a1a1a` (dark mode) or `#f5f5f5` (light mode)
- Text: White or dark gray
- Border radius: `8px`
- Icon: Cursor logo or generic cube icon
- Arrow indicator: `↗` for external link feel

See `cursor-button.css` for the full implementation.
