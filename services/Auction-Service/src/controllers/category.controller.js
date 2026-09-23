import * as categoryService from '../services/category.service.js';
import { successResponse } from '../utils/api-response.js';

export async function listCategoriesController(req, res, next) {
  try {
    const categories = await categoryService.listCategories();
    return successResponse(res, { categories }, 'Categories retrieved successfully');
  } catch (err) {
    next(err);
  }
}

export async function getCategoryBySlugController(req, res, next) {
  try {
    const category = await categoryService.getCategoryBySlug(req.params.slug);
    return successResponse(res, { category }, 'Category retrieved successfully');
  } catch (err) {
    next(err);
  }
}
