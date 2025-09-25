# Image Upload Architecture Plan for Inkray Articles

## Overview

This document outlines the comprehensive plan for implementing image handling in Inkray articles using the Crepe editor, integrated with the existing Walrus quilt system. The solution addresses the requirement to upload all files (article + media) together at publication time while providing deterministic backend URLs for images inserted during editing.

## Current System Analysis

### Existing Walrus Quilt Structure
- **Article Content**: Stored as `"article"` identifier (markdown or encrypted binary with Seal for gated content)
- **Media Files**: Stored as sequential identifiers (`"media0"`, `"media1"`, `"media2"`, etc.) - **UNENCRYPTED**
- **File Metadata**: Tags containing `content-type`, `filename`, `original-size`, `media-index`
- **Encryption Policy**: Only article content uses Seal encryption, media files remain unencrypted for direct serving

### Current Requirements
- **Deferred Upload**: Upload all files (article + media) together at publication time for single Walrus quilt
- **Immediate URL Response**: Crepe's `onUpload` callback expects immediate URL return for markdown insertion
- **Deterministic URLs**: Need consistent URLs that remain unchanged in the final article markdown
- **Editor Previews**: Crepe/Milkdown handles image previews automatically - no custom preview logic needed

## Proposed Solution Architecture

### 1. Temporary Image Storage System

#### Frontend Temporary Storage
```typescript
interface TemporaryImage {
  id: string;                    // Unique identifier (UUID)
  file: File;                    // Original file object
  filename: string;              // Original filename
  mimeType: string;              // File MIME type
  size: number;                  // File size in bytes
  index: number;                 // Predicted media index (media0, media1, etc.)
  finalUrl: string;              // Final URL that will remain in markdown
}
```

#### Temporary Image Manager Service
```typescript
class TemporaryImageManager {
  private images: Map<string, TemporaryImage> = new Map();
  private indexCounter = 0;
  private articleSlug: string | null = null; // Will be set when known

  // Add image and return final deterministic URL that stays in markdown
  addImage(file: File): string {
    const id = crypto.randomUUID();
    const index = this.indexCounter++;
    
    // Generate the final URL that will be used in the published article
    // This URL will remain unchanged in the markdown
    const finalUrl = `${process.env.NEXT_PUBLIC_API_URL}/articles/media/media${index}`;
    
    const tempImage: TemporaryImage = {
      id,
      file,
      filename: file.name,
      mimeType: file.type,
      size: file.size,
      index,
      finalUrl
    };
    
    this.images.set(finalUrl, tempImage); // Key by final URL
    return finalUrl; // Return the final URL that stays in markdown
  }

  // Get image by final URL for preview serving
  getImageByUrl(url: string): TemporaryImage | undefined {
    return this.images.get(url);
  }

  // Get all images for final upload
  getAllImages(): TemporaryImage[] {
    return Array.from(this.images.values()).sort((a, b) => a.index - b.index);
  }

  // Clear all temporary images
  clear(): void {
    this.images.clear();
    this.indexCounter = 0;
  }
}
```

### 2. Article Editor Integration

#### Modified Crepe Configuration
```typescript
// In ArticleEditor.tsx
const tempImageManager = useRef(new TemporaryImageManager());

const { get } = useEditor((root) => {
  const crepe = new Crepe({
    root,
    defaultValue: initialValue,
    features: {
      [Crepe.Feature.ImageBlock]: true,
      // ... other features
    },
  })

  crepe.editor.config((ctx) => {
    ctx.update(Crepe.Feature.ImageBlock, () => ({
      onUpload: async (file: File) => {
        // Validate file
        const validation = validateImageFile(file);
        if (!validation.isValid) {
          throw new Error(validation.errors.join(', '));
        }
        
        // Add to temporary storage and return FINAL URL that stays in markdown
        const finalUrl = tempImageManager.current.addImage(file);
        
        // Simulate upload delay for UX
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Return the final URL - this URL will remain in the markdown permanently
        // Example: "https://api.inkray.com/articles/media/media0"
        return finalUrl;
      },
      captionPlaceholderText: placeholder || 'Add image caption...',
    }))
  })

  return crepe.editor
})

// Expose method to get all temporary images
const getTemporaryImages = useCallback(() => {
  return tempImageManager.current.getAllImages();
}, []);
```

