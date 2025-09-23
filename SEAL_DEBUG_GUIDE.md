# Seal Debugging Guide - "Invalid typed array length: 32" Error

## Overview
We've added comprehensive tracing to the `SealService.decryptContent()` method to help diagnose the "Invalid typed array length: 32" error that occurs during Seal decryption operations.

## How to Capture Debug Information

### 1. Reproduce the Error
1. Open the browser's Developer Console (F12)
2. Navigate to the Console tab
3. Attempt to decrypt content that triggers the error
4. The console will display a detailed trace with a unique trace ID

### 2. Debug Output Format
The trace will appear as a collapsible group with the format:
```
🔍 SEAL DECRYPT TRACE [seal-decrypt-1703123456789-abc123def] - 2023-12-21T10:30:45.123Z
```

### 3. Key Information Sections

#### Input Parameters (Phase 1)
- **encryptedDataLength**: Length of the encrypted data
- **encryptedDataType**: JavaScript type (should be Uint8Array)
- **encryptedDataPreview**: First 16 bytes in hex format
- **contentId**: The hex-encoded content ID
- **contentIdLength**: Character length of the content ID
- **articleId**: The article object ID

#### Content ID Conversion (Phase 2)
- **Before conversion**: Raw hex string from database
- **After fromHex conversion**: Converted to Uint8Array
- **expectedLength**: Should be 43 bytes (tag=1, version=2, address=32, nonce=8)
- **actualBytes**: Complete byte array for validation

#### Critical Seal SDK Call (Phase 8-10)
- **Step 10**: The actual `sealClient.decrypt()` call where the error likely occurs
- **Seal decrypt parameters**: All parameters passed to the Seal SDK
- **SessionKey properties**: Introspected session key state
- **Transaction bytes**: Complete transaction data

## Error Information
When the error occurs, look for:
```
💥 SEAL DECRYPT ERROR - FULL DEBUG CONTEXT:
```

This section contains:
- **Full error stack trace**
- **Input parameter state at time of error**
- **Environment information** (browser, network, package ID)
- **Execution context** (which step failed)

## Information to Share with Seal Team

### Essential Data Points
1. **Trace ID**: The unique identifier for this error instance
2. **Content ID Analysis**:
   - Original hex string
   - Converted byte array
   - Length validation (expected vs actual)
3. **Encrypted Data**:
   - Type validation
   - Length information
   - First 32 bytes preview
4. **Session Key State**:
   - Type and properties
   - Signature status
5. **Transaction Parameters**:
   - Built transaction bytes
   - Dry run results
6. **Error Context**:
   - Exact error message and stack trace
   - Which step in the process failed

### Copy Console Output
1. Right-click on the trace group in console
2. Select "Copy object" or "Copy"
3. Paste the complete output in your report to the Seal team

## Common Issues to Check

### Content ID Length Issues
- Expected: 43 bytes for BCS-encoded IdV1 struct
- Check if the content ID is properly formatted
- Verify hex conversion is working correctly

### Data Type Issues
- Encrypted data should be Uint8Array
- Session key should be properly initialized
- Transaction bytes should be valid

### Network Configuration
- Verify correct key server IDs for the network
- Check package ID format and validity
- Ensure proper Sui client connection

## File Location
The tracing code is located in:
`src/lib/services/SealService.ts` in the `decryptContent()` method

## Disable Tracing
To disable verbose logging for production, comment out or remove the console.log statements in the `decryptContent()` method while preserving the core functionality.