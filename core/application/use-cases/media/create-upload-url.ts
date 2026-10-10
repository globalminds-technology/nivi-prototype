import { ValidationError } from "../../../domain/errors/domain-errors";
import { isImageContentType, type ImageContentType, GALLERY_INDEX } from "../../../domain/value-objects/gallery";
import { toSku } from "../../../domain/value-objects/sku";
import type { ImageStorage, PresignedUpload } from "../../ports/image-storage";

export interface CreateUploadUrlInput {
  sku: string;
  index: number;
  contentType: string;
}

export class CreateUploadUrl {
  constructor(private readonly imageStorage: ImageStorage) {}

  async execute(input: CreateUploadUrlInput): Promise<PresignedUpload> {
    const sku = toSku(input.sku);

    if (input.index < GALLERY_INDEX.min || input.index > GALLERY_INDEX.max) {
      throw new ValidationError(
        `Gallery image index must be between ${GALLERY_INDEX.min} and ${GALLERY_INDEX.max} (01 is reserved for Zoho primary image)`,
        { index: input.index },
      );
    }

    if (!isImageContentType(input.contentType)) {
      throw new ValidationError("Unsupported image content type. Allowed: image/jpeg, image/png, image/webp", {
        contentType: input.contentType,
      });
    }

    return this.imageStorage.createUploadUrl(sku, input.index, input.contentType as ImageContentType);
  }
}