### 3. Backend API Integration

#### Enhanced Article Creation (No URL Transformation Needed)
```typescript
// The article creation process remains largely unchanged
// since the markdown already contains the final URLs
async createArticle(createArticleDto: CreateArticleDto & { 
  tempImages?: TempImageData[] 
}): Promise<ArticleCreationResponseDto> {
  
  // 1. The content already has final URLs like "/articles/media/media0"
  // No URL transformation needed - markdown is ready to use
  
  // 2. Process temporary images and map them to media identifiers
  const mediaFiles = await this.processTempImages(createArticleDto.tempImages || []);
  
  // 3. Prepare files for quilt upload (existing logic)
  const files = this.prepareFilesForUpload({
    ...createArticleDto,
    content: createArticleDto.content, // Use content as-is
    mediaFiles
  });
  
  // 4. Continue with existing upload flow...
}

private async processTempImages(tempImages: TempImageData[]): Promise<MediaFileData[]> {
  // Map temporary images to their expected media identifiers
  // NOTE: Media files are stored UNENCRYPTED - only article content uses Seal encryption
  return tempImages.map((img, index) => ({
    content: img.base64Content, // Raw image data, no encryption
    filename: img.filename,
    mimeType: img.mimeType,
    size: img.size,
    identifier: `media${index}`, // This matches the URL: https://api.inkray.com/articles/media/media0
    tags: {
      'content-type': img.mimeType,
      'media-index': index.toString(),
      'original-size': img.size.toString(),
      'filename': img.filename,
      'encrypted': 'false' // Explicitly mark as unencrypted
    }
  }));
}
```

#### New Media Serving Endpoint
```typescript
// Backend: /articles/media/:mediaId
@Controller('articles')
export class ArticlesController {
  
  @Get('media/:mediaId')
  async getMediaFile(
    @Param('mediaId') mediaId: string,
    @Query('articleId') articleId?: string,
    @Res() res: Response
  ) {
    // This serves UNENCRYPTED media files directly from Walrus after publication
    // Media files are never encrypted - only article content uses Seal encryption
    
    if (!articleId) {
      throw new BadRequestException('Article ID required');
    }
    
    try {
      // Get article to find quilt blob ID
      const article = await this.articlesService.getArticleById(articleId);
      
      // Get unencrypted media file directly from Walrus quilt
      const mediaFile = await this.walrusService.getQuiltFile(
        article.quiltBlobId, 
        mediaId
      );
      
      // Media files are served directly (no decryption needed)
      res.setHeader('Content-Type', mediaFile.contentType);
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year cache
      res.send(mediaFile.content); // Raw binary content
      
    } catch (error) {
      throw new NotFoundException(`Media file ${mediaId} not found`);
    }
  }
}
```

### 4. Integration with Article Creation Hook

#### Simplified useArticleCreation (No URL Transformation)
```typescript
export const useArticleCreation = () => {
  const createAndPublishArticle = useCallback(
    async (
      title: string,
      content: string, // Content already has final URLs like "/articles/media/media0"
      summary: string,
      categoryId: string,
      tempImages: TemporaryImage[] = [], // New parameter
      gated: boolean = false
    ): Promise<ArticleUploadResult> => {
      
      // 1. Convert temporary images to MediaFiles for upload
      const mediaFiles: MediaFile[] = await Promise.all(
        tempImages.map(async (tempImg) => {
          const buffer = await tempImg.file.arrayBuffer();
          const uint8Array = new Uint8Array(buffer);
          const base64 = toBase64(uint8Array);
          
          return {
            content: base64,
            filename: tempImg.filename,
            mimeType: tempImg.mimeType,
            size: tempImg.size,
          };
        })
      );

      // 2. No URL transformation needed! 
      // The markdown content already contains the final URLs that will work
      // after publication: "https://api.inkray.com/articles/media/media0", etc.

      // 3. Continue with existing creation flow using content as-is
      return await existingCreateAndPublishArticle(
        title,
        content, // Use content directly - URLs are already correct
        summary,
        categoryId,
        mediaFiles,
        gated
      );
    },
    [/* dependencies */]
  );

  return {
    createAndPublishArticle,
    // ... other methods
  };
};
```

