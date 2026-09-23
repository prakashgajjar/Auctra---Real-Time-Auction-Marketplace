import * as sellerService from '../services/seller.service.js';
import { successResponse } from '../utils/api-response.js';

export async function applySellerController(req, res, next) {
  try {
    const context = {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    };
    const profile = await sellerService.applyForSeller(req.user.id, req.body, context);
    return successResponse(
      res,
      { profile },
      'Seller application submitted successfully. Pending administrative verification.',
      201
    );
  } catch (err) {
    next(err);
  }
}

export async function getSellerProfileController(req, res, next) {
  try {
    const profile = await sellerService.getSellerProfile(req.user.id);
    return successResponse(res, { profile }, 'Seller profile retrieved successfully');
  } catch (err) {
    next(err);
  }
}

export async function updateSellerProfileController(req, res, next) {
  try {
    const context = {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    };
    const profile = await sellerService.updateSellerProfile(req.user.id, req.body, context);
    return successResponse(res, { profile }, 'Seller profile updated successfully');
  } catch (err) {
    next(err);
  }
}

export async function getPublicStoreController(req, res, next) {
  try {
    const store = await sellerService.getPublicStore(req.params.storeName);
    return successResponse(res, { store }, 'Public storefront retrieved successfully');
  } catch (err) {
    next(err);
  }
}
