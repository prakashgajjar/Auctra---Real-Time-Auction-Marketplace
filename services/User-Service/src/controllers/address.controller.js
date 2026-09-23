import * as addressService from '../services/address.service.js';
import { successResponse } from '../utils/api-response.js';

export async function listAddressesController(req, res, next) {
  try {
    const addresses = await addressService.listAddresses(req.user.id);
    return successResponse(res, { addresses }, 'Addresses retrieved successfully');
  } catch (err) {
    next(err);
  }
}

export async function createAddressController(req, res, next) {
  try {
    const context = {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    };
    const address = await addressService.createAddress(req.user.id, req.body, context);
    return successResponse(res, { address }, 'Address created successfully', 201);
  } catch (err) {
    next(err);
  }
}

export async function updateAddressController(req, res, next) {
  try {
    const context = {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    };
    const address = await addressService.updateAddress(req.user.id, req.params.id, req.body, context);
    return successResponse(res, { address }, 'Address updated successfully');
  } catch (err) {
    next(err);
  }
}

export async function deleteAddressController(req, res, next) {
  try {
    const context = {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    };
    const result = await addressService.deleteAddress(req.user.id, req.params.id, context);
    return successResponse(res, result, 'Address deleted successfully');
  } catch (err) {
    next(err);
  }
}

export async function setDefaultAddressController(req, res, next) {
  try {
    const context = {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    };
    const address = await addressService.setDefaultAddress(req.user.id, req.params.id, context);
    return successResponse(res, { address }, 'Default address updated successfully');
  } catch (err) {
    next(err);
  }
}