### 5. Frontend Component Integration

#### Updated Create Article Page
```typescript
export default function CreateArticlePage() {
  const [tempImages, setTempImages] = useState<TemporaryImage[]>([]);
  const editorRef = useRef<{ getTemporaryImages: () => TemporaryImage[] }>();

  const handlePublish = async () => {
    // Get temporary images from editor
    const currentTempImages = editorRef.current?.getTemporaryImages() || [];
    
    try {
      await createAndPublishArticle(
        title,
        content,
        summary,
        categoryId,
        currentTempImages, // Pass temporary images
        gated
      );
      
      // Clear temporary images after successful upload
      setTempImages([]);
      
    } catch (error) {
      // Handle error
    }
  };

  return (
    <div>
      <MilkdownEditorWrapper>
        <ArticleEditor
          ref={editorRef}
          initialValue={content}
          onChange={setContent}
          onTempImagesChange={setTempImages}
        />
      </MilkdownEditorWrapper>
      
      {/* Show image upload status */}
      {tempImages.length > 0 && (
        <div className="mb-4">
          <p className="text-sm text-gray-600">
            {tempImages.length} image(s) ready for upload
          </p>
        </div>
      )}
      
      <Button onClick={handlePublish}>
        Publish Article
      </Button>
    </div>
  );
}
```

### 6. Image Validation System

#### Comprehensive Image Validation
```typescript
interface ImageValidation {
  isValid: boolean;
  errors: string[];
}

function validateImageFile(file: File): ImageValidation {
  const errors: string[] = [];
  
  // MIME type validation
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    errors.push(`Unsupported file type: ${file.type}`);
  }
  
  // File size validation (10MB limit)
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    errors.push(`File too large: ${file.size} bytes (max ${maxSize})`);
  }
  
  // Filename validation
  if (!/^[a-zA-Z0-9._-]+$/.test(file.name)) {
    errors.push('Invalid filename characters');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}
```

## Implementation Benefits

### 1. **Deferred Upload Strategy**
- All files uploaded together in single Walrus quilt
- Maintains atomic article+media creation
- Reduces storage costs and complexity

### 2. **Deterministic URLs**
- Predictable URLs for editor preview
- Consistent markdown formatting
- Easy URL transformation at publication time

### 3. **Simplified User Experience**
- Automatic image previews handled by Crepe/Milkdown editor
- Progress indication during upload
- Validation feedback before upload

### 4. **System Reliability**
- Temporary storage cleanup
- Validation at multiple stages
- Error handling and recovery

### 5. **Scalability**
- Efficient batched uploads
- Minimal backend storage overhead
- Compatible with existing Walrus architecture

## Migration Strategy

### Phase 1: Core Infrastructure
1. Implement TemporaryImageManager service
2. Add image validation utilities
3. Create markdown processing utilities

### Phase 2: Editor Integration
1. Modify ArticleEditor to use temporary storage
2. Update Crepe ImageBlock configuration
3. Integrate validation with Crepe onUpload callback

### Phase 3: Backend Integration
1. Modify article creation to handle temp images
2. Implement media serving endpoint
3. Test end-to-end upload flow

### Phase 4: Testing & Optimization
1. Comprehensive testing of upload flow
2. Performance optimization
3. Error handling refinement

## Security Considerations

### 1. **File Validation**
- Magic byte verification
- MIME type validation
- Size and count limits
- Filename sanitization

### 2. **Temporary Storage**
- UUID-based identifiers
- Automatic cleanup
- Minimal memory overhead (no blob URLs)

### 3. **URL Security**
- No direct file system access
- Deterministic but unpredictable URLs
- Validation at multiple stages

## Future Enhancements

### 1. **Advanced Features**
- Image compression and optimization
- Multiple image formats support
- Drag-and-drop image reordering
- Image metadata preservation

### 2. **Performance Optimizations**
- Progressive image uploads
- Image compression before storage
- Caching strategies
- CDN integration

### 3. **User Experience**
- Image editing capabilities
- Batch image operations
- Upload progress indicators
- Drag-and-drop improvements

This architecture provides a robust, scalable solution for image handling in Inkray articles while maintaining compatibility with the existing Walrus quilt system and ensuring optimal user experience during article creation.