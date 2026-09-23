import * as productService from '../services/product.service.js';
import { successResponse } from '../utils/api-response.js';

export async function createProductController(req, res, next) {
  try {
    const product = await productService.createProduct(req.user.id, req.body);
    return successResponse(res, { product }, 'Product created successfully', 201);
  } catch (err) {
    next(err);
  }
}

export async function listPublicProductsController(req, res, next) {
  try {
    const query = req.validatedQuery || req.query;
    const result = await productService.listPublicProducts(query);
    return successResponse(
      res,
      result.products,
      'Products retrieved successfully',
      200,
      result.pagination
    );
  } catch (err) {
    next(err);
  }
}


export async function listSellerProductsController(req, res, next) {
  try {
    const products = await productService.listSellerProducts(req.user.id);
    return successResponse(res, { products }, 'Seller products retrieved successfully');
  } catch (err) {
    next(err);
  }
}

export async function getProductByIdController(req, res, next) {
  try {
    const product = await productService.getProductById(req.params.id);
    return successResponse(res, { product }, 'Product retrieved successfully');
  } catch (err) {
    next(err);
  }
}

export async function updateProductController(req, res, next) {
  try {
    const product = await productService.updateProduct(req.user.id, req.params.id, req.body);
    return successResponse(res, { product }, 'Product updated successfully');
  } catch (err) {
    next(err);
  }
}

export async function deleteProductController(req, res, next) {
  try {
    const result = await productService.deleteProduct(req.user.id, req.params.id);
    return successResponse(res, result, 'Product deleted successfully');
  } catch (err) {
    next(err);
  }
}
