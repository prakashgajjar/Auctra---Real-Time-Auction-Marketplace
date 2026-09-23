import * as adminService from '../services/admin.service.js';
import { successResponse } from '../utils/api-response.js';

export async function listUsersController(req, res, next) {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '20', 10);
    const { role, status, search } = req.query;

    const result = await adminService.listUsers({ page, limit, role, status, search });
    return successResponse(res, result.users, 'Users retrieved successfully', 200, result.pagination);
  } catch (err) {
    next(err);
  }
}

export async function getUserDetailsController(req, res, next) {
  try {
    const result = await adminService.getUserDetails(req.params.id);
    return successResponse(res, result, 'User details retrieved successfully');
  } catch (err) {
    next(err);
  }
}

export async function updateUserStatusController(req, res, next) {
  try {
    const adminContext = {
      adminId: req.user.id,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    };
    const user = await adminService.updateUserStatus(
      req.params.id,
      req.body.status,
      req.body.reason,
      adminContext
    );
    return successResponse(res, { user }, 'User status updated successfully');
  } catch (err) {
    next(err);
  }
}

export async function updateUserRoleController(req, res, next) {
  try {
    const adminContext = {
      adminId: req.user.id,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    };
    const user = await adminService.updateUserRole(
      req.params.id,
      req.body.role,
      req.body.reason,
      adminContext
    );
    return successResponse(res, { user }, 'User role updated successfully');
  } catch (err) {
    next(err);
  }
}

export async function listSellerApplicationsController(req, res, next) {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '20', 10);
    const { status } = req.query;

    const result = await adminService.listSellerApplications({ page, limit, status });
    return successResponse(
      res,
      result.applications,
      'Seller applications retrieved successfully',
      200,
      result.pagination
    );
  } catch (err) {
    next(err);
  }
}

export async function reviewSellerApplicationController(req, res, next) {
  try {
    const adminContext = {
      adminId: req.user.id,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    };
    const profile = await adminService.reviewSellerApplication(
      req.params.id,
      req.body.status,
      req.body.rejectionReason,
      adminContext
    );
    return successResponse(
      res,
      { profile },
      `Seller application ${req.body.status.toLowerCase()} successfully.`
    );
  } catch (err) {
    next(err);
  }
}
