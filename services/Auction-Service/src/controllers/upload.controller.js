import * as uploadService from '../services/upload.service.js';
import { successResponse, errorResponse } from '../utils/api-response.js';

export async function generatePresignedUrlController(req, res, next) {
  try {
    const { filename, fileType } = req.body;
    if (!filename || !fileType) {
      return errorResponse(res, 'Filename and fileType are required.', 400, 'MISSING_PARAMS');
    }

    const result = await uploadService.generatePresignedUploadUrl({
      filename,
      fileType,
      sellerId: req.user.id,
    });

    return successResponse(res, result, 'Upload URL generated successfully');
  } catch (err) {
    next(err);
  }
}

export function mockUploadReceiver(req, res) {
  return successResponse(res, { uploaded: true }, 'Mock file uploaded successfully');
}
